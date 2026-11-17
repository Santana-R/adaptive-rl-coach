# Cobertura defensiva · propuesta inicial v0

Esta ficha conserva el origen de la tercera regla, preparado bajo el primer Release del 16 de noviembre de 2026. Un Release posterior autorizó integrar extracción, regla provisional, actividad de revisión, reparto y pruebas. La [implementación v3 y sus límites](cobertura-defensiva.md) es la referencia actual de la rama del PR #74.

## Artefactos de especificación

- [Propuesta estructurada v0](../planning/proposals/cobertura-defensiva.v0.json): hipótesis de al menos dos goles recibidos como último defensor en tres de cinco ranked 2v2, datos completos del jugador. Su `runtime_enabled: false` registra el estado de aquella propuesta; el motor no consulta ese campo.
- [33 casos sintéticos](../planning/fixtures/cobertura-defensiva-propuesta.v0.json): seis candidatos, cinco sin candidato y 22 no evaluables.
- [Comprobador aislado](../planning/proposals/comprobar-cobertura-defensiva.v0.cjs): comprueba la consistencia de esa especificación, no ejecuta por sí solo el motor ni acredita datos reales.

La relevancia del enfoque fue confirmada por Roberto. El umbral continúa siendo provisional y pendiente de calibración; ninguna prueba sintética demuestra que sea una frecuencia anormal para un rango.

## Validación y continuidad

La propuesta se comprobó primero en JavaScript V8 y después con Node 22.19.0 en [run 43979203105](https://github.com/Santana-R/adaptive-rl-coach/actions/runs/43979203105), junto con las 382 pruebas de la base. La implementación posterior ejecutó **447 pruebas**, incluidas 65 nuevas, en [run 43979860196](https://github.com/Santana-R/adaptive-rl-coach/actions/runs/43979860196).

Los casos de v0 también se materializan contra las funciones de producción en `tests/defensive.test.cjs`. El [documento actual](cobertura-defensiva.md) explica la evidencia, actividad, versiones, tiempos, datos persistidos ausentes y los pendientes de A13/A15/A19/A24/A26/A33/A37.
