# Publicación en GitHub

## Revisión publicada el 12 de octubre
La organización inicial se publicó y verificó el 9 de octubre. La revisión autorizada el 12 actualiza las 44 issues existentes, sus etiquetas de responsable, los campos Responsable/Revisor del Project, las instrucciones detalladas y esta documentación. Se mantienen estados, fechas, prioridades y números de issue. Las vistas usan el reparto actualizado: Roberto 11, Luis 10, Tadeo 12 y David 11, incluidas contingencias.

[Empieza aquí · Guía del equipo](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f) explica el uso de las herramientas y el primer paso de cada persona. A19 es la función completa de Roberto; A25 la integración coordinada por Tadeo. La aplicación todavía está pendiente de implementación.


GitHub ya tiene el [repositorio privado](https://github.com/Santana-R/adaptive-rl-coach), el [Project](https://github.com/users/Santana-R/projects/1), [44 issues](https://github.com/Santana-R/adaptive-rl-coach/issues) y [seis hitos semanales](https://github.com/Santana-R/adaptive-rl-coach/milestones). Se reutilizó el repositorio existente. Cada issue contiene responsable y revisor propuestos, fecha interna, RF, dependencias, aceptación y evidencia. La documentación y las plantillas están publicadas; el Project está enlazado al repositorio y sus 44 tareas tienen semana, responsable, revisor, prioridad y fechas de inicio y entrega verificadas.

Contenido preparado: README, acuerdos, alcance RF01–RF12, calendario, arquitectura, matriz de pruebas, 44 tareas en JSON/CSV, plantillas de issue y PR y script de publicación. No contiene una aplicación funcional.

## Trabajar desde el Project

- [Backlog](https://github.com/users/Santana-R/projects/1/views/1): tabla agrupada por semana, con estado, fechas, responsable, revisor y prioridad.
- [Board](https://github.com/users/Santana-R/projects/1/views/2): Backlog, Ready, In progress, In review, Done y Blocked.
- [Semana activa](https://github.com/users/Santana-R/projects/1/views/3): los ocho compromisos de S1. Al iniciar otra semana, cambiar y guardar el filtro `semana:S2`, `semana:S3`, etc.
- [Roadmap](https://github.com/users/Santana-R/projects/1/views/4): calendario agrupado por semana, basado en Start date y Target date.
- [Por integrante](https://github.com/users/Santana-R/projects/1/views/5): tareas por responsable; la revisión del 12 propone Roberto 11, Luis 10, Tadeo 12 y David 11, incluidas contingencias.

Los nombres en Responsable y Revisor son el reparto provisional aprobado. Falta confirmar la disponibilidad e identificar las cuentas reales de Tadeo, Luis y David para invitarlos y asignar usuarios. No se enviaron invitaciones a cuentas inferidas.

## Script opcional de publicación

La configuración ya está publicada. No hace falta ejecutar el script para empezar a trabajar. Se conserva como herramienta opcional para reutilizar o revisar la planificación.

Requiere Python 3, Git y GitHub CLI actual, conexión de red y una cuenta con permisos de repositorio y Projects. Comprobar la ayuda de la versión instalada si difiere.

```sh
gh auth login -h github.com
gh auth refresh -h github.com -s project
python3 scripts/publish_github.py
python3 scripts/publish_github.py --execute
```

La primera ejecución es una vista previa que no realiza cambios externos. `--execute` crea un repositorio privado bajo Santana-R, publica el paquete inicial, crea seis milestones, 44 issues y un Project con campos de semana, prioridad, responsables, fechas y dependencias. Los recursos iniciales ya existen; utilizar los enlaces de `planning/github-links.json` para consultarlos. Si falta identidad de Git, configurarla localmente antes de continuar; el script no inventa autor ni correo.

El script usa marcadores de tarea para evitar repetir issues y un archivo local ignorado, `planning/github-state.json`, para reanudar. No sobrescribe cuerpos de issues existentes ni cambia el flujo de trabajo de elementos ya usados. Si existe un repositorio no creado por esta ejecución, se detiene; revisar antes de utilizar `--use-existing`, que agrega planificación sin sobrescribir archivos remotos. Una reanudación requiere conservar el archivo de estado. Las 44 issues y los seis hitos se publicaron y verificaron desde la interfaz web. El script conserva los marcadores y los títulos reales para reutilizar los recursos; no se ejecutó desde la terminal de esta sesión.

## Criterios de las vistas

1. Board: agrupar por **Status**, el campo operativo único (Backlog, Ready, In progress, In review, Done, Blocked).
2. Table: mostrar responsable, revisor, prioridad, semana y fechas; consultar dependencias y RF en el cuerpo de cada issue.
3. Roadmap: usar Start date/Target date y agrupar por responsable o semana.
4. Filtrar S6 cuando se revise el desarrollo obligatorio; son contingencias.

El script no configura vistas, automatizaciones, protección de ramas ni invitaciones. Esos ajustes se realizan tras comprobar los permisos disponibles. `planning/github-members.example.json` permite registrar los usuarios reales de los cuatro; no adivinar sus cuentas. El responsable/revisor se conserva por nombre hasta vincularlos con usuarios verificados.

Referencias: [GitHub CLI](https://cli.github.com/manual), [GitHub Projects](https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/about-projects).
