# Estado actual · 18 de noviembre de 2026

Este documento y el README describen el estado vigente. Las notas de cierre de issues y los resultados de runs anteriores conservan su fecha y alcance histórico.

## Implementado

Express sirve la interfaz oficial; Supabase verifica el acceso y conserva perfiles, bloques, análisis, planes, objetivos y sesiones. Ballchasing procesa cargas privadas. El motor determinista evalúa finalización, disponibilidad de boost y revisión defensiva, conserva evidencia y genera propuestas explicables.

La corrección de persistencia guarda las medidas originales necesarias para boost/defensa y las recupera al reconstruir el bloque. El porcentaje de boost y el reloj de partida mantienen su fuente. Los bloques antiguos mantienen sus ausencias. El formulario de ayuda sigue sin un servicio de envío habilitado.

## Verificación de este cambio

- 132 pruebas dirigidas aprobadas: reglas de boost/defensa, repositorios y nueva regresión de persistencia. Transporte del proveedor y SQL simulados en Node.
- 43 escenarios A26 siguen coincidiendo con los resultados esperados.
- RPC PostgreSQL real: cinco instantáneas sintéticas conservadas, ceros y duración fraccional correctos, JSON incompleto rechazado; rollback.
- Migración aplicada: nueva columna disponible, diez filas históricas conservadas sin medidas añadidas. `anon` y `authenticated` siguen sin permiso para ejecutar A15; `service_role` sí.
- Recuperación de respaldo de aplicación: 30 tablas y 125 filas reconstruidas en tablas temporales, con igualdad de datos y restricciones comprobadas; Auth representado solo mediante UUID.
- Compose validado localmente. Construcción, acceso HTTP y recreación del volumen se comprueban en el flujo de Docker de este cambio.

La ejecución local completa de Node encontró restricciones de apertura de puertos (`listen EPERM`); el resultado de las suites HTTP se toma de GitHub Actions. Los resultados finales de CI se registran al cerrar este cambio.

## Pendiente y límites

El respaldo no incluye autenticación de Supabase ni secretos de configuración. Todavía no se certifica una restauración completa de la plataforma. La conservación del volumen no crea una cola durable; los bloques pendientes requieren reintento y siguen caducando.

No se completó aquí una nueva sesión por navegador con cinco replays ranked reales. Las comprobaciones sintéticas, SQL y de Docker no acreditan ese recorrido ni una calibración científica de los criterios deportivos. No se realizó despliegue público en este bloque.
