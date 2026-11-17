# A19 · Comprobación privada reproducible

**Estado: preparada y comprobada con Auth/SQL simulados; falta ejecutarla con dos sesiones reales y registrar revisión visual de Luis.** Bajo Release de Roberto. Este procedimiento comprueba el acceso privado y datos guardados de Análisis; no cierra A37 ni certifica todo el proyecto.

## Ejecutar en el equipo que tiene el proyecto

Desde la raíz del repositorio actualizado y con Node 22.19.0 o compatible:

```sh
npm ci
node --env-file=.env scripts/prueba-a19.cjs --report planning/evidence/a19-privado-local.json
```

No hace falta arrancar otro servidor. El script inicia Express en un puerto local libre con la configuración real de `.env`, usa Supabase Auth y los repositorios A15, y lo detiene al terminar. Requiere `SUPABASE_URL` del proyecto Adaptive RL Coach (`fylupliaforboawqdutb`), `SUPABASE_SERVICE_ROLE_KEY` y `SUPABASE_ANON_KEY`. No pegar esas claves en el chat ni en el reporte.

Introduce correo y contraseña de dos cuentas **distintas y activas**, primero A y después B. Los cuatro campos se introducen sin mostrarse. A debe tener un bloque `ready` de cinco replays con goles/tiros disponibles; B necesita iniciar sesión y no ser dueño de ese bloque. El script elige un bloque propio listo. Para seleccionar otro, define `A19_BLOCK_ID` antes de ejecutar. No se crean usuarios, se cambian contraseñas o se generan replays de respaldo.

El JSON de salida no lleva correos, UUIDs de usuario, tokens, contraseñas ni IDs privados del proveedor. No sobrescribe un archivo existente: para repetir con reporte, usa otro nombre. Si falla la autenticación o configuración antes de los casos, muestra un aviso sin emitir un informe aprobado. Si falta el bloque adecuado, el informe queda fallido; no lo sustituye por la demo.

Solo se cierran las sesiones iniciadas por el script, con `scope: local`. No se solicita un cierre global de otras sesiones. No se modifica ningún bloque, replay, perfil, plan o rol.

## Casos del informe

| Caso | Comprobación |
| --- | --- |
| distinct_accounts | A y B son cuentas diferentes. |
| session_A / session_B | Express verifica sus sesiones contra Supabase y devuelve la identidad activa esperada. |
| own_ready_block | Historial de A contiene cinco replays listos. |
| no_session / invalid_session | Análisis rechaza ausencia/token inválido con 401. |
| own_analysis | Bloque propio responde 200, `stored_replay_metrics`, cinco partidas y `no-store`. |
| original_counts_available | Detalle del bloque conserva cinco conteos de goles/tiros válidos. |
| manual_totals | Suma independiente del detalle coincide con goles, tiros y eficiencia ponderada del endpoint. Cero tiros conserva null. |
| api_controller_values | El controlador real de Luis consulta HTTP con la sesión y presenta esos mismos valores en DOM mínimo. |
| foreign_same_as_missing | B recibe el mismo 404 para el bloque de A y para uno inexistente, sin datos de análisis. |
| owner_not_from_query | Enviar `user_id` de A no permite a B leer el bloque. |
| history_owner_filtered | El historial de B excluye el bloque de A. |
| explicit_owned_baseline | Elegir el mismo bloque propio como anterior devuelve incompatibilidad `SAME_BLOCK`, sin comparación ficticia. |

Son catorce comprobaciones si hay datos suficientes. El proceso termina con código 0 solo cuando todos los casos ejecutados pasan; una precondición o caso fallido produce código 1. Un fallo de conexión no se convierte en una aprobación. El reporte incluye commit y versión de Node para identificar el código ejecutado.

## Estado observado durante esta preparación

- Main consultado: `255023fcbd588a538196ac0bd2190db0c02c14ef`, con PR #78 integrado; A26 cerrada por aceptación provisional de Roberto.
- A08 ya tiene una prueba real documentada de sesiones y permisos generales; no demuestra por sí misma la ruta de Análisis A19.
- La consulta de estructura/estado en Supabase encontró tres bloques: uno completo con cinco replays y dos que requieren corrección. Es un inventario agregado, no una prueba HTTP ni identificación de sus dueños.
- Los dispositivos remotos consultados estaban desconectados y no había un ejecutor local disponible en esta sesión. No se obtuvieron contraseñas ni se ejecutó el CLI con cuentas reales.
- Los tests añadidos ejecutan HTTP de Express, repositorio/adaptador y controlador con Auth/SQL simulados. Verifican también que el comprobador detecta una regresión que permita a B leer A, y que cuentas iguales/bloque ausente no producen aprobación. No se presentan como evidencia real A/B.

## Qué sigue faltando para cerrar A19

1. Ejecutar el comando con las dos cuentas y conservar el JSON con todos los casos correctos. Si aparecen errores, corregirlos y repetir los afectados.
2. Abrir la interfaz oficial con el bloque propio y registrar la comprobación de Luis en escritorio y 390 px. El DOM mínimo no prueba diseño, navegación real, teclado ni Chart.js en navegador.
3. Registrar en la issue el commit, resultado, fuente de los bloques y revisión visual. Cerrar A19 solo cuando se cumplan esos criterios.

La comprobación usa bloques existentes y no acredita una carga nueva de cinco archivos ni consulta a Ballchasing. La evidencia previa A13 se conserva como evidencia de aquel procesamiento. Originales de porcentaje de boost/positioning/duración siguen ausentes en A15; el análisis debe conservar esos faltantes, sin inventar prioridades. El resto de seguridad corresponde a A37.

## Estado posterior: diferido al corte

La ejecución real de este procedimiento no se completó. A19 se cierra administrativamente, manteniendo esa comprobación como pendiente explícito, según [registro](a19-cierre-entrega.md). No hay un JSON real aprobado ni se afirma que exista. La automatización propuesta de nuevas cuentas no se implementó.
