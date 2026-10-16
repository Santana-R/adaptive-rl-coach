# Adaptive RL Coach

Web de entrenamiento de Rocket League: cinco replays → análisis con reglas → plan → seguimiento.

## Qué hacer ahora

Abre [las cuatro próximas entregas](https://github.com/Santana-R/adaptive-rl-coach/issues?q=is%3Aissue%20is%3Aopen%20label%3Asiguiente). La etiqueta **siguiente** señala qué tomar primero; no significa que ya esté iniciado.

| Persona | Próxima entrega |
| --- | --- |
| Luis · frontend | [A04: subir las cuatro pantallas de su ZIP desde su cuenta](https://github.com/Santana-R/adaptive-rl-coach/issues/4). [Pasos completos](docs/subir-pantallas-luis.md). |
| Tadeo · backend | [A06: arrancar Express y comprobar `/health`](https://github.com/Santana-R/adaptive-rl-coach/issues/6). |
| David · datos y acceso | [A08: comprobar registro, acceso y salida con correo en desarrollo](https://github.com/Santana-R/adaptive-rl-coach/issues/8). |
| Roberto · métricas y adaptación | [A02: comprobar un cálculo con datos de ejemplo y guardar el resultado esperado](https://github.com/Santana-R/adaptive-rl-coach/issues/2). |

Estas son primeras entregas pequeñas. Cada issue conserva lo que falta para completar su alcance. Roberto construirá Análisis de extremo a extremo en A19.

## Abrir lo que ya existe

La demo Carga → Análisis → Plan ya está en `main`. Descarga **Code → Download ZIP**, extrae y abre `public/carga.html`. Pulsa **Usar cinco replays de ejemplo**. [Instrucciones y alcance](docs/demo-progsa.md).

Los datos son sintéticos. Autenticación, Ballchasing y persistencia reales siguen pendientes. Las cuatro vistas públicas de Luis fueron revisadas desde su ZIP y están pendientes de que él las suba siguiendo su guía.

## Cómo trabajamos

Una entrega pequeña por persona, una rama para ese cambio y commits desde la cuenta de quien lo construye. El PR explica qué cambió, cómo probarlo y qué falta. [Flujo breve](CONTRIBUTING.md).

La planificación y la demo inicial se prepararon con asistencia de IA y se publicaron desde la cuenta de Roberto. Ese historial no acredita por sí solo implementación individual del equipo. Los próximos cambios deben reflejar aportaciones reales y poder explicarse.

- [Guía breve del equipo](docs/empieza-aqui.md)
- [Referencias técnicas y requisitos](docs/README.md)
- [Notion: explicación del proyecto](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f)
- [Miro: relaciones del sistema](https://miro.com/app/board/uXjVEcA_AAE=/)

GitHub lleva el trabajo actual. El calendario es una referencia interna; se prefieren avances intermedios en jueves. Las fechas académicas y la rúbrica detallada siguen pendientes de confirmación.
