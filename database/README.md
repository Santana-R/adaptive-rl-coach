# Base de datos · Fase 2

**Actualización del 18 de noviembre de 2026:** esta captura de Fase 2 es histórica. La migración aditiva `migraciones/20261118200550_persistir_mediciones_proveedor.sql` añade las medidas originales de boost/defensa y actualiza A15; aplicar después de A15. Estado y pruebas de recuperación: [guía vigente](../docs/ejecucion-y-recuperacion.md). La comprobación temporal de datos no restaura Auth.

`esquema-fase2.sql` captura la estructura real consultada el 1 de noviembre: **30 tablas**, 23 identidades, claves/restricciones, 22 índices no asociados a restricciones, 2 funciones privadas y 9 triggers de cardinalidad (6 de restricción). RLS está habilitado en las 30 tablas.

No contiene filas, identidades personales, credenciales ni cuentas de Auth. Requiere un proyecto Supabase ya provisionado con auth.users y las extensiones de su entorno. No recrea la infraestructura/roles de Supabase ni el event trigger de plataforma ensure_rls; cada tabla habilita RLS explícitamente.

**Verificación:** definiciones extraídas de catálogos del proyecto existente; no se cambió la base. La restauración completa en un proyecto nuevo no se ha ejecutado y queda en A38. A07 corresponde al seguimiento del documento de Fase 2 y no exige esta comprobación para la revisión académica. Este archivo corresponde a un entorno vacío y no se ejecuta sobre las tablas existentes.

Incluye las funciones arc_private necesarias para los triggers; exportar solo tablas dejaría incompleta esa dependencia. Las políticas de la aplicación siguen pendientes en A08; RLS habilitado no acredita los recorridos de acceso.

[Estado de Fase 2](../docs/fase2-estado.md) · [Diccionario vigente](../docs/diccionario-datos.md).

## Instalación inicial A38

**Solo para un proyecto Supabase de desarrollo nuevo, con Auth provisionado y sin tablas en `public`.** Para el proyecto compartido no reinstalar el esquema ni repetir migraciones por defecto: comprobar cuáles están aplicadas con el responsable de datos. El punto de partida de una recuperación con datos reales es distinto; seguir la [guía de recuperación](../docs/ejecucion-y-recuperacion.md) y su respaldo privado.

1. Crear un proyecto de desarrollo autorizado, comprobar la versión de PostgreSQL y disponer de un cliente `psql` compatible. Configurar la conexión privada del destino según su panel (por ejemplo, las variables de conexión de `psql` en la sesión; no registrar URI/contraseñas en Git).
2. Desde la raíz, ejecutar `psql -X -v ON_ERROR_STOP=1 -f database/instalar-a38.sql`. El script se detiene si no existe `auth.users`, si `public` no está vacío o si falla una sentencia. No se debe continuar sobre una instalación parcial sin revisar el punto de fallo.
3. Comprobar las 30 tablas con RLS y todas las filas de la auditoría A39 con cero inválidas. Configurar Auth (correo, Google, redirecciones) y crear cuentas y perfiles de prueba (TEST_A y TEST_B) según [prueba-auth.md](../docs/prueba-auth.md). No copiar cuentas reales ni credenciales de otro proyecto.
4. Ejecutar por separado las pruebas SQL en el entorno de desarrollo (terminan con rollback): `database/tests/a21-sesiones.sql`, `database/tests/a26-reglas-v4.sql` y `database/tests/mediciones-proveedor.sql`. Consultar los requisitos descritos al inicio de cada archivo.

Si se usa el SQL Editor en vez de `psql`, abrir y ejecutar cada archivo individualmente, en este orden; las líneas `\ir` del instalador son comandos de `psql`, no SQL que admita el editor:

| Orden | Archivo |
| --- | --- |
| 1 | `esquema-fase2.sql` (después de comprobar que `public` está vacío) |
| 2 | Las dos sentencias `REVOKE` de `instalar-a38.sql` (reproducen las restricciones de A08 en el esquema recién creado), `migraciones/a08-auth.sql`, `migraciones/a08-permisos-servidor.sql` |
| 3 | `migraciones/a15-guardar-bloque.sql`, `migraciones/a16-fix-cardinalidad.sql` |
| 4 | `seeds/a23-catalogo.sql`, `seeds/a24-reglas.sql` |
| 5 | `migraciones/a16-objetivos.sql`, `migraciones/a24-planes.sql`, `migraciones/a21-sesiones.sql` |
| 6 | `migraciones/a29-cambiar-estado-usuario.sql`, `migraciones/a31-historial-sesiones.sql`, `migraciones/a31-rangos.sql`, `migraciones/a32-catalogo-admin.sql` |
| 7 | `seeds/a26-reglas-v4.sql`, `migraciones/a39-auditoria.sql` |
| 8 | `migraciones/20261118200550_persistir_mediciones_proveedor.sql`, `seeds/rutinas-nativas.sql` |

`migraciones/a15-integridad.sql` contiene consultas de comprobación, no una migración. No usar `scripts/seed-demo.cjs` sobre un jugador real: ese script limpia los datos de la cuenta de prueba elegida antes de crear los sintéticos. Si se usa, hacerlo solo con una cuenta desechable `TEST_`/`DEMO_` autorizada; los resultados sintéticos no acreditan la carga en Ballchasing.

## Catálogo de rutinas del plan

En el entorno de prueba, ejecuta [rutinas-nativas.sql](seeds/rutinas-nativas.sql) después del esquema y las migraciones de planes. El script registra las versiones de los ejercicios de boost y revisión defensiva. Puede ejecutarse de nuevo y conserva el contenido, el estado y las versiones previamente guardadas. Sin esas fichas activas, el plan refleja la cobertura disponible en esa base.
