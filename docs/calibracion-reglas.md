# A26 · Contraste inicial de heurísticas y límites

**Estado: ajuste por duración solicitado por Roberto y comprobado; revisión deportiva restante pendiente.** Elaborado con asistencia de IA bajo su Release. La autorización para preparar esta entrega no se registra como una aprobación de sus resultados deportivos.

Esta ficha reúne los criterios implementados, expectativas calculadas manualmente por la IA y una comprobación reproducible con el motor. **Los casos son sintéticos; no son replays reales ni una calibración poblacional.** A26 permanece abierta hasta registrar la revisión deportiva y atender lo que resulte.

## Configuración examinada

Base anterior: [`0843055`](https://github.com/Santana-R/adaptive-rl-coach/commit/0843055fba25b318ddcc6431f7170f20d0c2d08e), con PR #74 integrado. El ajuste por duración se verifica en [`985cacb`](https://github.com/Santana-R/adaptive-rl-coach/commit/985cacb7594d7ffe4ab0efc3ce107cc7b2b20cf1), PR #78. La matriz conserva una copia completa de `RULES_CONFIG`; el script rechaza una configuración distinta para evitar atribuir estos resultados a otra versión.

| Pieza | Versión |
| --- | --- |
| Reglas | `mvp.rules.v4` |
| Métricas | `mvp.metrics.v1` |
| Generador | `mvp.plans.v3` |
| Reparto | `mvp.allocation.v3` |
| Matriz de esta revisión | `a26.validation.v2` |

| Regla | Criterio y cobertura | Alcance actual | Estado deportivo |
| --- | --- | --- | --- |
| Finalización | Eficiencia ponderada ≤30 %, con goles/tiros 5/5. Mínimo de 20/15/10 tiros en 1v1/2v2/3v3. | Modalidades y tipos compatibles admitidos por A14. | Heurística inicial acordada, sin calibración poblacional. |
| Disponibilidad de boost | Porcentaje original exactamente en cero ≥15 % en al menos 3/5; score alto con ≥20 % en 3/5. Los cinco porcentajes son necesarios. | Ranked 2v2/3v3; 1v1 sin evaluar. | Heurística acordada. La extensión a 3v3 necesita contraste específico; la investigación exploratoria anterior fue 2v2. |
| Revisión defensiva | Tasa por partida ≥2 goles como último defensor por cinco minutos en al menos 3/5; cinco conteos válidos y cinco duraciones originales positivas. Cero goles es válido. | Ranked 2v2. | Relevancia confirmada; ajuste por duración solicitado por Roberto. Umbral y casos restantes provisionales. |

El porcentaje de boost 0–25 no es el porcentaje con exactamente cero. Los conteos de último defensor no son una medida de culpabilidad, fallos de entrada ni situaciones 2v1. Los scores solo ordenan prioridades técnicas.

## Qué se compara y qué decide Roberto

El archivo [de entradas y expectativas](../planning/fixtures/a26-validacion-heuristicas.v2.json) contiene **43 casos**, con vectores de cinco valores, contextos y resultados esperados. La IA preparó esas expectativas mediante cálculo manual y lectura de los criterios publicados; **no se atribuyen a una revisión humana ya realizada**.

El [script de contraste](../scripts/validar-heuristicas-a26.cjs) materializa cada caso como estadísticas sintéticas del jugador, ejecuta A14 → A09 → Análisis/reglas y genera una propuesta con catálogo explícitamente sintético. Compara el resultado calculado con la expectativa y verifica presupuesto/mínimos. No consulta Ballchasing, cuentas ni SQL.

Hay dos revisiones diferentes:

- **Consistencia técnica:** el código devuelve lo que dicen los parámetros y la tabla; hay coincidencia entre esperado y observado. Se puede comprobar automáticamente.
- **Pertinencia deportiva:** la señal merece ocupar parte del plan, con ese umbral, modalidad y contexto. Roberto la revisa; una coincidencia técnica no la demuestra.

## Matriz para contraste

Los casos de una regla mantienen neutrales las otras dos. Los casos de plan activan las tres de forma explícita cuando corresponde. Los valores completos y las unidades están en el JSON; las entradas se identifican siempre como sintéticas.

### Finalización · once casos

| ID | Caso | Esperado y observado (coinciden) |
| --- | --- | --- |
| F01 | 2v2: muestra mínima suficiente con 26.67 % | Activa |
| F02 | 2v2: 30 % con solo diez tiros | No evaluable |
| F03 | 1v1: veinte tiros y límite inclusivo de 30 % | Activa |
| F04 | 1v1: diecinueve tiros no alcanzan la muestra | No evaluable |
| F05 | 3v3: diez tiros y 30 % | Activa |
| F06 | 3v3: diez tiros y 40 % | Inactiva |
| F07 | 7/23 no se redondea a 30 % para activar | Inactiva |
| F08 | Cero goles con veinte tiros sí es 0 % | Activa |
| F09 | Cero tiros no es 0 % de eficiencia | No evaluable |
| F10 | Un conteo de goles ausente impide la recomendación | No evaluable |
| F11 | Los totales dan 2/20=10 %; promediar porcentajes daría 40 % | Activa |

Los mínimos dependen de la modalidad. Un 30 % calculable no basta si faltan tiros para la muestra; cero tiros produce null, mientras cero goles con tiros sí puede producir 0 %. En F11 se divide la suma de goles entre la suma de tiros: 2/20 = 10 %; promediar los porcentajes por partida produciría 40 % y cambiaría incorrectamente la decisión.

### Boost · diez casos

| ID | Caso | Esperado y observado (coinciden) |
| --- | --- | --- |
| B01 | Quince por ciento en tres partidas | Activa (normal) |
| B02 | Veinte por ciento en tres partidas | Activa (high) |
| B03 | Dos partidas extremas no sustituyen la repetición | Inactiva |
| B04 | Un 14.99 % no alcanza el límite | Inactiva |
| B05 | Tres porcentajes altos y un faltante no completan cobertura | No evaluable |
| B06 | Porcentaje positivo y cero segundos son incoherentes | No evaluable |
| B07 | 3v3 conserva el criterio inicial, sin calibración propia | Activa (normal) |
| B08 | 1v1 queda fuera de la regla actual | No evaluable |
| B09 | El intervalo 0–25 y los segundos no reconstruyen el porcentaje en cero | No evaluable |
| B10 | Porcentajes originales presentes con segundos no disponibles | Activa (high) |

B03 conserva la repetición mínima: dos casos extremos no equivalen a tres coincidencias. B09 impide rellenar el porcentaje original desde segundos o boost 0–25. B10 distingue disponibilidad de campos: un porcentaje original válido puede usarse aunque falten segundos; una contradicción explícita, como en B06, impide usarlo.

### Cobertura defensiva · dieciséis casos

Cada tasa usa `goles × 300 / segundos originales de esa partida`. Se necesitan cinco pares válidos; no se promedian relojes ni se redondea para decidir.

| ID | Caso | Esperado y observado (coinciden) |
| --- | --- | --- |
| D01 | Dos goles en cinco minutos en tres partidas | Activa |
| D02 | Solo dos partidas alcanzan la tasa aunque tengan conteos extremos | Inactiva |
| D03 | Tres conteos suficientes con dos faltantes | No evaluable |
| D04 | Un gol en cinco minutos en cada partida | Inactiva |
| D05 | 3v3 fuera de esta hipótesis | No evaluable |
| D06 | Mismo reloj y conteos, pero mayor exposición como último defensor | Activa |
| D07 | Dos goles en diez minutos equivalen a uno por cinco | Inactiva |
| D08 | Los goles totales del equipo no rellenan el dato defensivo | No evaluable |
| D09 | Cuatro goles en diez minutos equivalen a dos por cinco | Activa |
| D10 | Una duración ausente impide completar los cinco pares | No evaluable |
| D11 | Cero segundos se conserva pero impide calcular la tasa | No evaluable |
| D12 | Dos goles en 300.000001 segundos quedan debajo del límite | Inactiva |
| D13 | Dos goles en 299.5 segundos superan el límite | Activa |
| D14 | Un gol en 60 segundos en tres partidas equivale a cinco por cinco | Activa; muestra corta pendiente de criterio |
| D15 | `duration` presente sin `play_duration` original | No evaluable |
| D16 | Cuatro goles en 600.000001 segundos quedan debajo del límite | Inactiva |

**Observación de Roberto:** «Deberíamos considerar cuánto duró cada partido». Bajo su Release se cambia a una tasa por partida y se versiona a `mvp.rules.v4`. D07 cambia respecto de la matriz histórica v1: antes activaba por conteo; ahora no alcanza la tasa. Esto no registra aprobación de todos los umbrales ni de los otros casos.

D06 conserva un límite distinto: el reloj de la partida no mide la exposición individual como último defensor. D14 hace visible que no existe un mínimo de duración deportiva acordado; muestras muy cortas pueden producir tasas altas. Ninguno se resuelve inventando un corte o atribuyendo culpa.

### Plan y validación · seis casos

| ID | Caso | Esperado y observado (coinciden) |
| --- | --- | --- |
| C01 | Tres señales y quince minutos | complete; 15 min; boost 5, defensive_review 5, shooting 5 |
| C02 | Diez minutos cubren dos áreas y declaran la tercera pendiente | partial; 10 min; boost 5, defensive_review 5 |
| C03 | Veinte minutos se reparten en 7/7/6 | complete; 20 min; boost 7, defensive_review 7, shooting 6 |
| C04 | Cuatro minutos no alcanzan el mínimo de una actividad | empty; 0 min |
| C05 | Ninguna regla activa no fabrica un plan de mantenimiento | empty; 0 min |
| C06 | Un jugador ausente invalida el bloque | Bloque inválido: PLAYER_MISMATCH |

Con poco tiempo no se fabrican minutos ni se reparte por debajo de cinco por actividad. El orden técnico actual, con las tres activas, es boost → revisión defensiva → tiro; el objetivo principal aún no cambia ese orden. La matriz deja ese punto visible en C02.

## Resultado técnico y reproducción

El workflow ejecuta `npm test`, el comprobador histórico defensivo y la matriz A26 en Node.js 22.19.0. En [run 43990285053](https://github.com/Santana-R/adaptive-rl-coach/actions/runs/43990285053), head `985cacb7594d7ffe4ab0efc3ce107cc7b2b20cf1`, los **43 casos coincidieron, sin diferencias**, y la suite aprobó **481 pruebas, 0 fallidas**. El comprobador histórico de 33 casos pasó por separado; no se suman los grupos como escenarios independientes.

La [evidencia v2](../planning/evidence/a26-resultados.v2.json) conserva la salida real: commits, versiones, tasas, cobertura, prioridades y minutos. La [evidencia v1](../planning/evidence/a26-resultados.v1.json) y su [matriz v1](../planning/fixtures/a26-validacion-heuristicas.v1.json) son antecedentes de reglas v3 y se conservan. Ninguno de los 43 casos se presenta como replay real o jugador independiente.

Desde una copia del repositorio:

```sh
npm ci
npm test
node scripts/validar-heuristicas-a26.cjs
```

El script sale con error si una expectativa no coincide. La tolerancia de 1e-12 solo compara el cálculo manual de un decimal con su representación numérica; **las reglas siguen evaluando sus límites sin redondear ni aplicar esa tolerancia**.

## Revisión deportiva que falta

La revisión global continúa pendiente. D07 registra `duration_adjustment_requested_by_roberto`; la matriz conserva el alcance específico de su comentario. Los demás casos no se marcan aprobados. Las preguntas destacadas permiten revisar primero las decisiones más relevantes, sin pedir repetir todos los cálculos.

| Caso | Decisión a revisar | Registro de Roberto |
| --- | --- | --- |
| F02 | ¿Mantener los quince tiros mínimos de 2v2 aunque ya se pueda calcular el porcentaje? | Pendiente. |
| B03 | ¿Mantener revisión repetida de tres partidas aunque dos casos aislados sean muy altos? | Pendiente. |
| B07 | ¿Aceptar la extensión provisional a 3v3 manteniendo pendiente su contraste específico? | Pendiente. |
| D01 | ¿Es una señal suficiente para proponer revisión de esas partidas sin atribuir culpa? | Pendiente. |
| D06 | ¿Conservar la revisión provisional aunque el jugador pase más tiempo como último defensor, o ajustar/deferir el criterio? | Pendiente. |
| D07 | Considerar la duración de cada partida. | Solicitado por Roberto e implementado por cinco minutos; el umbral sigue provisional. |
| D14 | ¿Exigir duración mínima de observación para evitar tasas infladas en partidas muy cortas? | Pendiente; sin corte aprobado. |
| C02 | ¿El orden técnico actual es aceptable para esta versión cuando el tiempo solo permite dos áreas? | Pendiente. |

Una respuesta puede aceptar provisionalmente el comportamiento, pedir cambiarlo o diferir su aplicación. Debe registrarse lo que Roberto diga, con los casos a los que se refiere. No se infiere aceptación por silencio, por ejecutar tests, por hacer merge de una entrega anterior ni por el Release para preparar esta revisión.

## Incertidumbre y evidencia aún necesaria

- La muestra de boost conservada en el repositorio es exploratoria, de conveniencia, con jugadores repetidos; no establece umbrales representativos por rango.
- Falta contraste de bloques reales para los tres criterios y, especialmente, exposición y muestras cortas en defensa y extensión de boost a 3v3. El ajuste matemático por duración no calibra el umbral.
- Las pruebas de esta matriz no comprueban la presencia de cada campo en respuestas autenticadas ni el significado detallado de las omisiones del proveedor.
- A15 conserva segundos de boost, pero no su porcentaje original ni positioning original ni reloj con procedencia original comprobada para esta tasa. Los adaptadores actuales conservan esos faltantes; no se convierten en cero para obtener una prioridad. Cerrar A13/A15 no añade automáticamente esos nuevos campos.
- La actividad defensiva requiere revisar manualmente la replay; el agregado no localiza el minuto del evento. Su ejecución dentro del juego sigue sin verificación.
- Una mejora posterior o una sesión completada no demuestra causalidad. La matriz no valida JWT real, la integración privada completa, la persistencia del plan ni su presentación final.

Referencias de criterios y limitaciones: [reglas](reglas-motor.md), [boost](disponibilidad-boost.md), [cobertura defensiva](cobertura-defensiva.md) y [generador](generador-planes.md).

## Qué falta para cerrar A26

1. **Completado:** contraste técnico de 43/43 con reglas v4 y resultado conservado, enlazado al commit y run.
2. Registrar la revisión de Roberto sobre los casos y atender las observaciones concretas.
3. Si se acuerda cambiar un criterio, preparar el cambio versionado y repetir sus comprobaciones antes de atribuirle el resultado.
4. Conservar expresamente las limitaciones y la evidencia aún pendiente; no declarar calibración poblacional conseguida.

Esta entrega no cierra A19, A25, A33 o A34. El primer paso de A26 es revisar las heurísticas iniciales con casos reproducibles; el resultado deportivo queda abierto hasta que Roberto lo revise.

## Compatibilidad A26 con A24 · 16 de noviembre de 2026

El PR #78 incorpora main `6e424bed44da8daf80f76fffa34e13b9a5b4d022`, con A24. La configuración v4 ya tiene seed aditiva: [a26-reglas-v4.sql](../database/seeds/a26-reglas-v4.sql), posterior a la seed A24. Se ejecutó en el proyecto Adaptive RL Coach; conserva las cinco configuraciones anteriores y añade tres de v4. No se reescriben análisis ni planes históricos.

La métrica de una regla SQL es inmutable. Por eso la tasa usa `last_defender_goals_per_5_minutes`, unidad `goals_per_5_minutes`, y código SQL `cobertura-defensiva-revision-tasa`. El adaptador traduce el ID lógico `cobertura-defensiva-revision` tanto para prioridades como ejercicios, mientras snapshots/evidencia conservan el ID público. `valor_actual` sigue siendo partidas coincidentes; las tasas por partida permanecen en la evidencia. V3 continúa enlazada al conteo anterior.

**Comprobación:** [run 43992766098](https://github.com/Santana-R/adaptive-rl-coach/actions/runs/43992766098), head `de7fba09641182d14fff70c617fbbab6d04dc211`: **491 pruebas aprobadas, 0 fallidas**, y **43/43** casos A26. Incluye las pruebas de persistencia A24 incorporadas y el contraste del mapeo de códigos.

Además se ejecutó dos veces la seed en una transacción de prueba y el [contraste SQL](../database/tests/a26-reglas-v4.sql): guardar v4, versión 2, versión 1 intacta, rechazo a otro propietario, rechazo de UPDATE, guardado v3 y rechazo de mezclar v3 con v4. Los datos de prueba se revirtieron. Después se aplicó la seed de definiciones y se confirmó: ocho configuraciones (cinco anteriores idénticas más tres v4), cero análisis, cero planes y tres bloques existentes. Las secuencias de IDs avanzan aunque se haga rollback. [Resultado conservado](../planning/evidence/a26-persistencia-v4.json).

Este contraste SQL usa bloques borrador y contratos sintéticos sin ejercicios: verifica registro de reglas, referencias y versiones del RPC; no ejecuta el motor, no valida replays, catálogo defensivo SQL, autenticación HTTP ni ciclo privado completo. Las pruebas Node verifican por separado el motor/HTTP con simulaciones. Las rutinas nativas sin `exercise_version_id` siguen devolviendo 422 al intentar guardarlas. A15 sigue sin entregar los originales para activar la tasa en bloques guardados.

La compatibilidad técnica queda resuelta. El PR puede revisarse/integrarse como avance; A26 conserva pendiente la validación deportiva restante. Los casos cortos y exposición individual quedan documentados sin añadir criterios nuevos.
