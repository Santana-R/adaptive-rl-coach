# Forma de trabajo propuesta

> Propuesta histórica de septiembre, sustituida para el trabajo actual por [Equipo y acuerdos semanales](equipo-y-acuerdos-semanales.md) y [Empieza aquí](empieza-aqui.md). El reparto de la tabla siguiente y su ritmo describen la propuesta anterior. Luis lleva frontend, Tadeo backend, David datos/auth y Roberto métricas/reglas/planes y A19 en la revisión del 12 de octubre de 2026.

## Principio

El equipo trabajará por funcionalidades completas. Cada tarea deberá incluir la interfaz, la lógica necesaria, los datos y una comprobación básica. Esto permite que todos entiendan cómo se conectan las distintas partes del sistema.

Cada área tendrá:

- Una persona responsable principal.
- Una persona revisora que conozca y pueda explicar el trabajo.
- Tareas pequeñas registradas como issues.
- Una rama por tarea y un pull request antes de integrar a `main`.

## Distribución provisional

Esta distribución es una propuesta y deberá ajustarse después de que cada integrante indique qué conoce y qué quiere aprender.

| Integrante | Área principal propuesta | Área secundaria para aprendizaje y revisión |
|---|---|---|
| Roberto | Integración técnica, procesamiento de replays y motor adaptativo por reglas | Panel de análisis y Chart.js |
| David | Experiencia de usuario, panel, gráficas y comportamiento adaptable a móviles | Historial de análisis |
| Omar | Autenticación, perfiles y administración de usuarios con Supabase | Objetivos y sesiones |
| Luis | Objetivos, sesiones, ejercicios y comprobaciones funcionales | Autenticación y perfiles |

La asignación de David se propone a partir de sus observaciones sobre métricas, historial y experiencia móvil; no presupone que ya domine esas tecnologías. Las asignaciones de Omar y Luis son provisionales porque todavía no se han confirmado sus conocimientos o preferencias.

## Flujo de GitHub

1. Crear o elegir un issue concreto.
2. Abrir una rama con un nombre como `feature/carga-replays` o `fix/menu-movil`.
3. Realizar cambios pequeños y commits descriptivos.
4. Abrir un pull request y solicitar la revisión del responsable secundario.
5. Corregir observaciones y comprobar el flujo en computadora y móvil.
6. Integrar a `main` cuando cumpla la definición de terminado.

## Definición de terminado

Una tarea se considera terminada cuando:

- Cumple el criterio acordado en el issue.
- Funciona en computadora y, cuando corresponda, en pantalla móvil.
- Incluye estados de carga, vacío y error cuando son necesarios.
- No expone claves, tokens ni replays privados.
- Documenta cualquier cambio de base de datos o configuración.
- Fue revisada por al menos otro integrante.
- Puede ser explicada por la persona responsable y la revisora.

## Ritmo recomendado

- Reunión semanal breve para integrar avances y resolver bloqueos.
- Demostración funcional cada dos semanas.
- Rotación de revisores a mitad del proyecto para evitar conocimiento aislado.
- Congelamiento de funciones nuevas dos semanas antes de la entrega final para concentrarse en pruebas, documentación y presentación.


