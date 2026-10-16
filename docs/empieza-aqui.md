# Guía breve del equipo

Construimos una web que toma cinco replays, calcula métricas, explica hasta tres prioridades y genera un plan. Otro bloque comparable permite revisar cambios. Las sesiones registran práctica; el rango es declarado. [Requisitos completos](alcance-y-requisitos.md).

## Empieza con una entrega

| Persona | Haz primero | Cómo sabes que entregaste |
| --- | --- | --- |
| Luis | [A04](https://github.com/Santana-R/adaptive-rl-coach/issues/4): sigue [la guía de subida](subir-pantallas-luis.md) y abre el PR de sus cuatro vistas. | Archivos y primer commit visibles desde su cuenta. Después corrige enlaces y móvil. |
| Tadeo | [A06](https://github.com/Santana-R/adaptive-rl-coach/issues/6): servidor Express con `/health`. | Otro integrante puede arrancarlo y obtener `ok`; adaptador real continúa con A05. |
| David | [A08](https://github.com/Santana-R/adaptive-rl-coach/issues/8): registro, acceso y salida por correo en desarrollo. | Un usuario de prueba puede entrar y salir; Google y permisos completos siguen en la misma tarea. |
| Roberto | [A02](https://github.com/Santana-R/adaptive-rl-coach/issues/2): comprueba el caso `comparable.json`. | Quedan calculados 25 %, 30 % y +5 puntos porcentuales con su explicación. Después revisa los otros casos y programa A09/A10. |

[Ver estas cuatro tareas](https://github.com/Santana-R/adaptive-rl-coach/issues?q=is%3Aissue%20is%3Aopen%20label%3Asiguiente). La etiqueta `siguiente` no acredita trabajo iniciado. Las demás tareas son la cola del proyecto. A01/A03/A07 se consultan y completan con observaciones durante las primeras entregas; no obligan a leer toda la documentación para comenzar una pieza independiente.

## Qué existe y qué falta

- En GitHub: demo Carga, Análisis y Plan con datos sintéticos; se abre desde `public/carga.html`. [Recorrido](demo-progsa.md).
- Fuera del repositorio: ZIP de Luis con Inicio, Acerca, Ayuda y Crear cuenta. Revisado; su subida y correcciones siguen pendientes.
- Por implementar/conectar: servidor, datos reales, acceso, reglas verificadas, persistencia y el ciclo completo. Las maquetas no cierran esas tareas.

Las vistas de Luis se incorporarán inicialmente en `public/sitio/` para conservar el avance original. A04 unificará navegación/estilos y comprobará que las dependencias visuales no se cargan por duplicado. La pantalla llamada `login.html` contiene registro y se aclarará antes de conectar A12.

## Responsabilidades y aprendizaje

Luis: frontend. Tadeo: servidor, Ballchasing e integración A25. David: datos, autenticación, permisos e historial. Roberto: métricas, comparación, reglas y planes.

Roberto conserva **A19**, una función completa: consultar bloques propios → reutilizar cálculos → responder desde Express → mostrar Análisis. Se construye por partes usando el servidor, consultas y componentes comunes; Luis revisa la interfaz.

Cada quien sube sus cambios. Un PR breve explica qué hizo, cómo funciona y cómo comprobarlo. Las revisiones son asíncronas. [Pasos de entrega](../CONTRIBUTING.md).

## Qué herramienta abrir

- **GitHub:** código, tareas, PRs y estado del trabajo.
- **Notion:** explicación y referencias; enlaza las tareas vigentes de GitHub.
- **Miro:** relaciones y diagramas, consultados cuando ayuden a entender una conexión.

La [documentación técnica](README.md) se consulta según la tarea. El [calendario](calendario-y-dependencias.md) conserva metas internas y jueves como avance intermedio; las fechas y rúbricas académicas siguen por confirmar. La evaluación individual usará los commits según lo indicado por el profesor; el conteo por sí solo no describe el alcance ni la comprensión de una contribución.
