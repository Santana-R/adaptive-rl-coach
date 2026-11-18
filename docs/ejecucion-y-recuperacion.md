# Ejecución local y recuperación

## Entorno reproducible

El Dockerfile fija Node 22.19.0 y utiliza `npm ci` con el lockfile. Solo copia código y recursos necesarios. Compose inyecta `.env`, publica el servicio en `127.0.0.1` y conserva `/app/data` en `replay-pending`. El healthcheck consulta Express dentro del contenedor.

Para arrancar desde una copia limpia del repositorio, completar `.env` y ejecutar `docker compose up --build -d`. Supabase Auth/PostgreSQL y Ballchasing siguen siendo servicios externos. Se necesita conexión a ellos para usar el recorrido privado.

Para parar y retomar: `docker compose down` y después `docker compose up -d`. El volumen permanece. Los archivos pendientes siguen sujetos al TTL configurado. El servidor conserva los IDs aceptados por Ballchasing en la base; el botón de reintento recupera el procesamiento después de un reinicio. No existe una cola durable que se ejecute sola al arrancar.

## Qué se respalda

| Componente | Conservación |
| --- | --- |
| Código | Historial Git y rama de respaldo anterior al cambio |
| Estructura y datos de aplicación | Instantánea de 30 tablas y 125 filas, funciones públicas y privadas, índices, restricciones, triggers y permisos consultados |
| Corrección de medidas | Migración aditiva separada para aplicar después de restaurar la instantánea anterior |
| Configuración | `.env.example` e inventario de nombres; los valores privados se conservan aparte en la configuración local existente |
| Pendientes de carga | Volumen local y caducidad; no están incluidos en el respaldo de base |
| Cuentas e identidades de Auth | Ocho cuentas, nueve identidades y seis hashes de contraseña incluidos en el paquete privado; UUID originales conservados |
| Configuración de plataforma | OAuth/SMTP, claves y URLs del panel requieren configuración aparte; no se incluyen sesiones ni tokens activos |

El paquete de respaldo es privado y se entrega separado del repositorio. Contiene datos personales de la aplicación; no debe publicarse como código ni incorporarse a una imagen.

## Comprobación de recuperación realizada

Se reconstruyeron las definiciones capturadas y las 125 filas de las 30 tablas en tablas temporales de PostgreSQL. Se verificaron igualdad de los datos, tipos, nulabilidad, CHECK, PK, UNIQUE y FK internas; la FK externa de Auth se representó mediante los UUID ya presentes en `usuarios`. La transacción terminó con rollback.

Después del Release específico para Auth se restauraron también las ocho cuentas y nueve identidades en tablas temporales del esquema equivalente. Se verificaron los seis hashes sin modificarlos, los campos respaldados, la FK identidad/usuario y la correspondencia de los ocho UUID con las cuentas de aplicación. La transacción terminó con rollback; no se modificaron cuentas activas. Se conserva además el hook que registra nuevos usuarios en la aplicación.

Estas comprobaciones no acreditan una instalación completa de Supabase desde cero ni un inicio de sesión en otro proyecto. El proveedor Google, SMTP, claves y URLs requieren configuración aparte. No hay factores MFA en la captura. Los tokens de flujos pendientes y las sesiones no se trasladan; los usuarios vuelven a iniciar sesión.

## Procedimiento para una recuperación futura

1. Provisionar un proyecto Supabase de destino y comprobar sus versiones/extensiones.
2. En un destino Auth vacío y compatible, revisar y ejecutar `restauracion-auth.sql` con `psql -X -v ON_ERROR_STOP=1`. Conserva los UUID originales y los hashes; deja vacíos los tokens de flujos anteriores. Debe ejecutarse antes del hook de registro de la aplicación.
3. En un destino sin tablas de aplicación, revisar y ejecutar `restauracion-aplicacion.sql` con `psql -X -v ON_ERROR_STOP=1`. El archivo crea tablas, carga datos, añade restricciones y restaura funciones, triggers, índices y permisos en una transacción; no borra un proyecto existente.
4. Aplicar la migración de medidas y `restaurar-hook-usuarios.sql`, en ese orden. Después ejecutar `database/tests/mediciones-proveedor.sql`.
5. Configurar las nuevas URLs y claves en `.env`, revisar la URL del sitio, las redirecciones autorizadas, Google OAuth y SMTP. Las identidades Google están respaldadas; el cliente OAuth se configura en el proyecto de destino.
6. Arrancar la aplicación y comprobar acceso, un bloque propio, análisis, plan y registro de práctica. Comprobar que una segunda cuenta no pueda leer esos datos.

`python3 scripts/generar-restauracion.py snapshot.json restore.sql` regenera el SQL a partir de la instantánea. `--check` genera la comprobación temporal utilizada en esta revisión. El script no se conecta a la base. Esta herramienta admite la estructura capturada; si aparecen columnas calculadas o políticas RLS, exige utilizar un dump oficial.

Una futura copia completa debe seguir el [procedimiento oficial de Supabase](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore), incluyendo Auth y configuración. La imagen de Express no contiene una copia de esos servicios.
