# Adaptive RL Coach

Cinco partidas de Rocket League → métricas → prioridades explicables → plan → comparación posterior.

## Apoyo con cualquier IA

Lee [CONTEXTOIA.md](CONTEXTOIA.md) y tu issue actual antes de empezar. Puedes adjuntarlos a tu asistente favorito; el archivo incluye un mensaje de inicio, reparto, reglas, estado y la autorización por Release.

## Esta semana: motor funcionando para el 9 de noviembre

**Las pantallas oficiales de Carga/Replays → Análisis → Plan están en `public/sitio/html`.** Roberto mantiene el motor/API y conecta sus resultados con estas vistas. [Reparto de frontend y entregas de Luis](docs/frontend-luis.md).

| Persona | Empieza por esta entrega | Después |
| --- | --- | --- |
| Roberto · motor | [A02: primera regla y casos comprobables](https://github.com/Santana-R/adaptive-rl-coach/issues/2) · [guía paso a paso](docs/motor-paso-a-paso.md) | Métricas → comparación → reglas → plan → API y Análisis. |
| Tadeo · servidor | [A06: Express, /health y servir public/](https://github.com/Santana-R/adaptive-rl-coach/issues/6) | [A05: comprobar Ballchasing antes del 3](https://github.com/Santana-R/adaptive-rl-coach/issues/5) → entrada válida al motor. |
| Luis · interfaz | [A11: diseñar y construir Carga](https://github.com/Santana-R/adaptive-rl-coach/issues/11) · [guía de frontend](docs/frontend-luis.md) | Construir Análisis en A19 con Roberto, Plan en A27 y las demás vistas en A12/A20/A28. |
| David · datos | [A23: preparar el catálogo que necesita el motor](https://github.com/Santana-R/adaptive-rl-coach/issues/23) | Consultas → análisis y versiones del plan. |

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

- **Interfaz oficial:** abrir `public/sitio/html/replays.html` para cargar cinco replays y consultar el historial. Análisis y Plan están en `public/sitio/html/analisis.html` y `public/sitio/html/plan.html`.
- **Fase 2:** se verificaron las **30 tablas existentes** en Supabase el 1 de noviembre. [Estado, documento y revisión](docs/fase2-estado.md) · [esquema SQL](database/esquema-fase2.sql). El equipo confirmó que el documento está listo para presentarlo; la revisión del profesor sigue pendiente. A07 solo da seguimiento a sus observaciones y no bloquea la implementación.
- **Luis:** sus cuatro vistas públicas se integraron en PR #50; A03 y A04 están cerradas. El diseño y la construcción del resto del frontend continúan en A11/A12/A19/A20/A27/A28 y la revisión A35.
- **Motor:** métricas A09, comparación A10, reglas A17 y generador de propuestas A18 implementados. Análisis A19 calcula por HTTP y usa la interfaz de Luis; [guía de integración y límites](docs/analisis-integracion.md).
- **Pendiente:** entrada real, adaptación de las consultas de bloques A15 a Análisis y ruta de generación de Plan. Perfil y catálogo ya tienen consultas integradas; Análisis reutiliza el acceso de Luis. La creación de tablas es avance distinto de conectar esas operaciones.

## Ejecutar la demo en local

Probado con Node.js v24.7.0 y npm 11.5.1. Desde la raíz del repositorio, ejecuta:

```powershell
npm ci
npm start
```

Abre `http://127.0.0.1:3000/health` para comprobar que el servidor responde con `{"status":"ok"}`.

En `http://127.0.0.1:3000/`, entra a Replays para cargar cinco archivos `.replay`. Para probar Análisis con entradas sintéticas calculadas por el motor, detén el servidor y arráncalo con la demo explícita:

```sh
# macOS / Linux
ANALYSIS_DEMO_ENABLED=true npm start
```

En PowerShell: `$env:ANALYSIS_DEMO_ENABLED="true"; npm start`. Abre `http://127.0.0.1:3000/sitio/html/analisis.html` y elige primer bloque, posterior, modalidad incompatible o faltantes. La demo se deshabilita por defecto y solo admite conexiones locales. Plan (`sitio/html/plan.html`) conserva su demostración separada; no representa un plan del bloque calculado en Análisis.

La carga de archivos reales se envía a `POST /api/v1/blocks` como `multipart/form-data` y queda en estado `pending` en el servidor local en memoria. El procesamiento privado, persistencia, autenticación y transición a `ready` pertenecen a A13/A15/A30; la interfaz no presenta una carga aceptada como análisis calculado.

El puerto predeterminado es `3000`. Para cambiarlo, copia `.env.example` a `.env`, ajusta `PORT` y reinicia el servidor. Para detenerlo, presiona `Ctrl+C` en la terminal.

## Cómo trabajar

Cada quien construye y sube su cambio desde su identidad de Git. El PR explica qué cambió, cómo comprobarlo y qué falta. Avisar bloqueos en la issue al detectarlos; apoyo por escrito sin reuniones obligatorias. [Guía breve](docs/empieza-aqui.md) · [Cómo entregar](CONTRIBUTING.md).

La planificación y demo inicial tuvieron asistencia de IA y no acreditan aportaciones individuales del equipo. Se conserva el historial y se registran los cambios reales.

[Referencias](docs/README.md) · [Cola del proyecto](docs/backlog.md) · [Notion](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f) · [Miro](https://miro.com/app/board/uXjVEcA_AAE=/).
