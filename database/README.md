# Base de datos · Fase 2

`esquema-fase2.sql` captura la estructura real consultada el 1 de noviembre: **30 tablas**, 23 identidades, claves/restricciones, 22 índices no asociados a restricciones, 2 funciones privadas y 9 triggers de cardinalidad (6 de restricción). RLS está habilitado en las 30 tablas.

No contiene filas, identidades personales, credenciales ni cuentas de Auth. Requiere un proyecto Supabase ya provisionado con auth.users y las extensiones de su entorno. No recrea la infraestructura/roles de Supabase ni el event trigger de plataforma ensure_rls; cada tabla habilita RLS explícitamente.

**Verificación:** definiciones extraídas de catálogos del proyecto existente; no se cambió la base. La restauración completa en un proyecto nuevo no se ha ejecutado y queda en A07/A38. Este archivo corresponde a un entorno vacío y no se ejecuta sobre las tablas existentes.

Incluye las funciones arc_private necesarias para los triggers; exportar solo tablas dejaría incompleta esa dependencia. Las políticas de la aplicación siguen pendientes en A08; RLS habilitado no acredita los recorridos de acceso.

[Estado de Fase 2](../docs/fase2-estado.md) · [Diccionario vigente](../docs/diccionario-datos.md).
