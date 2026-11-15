# Calendario vigente · 1 de noviembre de 2026

Fechas comunicadas por Roberto. Las metas internas son propuestas; no implican horas disponibles ni compromisos personales confirmados.

| Fecha de noviembre | Tipo | Resultado |
| --- | --- | --- |
| 3 | Revisión académica LBPWEB | Presentar el documento de Fase 2, ya comprobado y listo; registrar observaciones del profesor. |
| 9 | Entrega académica PROGSA | Motor adaptativo funcionando. |
| 16 | Entrega académica PROGSA | Proyecto completo. |
| 23 | LBPWEB, **tentativo** | Paquete final; confirmar con el profesor. |

## Antes del motor

| Periodo interno propuesto | Entregas |
| --- | --- |
| 1–3 | Roberto: primera regla/casos. Tadeo: servidor y prueba real del proveedor. Luis: subir su avance. David: catálogo inicial del motor sobre las tablas existentes. |
| 4–6 | Métricas, comparación, reglas, catálogo, plan, consultas/versiones y conexión a las tres vistas. |
| 7–8 | Integración: dos bloques, faltantes/incompatibles, plataforma y minutos; ensayo y correcciones. |
| 9 | Motor, evidencias del commit probado y fuente identificada. |

## Después del motor

Del 9 al 15: completar acceso/perfil, carga privada robusta, objetivos, sesiones, reportes, administración y trece pantallas. Cerrar permisos, integridad y ejecución reproducible antes del 16. Del 17 al 22: observaciones y paquete LBPWEB para el 23 tentativo.

## Dependencias que importan

- Tadeo: A06 → A05 → A14 entrega servidor y estadísticas con contexto/unidades.
- Roberto: A02 → A09 → A10 → A17 → A18 → A19 calcula decisiones y conecta motor/API con la interfaz de Análisis construida por Luis.
- David: A23 → A15 → A24 entrega catálogo y conserva resultados/versiones. A07 solo sigue el documento y no bloquea estas tareas.
- Luis: A03/A04 cerradas → A11 construye Carga → A19 construye Análisis con Roberto → A27 construye Plan. A12/A20/A28 completan acceso/Perfil, Objetivos, Sesiones e historial; A35 revisa coherencia visual.
- A25 integra; A33 comprueba el motor; A34/A36 conservan evidencia y ensayo.

Las funciones avanzan con fixtures mientras llegan dependencias. Cerrar una integración requiere probar el recorrido conectado. Auth no bloquea una función local, pero sí el uso compartido con datos reales.

## Cómo interpretar GitHub

Hitos 1–4 representan estas cuatro entregas. Fechas de issues = metas internas; `siguiente` = una próxima entrega por persona. El estado real depende de evidencia, no de tener una fecha.

El Project tiene dos entradas verificadas: [Empieza aquí](https://github.com/users/Santana-R/projects/1/views/1), con cuatro próximas tareas, y [Motor · 9 nov](https://github.com/users/Santana-R/projects/1/views/3), con las 21 tareas del hito agrupadas por persona. Board y Por integrante muestran cuentas/hitos actuales. La vista [Histórico · fechas de octubre](https://github.com/users/Santana-R/projects/1/views/4) conserva el Roadmap anterior; sus campos Start date/Target date son históricos. Consultar las metas internas en cada issue y las fechas académicas en los hitos. Las antiguas etiquetas semana:S1–S6 se retiraron de las tareas.

El [calendario de octubre](historico/calendario-octubre.md) es histórico y fue sustituido por esta revisión.

## Aclaración de frontend · 14 de noviembre

Luis diseña y construye las interfaces definitivas según los bosquejos. Las vistas del cascarón PROGSA son provisionales; no se adoptan como diseño final. [Reparto y entregas](frontend-luis.md). Se conservan las fechas académicas y las metas internas históricas; esta aclaración no establece compromisos ni fechas nuevas.
