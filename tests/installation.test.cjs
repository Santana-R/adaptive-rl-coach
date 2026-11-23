'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const database = path.join(__dirname, '..', 'database');
const installer = fs.readFileSync(path.join(database, 'instalar-a38.sql'), 'utf8');
const files = [...installer.matchAll(/^\\ir (.+)$/gm)].map(match => match[1]);

test('A38: el instalador incluye todas las migraciones y seeds exactamente una vez', () => {
  const expected = ['esquema-fase2.sql'];
  for (const folder of ['migraciones', 'seeds']) {
    for (const name of fs.readdirSync(path.join(database, folder))) {
      if (name.endsWith('.sql') && name !== 'a15-integridad.sql') expected.push(`${folder}/${name}`);
    }
  }
  assert.deepEqual([...files].sort(), expected.sort());
  assert.equal(files[0], 'esquema-fase2.sql');
});

test('A38: el orden respeta las dependencias declaradas por las migraciones', () => {
  const before = (first, next) => {
    assert.ok(files.includes(first) && files.includes(next));
    assert.ok(files.indexOf(first) < files.indexOf(next), `${first} debe preceder a ${next}`);
  };
  const m = name => `migraciones/${name}.sql`;
  const s = name => `seeds/${name}.sql`;
  before(m('a08-auth'), m('a08-permisos-servidor'));
  before(m('a08-permisos-servidor'), m('a15-guardar-bloque'));
  before(m('a15-guardar-bloque'), m('20261118200550_persistir_mediciones_proveedor'));
  before(s('a24-reglas'), m('a16-objetivos'));
  before(m('a16-fix-cardinalidad'), m('a16-objetivos'));
  before(s('a23-catalogo'), m('a24-planes'));
  before(s('a24-reglas'), m('a24-planes'));
  before(m('a24-planes'), m('a21-sesiones'));
  before(m('a21-sesiones'), m('a31-historial-sesiones'));
  before(s('a23-catalogo'), m('a32-catalogo-admin'));
  before(s('a24-reglas'), s('a26-reglas-v4'));
  before(s('a26-reglas-v4'), s('rutinas-nativas'));
});
