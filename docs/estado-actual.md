# Estado actual · 18 de noviembre de 2026

Este documento y el README describen el estado vigente. Las notas de cierre de issues y los resultados de runs anteriores conservan su fecha y alcance histórico.

## Implementado

Express sirve la interfaz oficial; Supabase verifica el acceso y conserva perfiles, bloques, análisis, planes, objetivos y sesiones. Ballchasing procesa cargas privadas. El motor determinista evalúa finalización, disponibilidad de boost y revisión defensiva, conserva evidencia y genera propuestas explicables.

La corrección de persistencia guarda las medidas originales necesarias para boost/defensa y las recupera al reconstruir el bloque. El porcentaje de boost y el reloj de partida mantienen su fuente. Los bloques antiguos mantienen sus ausencias. El formulario de ayuda sigue sin un servicio de envío habilitado.

## Verificación de este cambio

- [GitHub Actions Node, commit 1f1bec4](https://github.com/Santana-R/adaptive-rl-coach/actions/runs/44389714573): **553 pruebas aprobadas, cero fallidas y cero omitidas**, incluidas las suites frontend antes excluidas y seis pruebas nuevas de persistencia. Transporte del proveedor y SQL simulados en las integraciones Node.
- 43 escenarios A26 siguen coincidiendo con los resultados esperados.
- RPC PostgreSQL real: cinco instantáneas sintéticas conservadas, ceros y duración fraccional correctos, JSON incompleto rechazado; rollback.
- Migración aplicada: nueva columna disponible, diez filas históricas conservadas sin medidas añadidas. `anon` y `authenticated` siguen sin permiso para ejecutar A15; `service_role` sí.
- Recuperación de respaldo de aplicación: 30 tablas y 125 filas reconstruidas en tablas temporales, con igualdad de datos y restricciones comprobadas; Auth representado solo mediante UUID.
- Ampliación de Auth autorizada expresamente: ocho cuentas, nueve identidades y seis hashes respaldados en el paquete privado. Restauración temporal verificada, con UUID y hashes intactos y relaciones con la aplicación válidas; rollback. Hook de registro capturado. Ningún dato de autenticación se incorpora al repositorio.
- [GitHub Actions Docker](https://github.com/Santana-R/adaptive-rl-coach/actions/runs/44389714712): imagen construida desde cero, HTTP accesible desde el host, usuario no privilegiado, `.env` excluido y archivo conservado al recrear el contenedor. Compose validado localmente.

La ejecución local completa de Node encontró restricciones de apertura de puertos (`listen EPERM`); las suites HTTP sí terminaron correctamente en GitHub Actions. La comprobación Docker se ejecutó en Linux; la Mac no tenía su motor de Docker disponible.

## Pendiente y límites

El respaldo incluye cuentas e identidades de Supabase Auth con sus hashes de contraseña. No incluye sesiones, tokens de flujos pendientes ni secretos de configuración; Google OAuth, SMTP y las URLs requieren configuración aparte. Todavía no se certifica una restauración completa con inicio de sesión en otro proyecto. La conservación del volumen no crea una cola durable; los bloques pendientes requieren reintento y siguen caducando.

No se completó aquí una nueva sesión por navegador con cinco replays ranked reales. Las comprobaciones sintéticas, SQL y de Docker no acreditan ese recorrido ni una calibración científica de los criterios deportivos. No se realizó despliegue público en este bloque.
