# A26 · Contraste inicial de heurísticas y límites

**Estado: preparación técnica en revisión; pendiente del criterio deportivo de Roberto.** Elaborado con asistencia de IA bajo su Release. La autorización para preparar esta entrega no se registra como una aprobación de sus resultados deportivos.

Esta ficha reúne los criterios implementados, expectativas calculadas manualmente por la IA y una comprobación reproducible con el motor. **Los casos son sintéticos; no son replays reales ni una calibración poblacional.** A26 permanece abierta hasta registrar la revisión deportiva y atender lo que resulte.

## Configuración examinada

Base del código: [`0843055`](https://github.com/Santana-R/adaptive-rl-coach/commit/0843055fba25b318ddcc6431f7170f20d0c2d08e), con PR #74 integrado. La matriz conserva una copia completa de `RULES_CONFIG`; el script rechaza una configuración distinta para evitar atribuir estos resultados a otra versión.

| Pieza | Versión |
| --- | --- |
| Reglas | `mvp.rules.v3` |
| Métricas | `mvp.metrics.v1` |
| Generador | `mvp.plans.v3` |
| Reparto | `mvp.allocation.v3` |
| Matriz de esta revisión | `a26.validation.v1` |

| Regla | Criterio y cobertura | Alcance actual | Estado deportivo |
| --- | --- | --- | --- |
| Finalización | Eficiencia ponderada ≤30 %, con goles/tiros 5/5. Mínimo de 20/15/10 tiros en 1v1/2v2/3v3. | Modalidades y tipos compatibles admitidos por A14. | Heurística inicial acordada, sin calibración poblacional. |
| Disponibilidad de boost | Porcentaje original exactamente en cero ≥15 % en al menos 3/5; score alto con ≥20 % en 3/5. Los cinco porcentajes son necesarios. | Ranked 2v2/3v3; 1v1 sin evaluar. | Heurística acordada. La extensión a 3v3 necesita contraste específico; la investigación exploratoria anterior fue 2v2. |
| Revisión defensiva | Conteo original ≥2 goles como último defensor en al menos 3/5, con datos 5/5. | Ranked 2v2. | Relevancia confirmada; criterio provisional pendiente de revisión y calibración. |

El porcentaje de boost 0–25 no es el porcentaje con exactamente cero. Los conteos de último defensor no son una medida de culpabilidad, fallos de entrada ni situaciones 2v1. Los scores solo ordenan prioridades técnicas.

## Qué se compara y qué decide Roberto

El archivo [de entradas y expectativas](../planning/fixtures/a26-validacion-heuristicas.v1.json) contiene **35 casos**, con vectores de cinco valores, contextos y resultados esperados. La IA preparó esas expectativas mediante cálculo manual y lectura de los criterios publicados; **no se atribuyen a una revisión humana ya realizada**.

El [script de contraste](../scripts/validar-heuristicas-a26.cjs) materializa cada caso como estadísticas sintéticas del jugador, ejecuta A14 → A09 → Análisis/reglas y genera una propuesta con catálogo explícitamente sintético. Compara el resultado calculado con la expectativa y verifica presupuesto/mínimos. No consulta Ballchasing, cuentas ni SQL.

Hay dos revisiones diferentes:

- **Consistencia técnica:** el código devuelve lo que dicen los parámetros y la tabla; hay coincidencia entre esperado y observado. Se puede comprobar automáticamente.
- **Pertinencia deportiva:** la señal merece ocupar parte del plan, con ese umbral, modalidad y contexto. Roberto la revisa; una coincidencia técnica no la demuestra.

## Matriz para contraste

Los casos de una regla mantienen neutrales las otras dos. Los casos de plan activan las tres de forma explícita cuando corresponde. Los valores completos y las unidades están en el JSON; las entradas se identifican siempre como sintéticas.

### Finalización · once casos

| ID | Caso | Expectativa calculada, pendiente de revisión |
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

| ID | Caso | Expectativa calculada, pendiente de revisión |
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

### Cobertura defensiva · ocho casos

| ID | Caso | Expectativa calculada, pendiente de revisión |
| --- | --- | --- |
| D01 | Dos goles como último defensor en tres partidas | Activa |
| D02 | Dos partidas con muchos goles no alcanzan tres coincidencias | Inactiva |
| D03 | Tres conteos suficientes con dos faltantes | No evaluable |
| D04 | Un gol en cada partida no cumple dos por partida | Inactiva |
| D05 | La hipótesis defensiva no se aplica a 3v3 | No evaluable |
| D06 | Mayor exposición al papel de último defensor no ajusta todavía la señal | Activa |
| D07 | Partidas de diez minutos conservan el criterio de conteos | Activa |
| D08 | Los goles totales del equipo no rellenan el dato defensivo | No evaluable |

D06 y D07 exponen una limitación del criterio actual: el mismo conteo activa revisión aunque aumente la exposición al papel o la duración. El motor **no estima una frecuencia anormal ajustada**. Roberto debe valorar si sigue siendo un selector útil de replays para revisar, si necesita un ajuste o si conviene dejar esos contextos pendientes. La recomendación no atribuye culpa en ninguno de los casos.

### Plan y validación · seis casos

| ID | Caso | Expectativa calculada, pendiente de revisión |
| --- | --- | --- |
| C01 | Tres señales y quince minutos | complete; 15 min; boost 5, defensive_review 5, shooting 5 |
| C02 | Diez minutos cubren dos áreas y declaran la tercera pendiente | partial; 10 min; boost 5, defensive_review 5 |
| C03 | Veinte minutos se reparten en 7/7/6 | complete; 20 min; boost 7, defensive_review 7, shooting 6 |
| C04 | Cuatro minutos no alcanzan el mínimo de una actividad | empty; 0 min |
| C05 | Ninguna regla activa no fabrica un plan de mantenimiento | empty; 0 min |
| C06 | Un jugador ausente invalida el bloque | Bloque inválido: PLAYER_MISMATCH |

Con poco tiempo no se fabrican minutos ni se reparte por debajo de cinco por actividad. El orden técnico actual, con las tres activas, es boost → revisión defensiva → tiro; el objetivo principal aún no cambia ese orden. La matriz deja ese punto visible en C02.

## Resultado técnico y reproducción

El workflow de GitHub Actions ejecuta `npm test`, el comprobador histórico de la propuesta defensiva y esta matriz de A26 con Node.js 22.19.0. El resultado de esta nueva matriz se incorporará al PR y a [la evidencia](../planning/evidence/a26-resultados.v1.json) cuando termine la ejecución; ese enlace se completa antes de presentar la entrega.

El informe conserva commit ejecutado, commit de la rama, versiones, resultado por caso, métricas, estados, prioridades y minutos por área. Los 35 casos no se presentan como 35 replays ni jugadores independientes.

Desde una copia del repositorio:

```sh
npm ci
npm test
node scripts/validar-heuristicas-a26.cjs
```

El script sale con error si una expectativa no coincide. La tolerancia de 1e-12 solo compara el cálculo manual de un decimal con su representación numérica; **las reglas siguen evaluando sus límites sin redondear ni aplicar esa tolerancia**.

## Revisión deportiva que falta

Cada caso conserva `sports_review.status: pending_roberto_review`. Las preguntas destacadas permiten revisar primero las decisiones más relevantes, sin pedir repetir todos los cálculos.

| Caso | Decisión a revisar | Registro de Roberto |
| --- | --- | --- |
| F02 | ¿Mantener los quince tiros mínimos de 2v2 aunque ya se pueda calcular el porcentaje? | Pendiente. |
| B03 | ¿Mantener revisión repetida de tres partidas aunque dos casos aislados sean muy altos? | Pendiente. |
| B07 | ¿Aceptar la extensión provisional a 3v3 manteniendo pendiente su contraste específico? | Pendiente. |
| D01 | ¿Es una señal suficiente para proponer revisión de esas partidas sin atribuir culpa? | Pendiente. |
| D06 | ¿Conservar la revisión provisional aunque el jugador pase más tiempo como último defensor, o ajustar/deferir el criterio? | Pendiente. |
| D07 | ¿Mantenerlo como selector de replays para revisar cuando hay tiempo extra, o hace falta restringirlo? | Pendiente. |
| C02 | ¿El orden técnico actual es aceptable para esta versión cuando el tiempo solo permite dos áreas? | Pendiente. |

Una respuesta puede aceptar provisionalmente el comportamiento, pedir cambiarlo o diferir su aplicación. Debe registrarse lo que Roberto diga, con los casos a los que se refiere. No se infiere aceptación por silencio, por ejecutar tests, por hacer merge de una entrega anterior ni por el Release para preparar esta revisión.

## Incertidumbre y evidencia aún necesaria

- La muestra de boost conservada en el repositorio es exploratoria, de conveniencia, con jugadores repetidos; no establece umbrales representativos por rango.
- Falta contraste de bloques reales para los tres criterios y, especialmente, para exposición/duración en defensa y extensión de boost a 3v3.
- Las pruebas de esta matriz no comprueban la presencia de cada campo en respuestas autenticadas ni el significado detallado de las omisiones del proveedor.
- A15 conserva segundos de boost, pero no su porcentaje original ni positioning original. Los adaptadores actuales conservan esos faltantes; no se convierten en cero para obtener una prioridad. Cerrar A13/A15 no añade automáticamente esos nuevos campos.
- La actividad defensiva requiere revisar manualmente la replay; el agregado no localiza el minuto del evento. Su ejecución dentro del juego sigue sin verificación.
- Una mejora posterior o una sesión completada no demuestra causalidad. La matriz no valida JWT real, la integración privada completa, la persistencia del plan ni su presentación final.

Referencias de criterios y limitaciones: [reglas](reglas-motor.md), [boost](disponibilidad-boost.md), [cobertura defensiva](cobertura-defensiva.md) y [generador](generador-planes.md).

## Qué falta para cerrar A26

1. Completar el contraste técnico y conservar el resultado enlazado a su commit.
2. Registrar la revisión de Roberto sobre los casos y atender las observaciones concretas.
3. Si se acuerda cambiar un criterio, preparar el cambio versionado y repetir sus comprobaciones antes de atribuirle el resultado.
4. Conservar expresamente las limitaciones y la evidencia aún pendiente; no declarar calibración poblacional conseguida.

Esta entrega no cierra A19, A25, A33 o A34. El primer paso de A26 es revisar las heurísticas iniciales con casos reproducibles; el resultado deportivo queda abierto hasta que Roberto lo revise.
