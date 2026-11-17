# A26 · Compatibilidad de reglas v4 y persistencia

## Compatibilidad A26 con A24 · 16 de noviembre de 2026

El PR #78 incorpora main `6e424bed44da8daf80f76fffa34e13b9a5b4d022`, con A24. La configuración v4 ya tiene seed aditiva: [a26-reglas-v4.sql](../database/seeds/a26-reglas-v4.sql), posterior a la seed A24. Se ejecutó en el proyecto Adaptive RL Coach; conserva las cinco configuraciones anteriores y añade tres de v4. No se reescriben análisis ni planes históricos.

La métrica de una regla SQL es inmutable. Por eso la tasa usa `last_defender_goals_per_5_minutes`, unidad `goals_per_5_minutes`, y código SQL `cobertura-defensiva-revision-tasa`. El adaptador traduce el ID lógico `cobertura-defensiva-revision` tanto para prioridades como ejercicios, mientras snapshots/evidencia conservan el ID público. `valor_actual` sigue siendo partidas coincidentes; las tasas por partida permanecen en la evidencia. V3 continúa enlazada al conteo anterior.

**Comprobación:** [run 43992766098](https://github.com/Santana-R/adaptive-rl-coach/actions/runs/43992766098), head `de7fba09641182d14fff70c617fbbab6d04dc211`: **491 pruebas aprobadas, 0 fallidas**, y **43/43** casos A26. Incluye las pruebas de persistencia A24 incorporadas y el contraste del mapeo de códigos.

Además se ejecutó dos veces la seed en una transacción de prueba y el [contraste SQL](../database/tests/a26-reglas-v4.sql): guardar v4, versión 2, versión 1 intacta, rechazo a otro propietario, rechazo de UPDATE, guardado v3 y rechazo de mezclar v3 con v4. Los datos de prueba se revirtieron. Después se aplicó la seed de definiciones y se confirmó: ocho configuraciones (cinco anteriores idénticas más tres v4), cero análisis, cero planes y tres bloques existentes. Las secuencias de IDs avanzan aunque se haga rollback. [Resultado conservado](../planning/evidence/a26-persistencia-v4.json).

Este contraste SQL usa bloques borrador y contratos sintéticos sin ejercicios: verifica registro de reglas, referencias y versiones del RPC; no ejecuta el motor, no valida replays, catálogo defensivo SQL, autenticación HTTP ni ciclo privado completo. Las pruebas Node verifican por separado el motor/HTTP con simulaciones. Las rutinas nativas sin `exercise_version_id` siguen devolviendo 422 al intentar guardarlas. A15 sigue sin entregar los originales para activar la tasa en bloques guardados.

La compatibilidad técnica queda resuelta. El PR puede revisarse/integrarse como avance; A26 conserva pendiente la validación deportiva restante. Los casos cortos y exposición individual quedan documentados sin añadir criterios nuevos.
