# Pruebas y entrega

## Matriz mínima de validación
| Prueba | RF | Caso y resultado esperado | Responsable | Revisor |
| --- | --- | --- | --- | --- |
| P01 | RF01–RF02 | Correo, Google, perfil, cierre de sesión, rol y suspensión. | Luis | David |
| P02 | RF03–RF05 | 0/4/6 archivos, formato incorrecto, duplicado, pendiente, fallo transitorio y reintento. | Tadeo | Luis |
| P03 | RF04–RF07 | Jugador ausente, mezcla de modalidad/tipo, cronología y medición no equivalente. | Roberto | Tadeo |
| P04 | RF06 | Datos ausentes como null; porcentajes con totales y unidades verificadas a mano. | Roberto | David |
| P05 | RF08–RF09 | Hasta tres prioridades, evidencia, empate, catálogo parcial/vacío y disponibilidad. | Roberto | David |
| P06 | RF09–RF10 | Actualizar plan después de editar meta/perfil/catálogo sin cambiar el snapshot previo. | David | Roberto |
| P07 | RF10 | CRUD de objetivos y sesiones, archivo vinculado, corrección/eliminación y recálculo. | David | Tadeo |
| P08 | RF11 | Métricas, objetivos y rango declarado separados; períodos, muestras y exclusiones. | Luis | Roberto |
| P09 | RF12 | Admin usuarios activo/suspendido y catálogo CRUD; jugador sin permiso. | Tadeo | David |
| P10 | RF01–RF12 | Jugador A no accede a B; endpoints sin token/rol; replay privado y token de servidor. | Tadeo | David |
| P11 | RF01–RF12 | Dos bloques reales y comparables: carga, diagnóstico, plan, sesión y reevaluación. | Tadeo | Roberto |
| P12 | RF01–RF12 | Instalación por otro compañero, recorrido con datos de respaldo y ensayo. | Tadeo | Luis |

Cada resultado guarda fecha, versión/commit, datos usados, resultado esperado, resultado observado y evidencia. Priorizar pruebas de reglas, permisos, integridad y recorrido real; no repetir pruebas sin cambios o dudas nuevas.

## Checklist del viernes 13
- [ ] RF01–RF12 demostrados y vinculados a evidencia.
- [ ] Trece pantallas conectadas y tres CRUD verificados.
- [ ] Dos bloques reales comparables y fallos controlados.
- [ ] Planes históricos intactos y sesiones recalculadas.
- [ ] Sin defectos que impidan el ciclo principal ni credenciales publicadas.
- [ ] README, instalación y seed reproducidos por otro integrante.
- [ ] Guion, capturas y ensayo de los cuatro listos.
- [ ] Fechas y rúbricas de LBPWEB/PROGSA confirmadas.

## Documentos por materia
LBPWEB: requisitos, pantallas, CRUD, modelo de datos, ejecución y pruebas funcionales. PROGSA: problema, System Map, decisiones, reglas/adaptación, evidencia y límites. Esta distribución es propuesta; ajustar a la rúbrica cuando el profesor la confirme.


La revisión P11 la coordina Tadeo y la comprueba Roberto. La función completa A19 se comprueba también en A33: datos, respuesta del servidor y pantalla deben coincidir. Revisar de forma asíncrona con pasos reproducibles.


## Evidencia individual en Git

El profesor indicó que revisará los commits para calificar aportaciones individuales. Cada integrante crea y sube sus cambios con su identidad, enlaza tarea/PR y puede explicar lo implementado. Conservar commits al integrar. Un primer commit de un ZIP registra el avance disponible en ese momento; los siguientes describen modificaciones nuevas.

La planificación y demo inicial tuvieron asistencia de IA. Su publicación desde Roberto no reparte autoría entre el equipo ni acredita integración real. Las dependencias visuales se identifican como bibliotecas. Confirmar rúbrica y condiciones sobre IA antes de la entrega académica; no inventar un número mínimo de commits.
