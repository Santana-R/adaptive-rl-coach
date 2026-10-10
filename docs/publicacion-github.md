# Publicación en GitHub

GitHub ya tiene el [repositorio privado](https://github.com/Santana-R/adaptive-rl-coach), el [Project](https://github.com/users/Santana-R/projects/1), [44 issues](https://github.com/Santana-R/adaptive-rl-coach/issues) y [seis hitos semanales](https://github.com/Santana-R/adaptive-rl-coach/milestones). Se reutilizó el repositorio existente. Cada issue contiene responsable y revisor propuestos, fecha interna, RF, dependencias, aceptación y evidencia. La configuración final del Project y la subida de este paquete están en curso.

Contenido preparado: README, acuerdos, alcance RF01–RF12, calendario, arquitectura, matriz de pruebas, 44 tareas en JSON/CSV, plantillas de issue y PR y script de publicación. No contiene una aplicación funcional.

## Publicar

Requiere Python 3, Git y GitHub CLI actual, conexión de red y una cuenta con permisos de repositorio y Projects. Comprobar la ayuda de la versión instalada si difiere.

```sh
gh auth login -h github.com
gh auth refresh -h github.com -s project
python3 scripts/publish_github.py
python3 scripts/publish_github.py --execute
```

La primera ejecución es una vista previa que no realiza cambios externos. `--execute` crea un repositorio privado bajo Santana-R, publica el paquete inicial, crea seis milestones, 44 issues y un Project con campos de semana, prioridad, responsables, fechas y dependencias. Los recursos iniciales ya existen; utilizar los enlaces de `planning/github-links.json` para consultarlos. Si falta identidad de Git, configurarla localmente antes de continuar; el script no inventa autor ni correo.

El script usa marcadores de tarea para evitar repetir issues y un archivo local ignorado, `planning/github-state.json`, para reanudar. No sobrescribe cuerpos de issues existentes ni cambia el flujo de trabajo de elementos ya usados. Si existe un repositorio no creado por esta ejecución, se detiene; revisar antes de utilizar `--use-existing`, que agrega planificación sin sobrescribir archivos remotos. Una reanudación requiere conservar el archivo de estado. Las 44 issues y los seis hitos se publicaron y verificaron desde la interfaz web. El script conserva los marcadores y los títulos reales para reutilizar los recursos; no se ejecutó desde la terminal de esta sesión.

## Configurar las vistas

1. Board: agrupar por **Status**, el campo operativo único (Backlog, Ready, In progress, In review, Done, Blocked).
2. Table: mostrar responsable, revisor, prioridad, semana, entrega, dependencias y RF.
3. Roadmap: usar Start date/Target date y agrupar por responsable o semana.
4. Filtrar S6 cuando se revise el desarrollo obligatorio; son contingencias.

El script no configura vistas, automatizaciones, protección de ramas ni invitaciones. Esos ajustes se realizan tras comprobar los permisos disponibles. `planning/github-members.example.json` permite registrar los usuarios reales de los cuatro; no adivinar sus cuentas. El responsable/revisor se conserva por nombre hasta vincularlos con usuarios verificados.

Referencias: [GitHub CLI](https://cli.github.com/manual), [GitHub Projects](https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/about-projects).
