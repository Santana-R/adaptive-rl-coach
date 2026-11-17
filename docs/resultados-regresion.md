# Regresión de métricas, reglas y planes · A33

## Resultado comprobado

[GitHub Actions, run 43998472820](https://github.com/Santana-R/adaptive-rl-coach/actions/runs/43998472820), commit [`64d49bf`](https://github.com/Santana-R/adaptive-rl-coach/commit/64d49bf8face6ad01d2073ed96971668d506bdcd), Node 22.19.0: **503 pruebas aprobadas, cero fallidas**. La matriz A26 contrastó **43/43 casos**, sin diferencias. El comprobador histórico defensivo pasó por separado; los grupos no se suman como escenarios independientes.

Esta es evidencia de ejecución real del código con los tipos de entradas y dobles indicados. No es ejecución real de sesiones A/B en el equipo de Roberto ni certificación del ciclo completo.

| Caso | Esperado | Resultado observado |
| --- | --- | --- |
| Línea base, caso 120 del log | Primer bloque válido sin delta ficticio | Aprobado |
| Ponderación, caso 274 | 2/8 = 25 %, distinto del promedio simple de 40 % | Aprobado |
| Incompatibilidad, casos 24/122 | Contexto distinto explicado sin delta | Aprobado |
| Faltantes, caso 28 | Tiro ausente: null, cobertura 4/5, goles completos conservados | Aprobado |
| Catálogo parcial, caso 110 | Ejercicio inactivo excluido y cobertura parcial explicada | Aprobado |
| Plan parcial/vacío, caso 331 | Cobertura y motivos, sin forzar ejercicios | Aprobado |
| Controlador de Análisis, casos 180–184 | Evidencia defensiva y faltantes presentados en DOM mínimo | Aprobado |
| Comprobador A19, casos 1–3 | Detectar lectura ajena permitida por regresión y precondiciones inválidas | Aprobado; Auth/SQL simulados |
| Persistencia/versiones | Nueva versión y snapshot anterior conservado | Suite de persistencia aprobada; su SQL real sintético previo está en la evidencia A24/A26 |

El [registro estructurado](../planning/evidence/cierre-roberto-regresion.json) conserva casos y fuente. Los números corresponden a este run; no se atribuyen a commits anteriores ni a una futura versión.

## Alcance de cierre

Por la decisión de corte de entrega de Roberto se termina A33 como **regresión automatizada de métricas, reglas, planes, rutas y controlador**. El requisito original de certificar ausencia de bloqueos en todo el ciclo no se presenta como cumplido: la integración completa y sus bloqueos permanecen en A25; seguridad real en A37 y revisión visual en A35. A26 ya fue aceptada provisionalmente y cerrada.

No se repite una prueba sin cambios de código para atribuirle un resultado nuevo. Este documento solo conserva el run existente y sus límites. No se cambia implementación, umbrales, cuentas, contraseñas o datos de jugadores.
