# Adaptive RL Coach

Cinco partidas de Rocket League → métricas → prioridades explicables → plan → comparación posterior.

## Esta semana: motor funcionando para el 9 de noviembre

Usaremos las pantallas existentes **Carga → Análisis → Plan**. El motor debe calcular sobre las entradas y adaptar la rutina; las vistas actuales todavía son una demo con reglas ilustrativas.

| Persona | Empieza por esta entrega | Después |
| --- | --- | --- |
| Roberto · motor | [A02: primera regla y casos comprobables](https://github.com/Santana-R/adaptive-rl-coach/issues/2) · [guía paso a paso](docs/motor-paso-a-paso.md) | Métricas → comparación → reglas → plan → API y Análisis. |
| Tadeo · servidor | [A06: Express, /health y servir public/](https://github.com/Santana-R/adaptive-rl-coach/issues/6) | [A05: comprobar Ballchasing antes del 3](https://github.com/Santana-R/adaptive-rl-coach/issues/5) → entrada válida al motor. |
| Luis · interfaz | [A04: subir sus cuatro pantallas desde su cuenta](https://github.com/Santana-R/adaptive-rl-coach/issues/4) · [instrucciones](docs/subir-pantallas-luis.md) | Conectar Carga y Plan; revisar Análisis con Roberto. |
| David · datos | [A07: preparar la revisión de Fase 2 para el martes 3](https://github.com/Santana-R/adaptive-rl-coach/issues/7) | Catálogo inicial → consultas → análisis y versiones del plan. |

[Empieza aquí: cuatro próximas entregas](https://github.com/users/Santana-R/projects/1/views/1) · [Cola del motor del 9](https://github.com/users/Santana-R/projects/1/views/3). Tomar una por persona; `siguiente` no significa iniciada. Al terminar, mover esa etiqueta a su próxima entrega.

## Fechas de noviembre de 2026

| Fecha | Entrega |
| --- | --- |
| Martes 3 | Revisión Fase 2 de LBPWEB: base de datos. |
| Lunes 9 | Motor adaptativo funcionando para PROGSA. |
| Lunes 16 | Proyecto completo para PROGSA. |
| Lunes 23, **tentativo** | Entrega final de LBPWEB. |

Piezas principales 4–6 e integración/ensayo 7–8 son metas internas propuestas. No se asumen horas disponibles de nadie. [Calendario](docs/calendario-y-dependencias.md).

## Lo que ya está preparado

- **Demo:** abrir `public/carga.html` y usar cinco replays de ejemplo. [Qué hace y qué falta](docs/demo-progsa.md). No analiza el contenido de los .replay ni tiene servidor/persistencia conectados.
- **Fase 2:** se verificaron las **30 tablas existentes** en Supabase el 1 de noviembre. [Estado, documento y revisión](docs/fase2-estado.md) · [esquema SQL](database/esquema-fase2.sql). La revisión del profesor sigue pendiente.
- **Luis:** sus cuatro pantallas están fuera de este repositorio hasta integrar A04 desde su cuenta.
- **Pendiente:** motor definitivo, servidor, entrada real, consultas/persistencia y acceso. La creación de tablas es avance distinto de conectar esas operaciones.

## Cómo trabajar

Cada quien construye y sube su cambio desde su identidad de Git. El PR explica qué cambió, cómo comprobarlo y qué falta. Avisar bloqueos en la issue al detectarlos; apoyo por escrito sin reuniones obligatorias. [Guía breve](docs/empieza-aqui.md) · [Cómo entregar](CONTRIBUTING.md).

La planificación y demo inicial tuvieron asistencia de IA y no acreditan aportaciones individuales del equipo. Se conserva el historial y se registran los cambios reales.

[Referencias](docs/README.md) · [Cola del proyecto](docs/backlog.md) · [Notion](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f) · [Miro](https://miro.com/app/board/uXjVEcA_AAE=/).
