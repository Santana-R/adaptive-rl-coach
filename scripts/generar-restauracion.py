"""Genera SQL desde un respaldo de la aplicación; nunca se conecta a una base.

Uso: python3 scripts/generar-restauracion.py snapshot.json restore.sql
     python3 scripts/generar-restauracion.py snapshot.json check.sql --check
El modo normal requiere tablas de aplicación vacías/inexistentes y Auth provisionado.
"""
import argparse
import csv
import json
import re
from pathlib import Path


def ident(value):
    return '"' + value.replace('"', '""') + '"'


def literal(value):
    return "'" + value.replace("'", "''") + "'"


def json_literal(value):
    text = json.dumps(value, ensure_ascii=False, separators=(',', ':'))
    marker = '$arc_backup$'
    while marker in text:
        marker = marker[:-1] + 'x$'
    return marker + text + marker + '::jsonb'


def generate(snapshot, check=False):
    if snapshot.get('policies'):
        raise ValueError('Este exportador no admite políticas RLS; utilizar un dump oficial para ese respaldo.')
    if any(col['generated'] for col in snapshot['columns']):
        raise ValueError('Este exportador no admite columnas calculadas; utilizar un dump oficial.')
    tables = snapshot['tables']
    columns = {name: [c for c in snapshot['columns'] if c['table'] == name] for name in tables}
    sql = ['-- Solo datos de aplicación. No incluye contraseñas, identidades ni sesiones Auth.',
           '-- Ejecutar con psql -X -v ON_ERROR_STOP=1. Requiere Supabase provisionado.', 'BEGIN;',
           "SET LOCAL statement_timeout = '60s';"]
    target = lambda name: ('pg_temp.' + ident('arc_restore_' + name)) if check else 'public.' + ident(name)
    if check:
        sql += ['-- Solo IDs respaldados para verificar la FK externa; no recrea cuentas Auth.',
                'CREATE TEMP TABLE arc_restore_auth_users (id uuid PRIMARY KEY) ON COMMIT DROP;',
                'INSERT INTO pg_temp.arc_restore_auth_users SELECT id_usuario FROM '
                + 'jsonb_populate_recordset(NULL::public.usuarios, ' + json_literal(tables.get('usuarios', [])) + ');']
    if not check:
        sql += ['CREATE SCHEMA IF NOT EXISTS arc_private;', 'SET LOCAL check_function_bodies = off;']
    for name in tables:
        definitions = []
        for col in columns[name]:
            definition = ident(col['name']) + ' ' + col['type']
            if col['identity']:
                definition += ' GENERATED ' + ('ALWAYS' if col['identity'] == 'a' else 'BY DEFAULT') + ' AS IDENTITY'
            elif col['default']:
                definition += ' DEFAULT ' + col['default']
            if col['not_null']:
                definition += ' NOT NULL'
            definitions.append(definition)
        if check:
            sql.append(f'CREATE TEMP TABLE {ident("arc_restore_" + name)} (\n  '
                       + ',\n  '.join(definitions) + '\n) ON COMMIT DROP;')
        else:
            sql.append(f'CREATE TABLE {target(name)} (\n  ' + ',\n  '.join(definitions) + '\n);')
            sql.append(f'ALTER TABLE {target(name)} ENABLE ROW LEVEL SECURITY;')
    for name, rows in tables.items():
        if rows:
            names = ', '.join(ident(c['name']) for c in columns[name] if not c['generated'])
            sql.append(f'INSERT INTO {target(name)} ({names}) OVERRIDING SYSTEM VALUE\n'
                       f'SELECT {names} FROM jsonb_populate_recordset(NULL::{target(name)}, {json_literal(rows)});')
    constraints = sorted(snapshot['constraints'], key=lambda c: (c['type'] == 'f', c['table'], c['name']))
    for constraint in constraints:
        if constraint['type'] == 't':
            continue  # Los constraint triggers se recrean desde pg_get_triggerdef.
        definition = constraint['definition']
        if check:
            definition = definition.replace('REFERENCES auth.users', 'REFERENCES pg_temp.arc_restore_auth_users')
            for name in tables:
                definition = re.sub(r'REFERENCES (?:public\.)?' + re.escape(name) + r'(?=\s|\()',
                                    lambda _m: 'REFERENCES ' + target(name), definition)
        sql.append(f'ALTER TABLE {target(constraint["table"])} ADD CONSTRAINT '
                   f'{ident(constraint["name"])} {definition};')
    if check:
        checks = []
        for name, rows in tables.items():
            # Compara solo las columnas capturadas: admite columnas aditivas posteriores.
            names = ', '.join(ident(c['name']) for c in columns[name])
            original = json_literal(rows)
            checks.append(f"IF EXISTS ((SELECT to_jsonb(t) FROM (SELECT {names} FROM {target(name)}) t "
                          f"EXCEPT SELECT value FROM jsonb_array_elements({original})) UNION ALL "
                          f"(SELECT value FROM jsonb_array_elements({original}) EXCEPT "
                          f"SELECT to_jsonb(t) FROM (SELECT {names} FROM {target(name)}) t)) "
                          f"THEN RAISE EXCEPTION 'Diferencias al restaurar {name}'; END IF;")
        sql += ['DO $verify$ BEGIN\n' + '\n'.join(checks) + '\nEND; $verify$;',
                f"SELECT {len(tables)} AS restored_tables, {sum(map(len, tables.values()))} AS restored_rows, "
                "'Datos, CHECK, PK, UNIQUE y FK internas verificados; Auth representado solo por IDs' AS scope;",
                'ROLLBACK;']
        return '\n\n'.join(sql) + '\n'
    for item in snapshot.get('indexes') or []:
        sql.append(item['definition'].rstrip(';') + ';')
    functions = (snapshot.get('private_functions') or []) + (snapshot.get('functions') or [])
    for fn in functions:
        if fn['identity'] == 'rls_auto_enable()':
            continue  # Función de plataforma, no se reemplaza en el proyecto destino.
        sql.append(fn['definition'].rstrip().rstrip(';') + ';')
        signature = fn['identity']
        if not signature.startswith('arc_private.'):
            signature = 'public.' + signature
        sql.append(f'REVOKE ALL ON FUNCTION {signature} FROM PUBLIC, anon, authenticated;')
        acl = fn.get('acl')
        if acl:
            if isinstance(acl, str):
                acl = next(csv.reader([acl.removeprefix('{').removesuffix('}')]))
            for grant in acl:
                role, permissions = grant.split('=', 1)
                if 'X' in permissions.split('/', 1)[0]:
                    sql.append(f'GRANT EXECUTE ON FUNCTION {signature} TO ' + (ident(role) if role else 'PUBLIC') + ';')
        else:
            sql.append(f'GRANT EXECUTE ON FUNCTION {signature} TO PUBLIC;')
    for trigger in snapshot.get('triggers') or []:
        sql.append(trigger['definition'].rstrip(';') + ';')
    for name in tables:
        sql.append(f'REVOKE ALL ON TABLE {target(name)} FROM PUBLIC, anon, authenticated;')
    for grant in snapshot.get('table_grants') or []:
        sql.append(f'GRANT {grant["privilege_type"]} ON TABLE public.{ident(grant["table_name"])} '
                   f'TO {ident(grant["grantee"])}' + (' WITH GRANT OPTION' if grant['is_grantable'] == 'YES' else '') + ';')
    sql.append('GRANT USAGE ON SCHEMA arc_private TO service_role;')
    for name in tables:
        for col in columns[name]:
            if col['identity']:
                relation = literal('public.' + ident(name))
                field = literal(col['name'])
                sql.append(f'SELECT setval(pg_get_serial_sequence({relation}, {field}), '
                           f'COALESCE((SELECT max({ident(col["name"])}) FROM {target(name)}), 1), '
                           f'EXISTS(SELECT 1 FROM {target(name)}));')
    sql += ['SET CONSTRAINTS ALL IMMEDIATE;', 'COMMIT;']
    return '\n\n'.join(sql) + '\n'


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('snapshot', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    snapshot = json.loads(args.snapshot.read_text())
    args.output.write_text(generate(snapshot, args.check))
    args.output.chmod(0o600)
    print(f'SQL generado para {len(snapshot["tables"])} tablas; ninguna base modificada.')
