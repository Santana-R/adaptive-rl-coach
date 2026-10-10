# Alcance y requisitos

## Producto y límite de alcance
Aplicación web de entrenamiento de Rocket League: cinco replays privados → métricas comparables → hasta tres prioridades explicables → plan versionado → sesiones y seguimiento. Stack acordado: HTML/CSS, Bootstrap, JavaScript, jQuery, Chart.js, Node.js LTS/Express, Supabase PostgreSQL/Auth y Ballchasing.

La entrega incluye trece pantallas y tres CRUD: objetivos, sesiones y ejercicios. Administración de usuarios significa consulta y cambio de estado. Objetivos enlazados se archivan. Quedan fuera entrenamiento de modelos de ML o reinforcement learning, coaching en vivo, rotaciones automáticas, MMR automático, chat, pagos y app nativa. Discord es opcional.

## Matriz de requisitos
| RF | Función | Aceptación resumida | Tareas |
| --- | --- | --- | --- |
| RF01 | Registro y autenticación | Correo o Google; roles jugador/admin. Discord opcional. Administrador fuera del registro público. | A08, A12, A37 |
| RF02 | Perfil del jugador | Plataforma, modalidad e identidad Epic o Steam persistentes y validadas. | A12, A15 |
| RF03 | Carga de cinco replays | Exactamente cinco .replay desde PC. | A11, A13 |
| RF04 | Validación del bloque | Formato, duplicados, jugador y modalidad; compatibilidad documentada. | A14, A30 |
| RF05 | Procesamiento y estados | Cargas privadas, IDs, estados pendientes/fallidos/listos y reintentos. | A13, A30 |
| RF06 | Métricas normalizadas | Jugador correcto en cinco replays, unidades, faltantes y agregación ponderada. | A09, A14, A19 |
| RF07 | Comparación válida | Misma identidad, modalidad, tipo y medición equivalente; seguimiento posterior o línea base. | A10, A33 |
| RF08 | Diagnóstico explicable | Máximo tres prioridades con regla y evidencia. | A17, A26, A33 |
| RF09 | Plan personalizado | Ejercicios activos compatibles; tiempo disponible; snapshots, versiones y cobertura parcial/vacía. | A18, A23, A24, A27 |
| RF10 | Objetivos y sesiones | CRUD con archivo de metas vinculadas, historial y sesiones sobre versión exacta; recálculo. | A16, A20, A21, A31, A39 |
| RF11 | Reportes separados | Métricas, objetivos y rango declarado separados, con período, unidades, muestra y exclusiones. | A22, A28, A31 |
| RF12 | Administración | Consulta y estado de usuarios; CRUD del catálogo de ejercicios y recursos. | A23, A29, A32, A39 |

## Pantallas
Inicio; Acerca; Ayuda; Registro/login; Perfil; Carga/historial; Análisis; Objetivos; Plan; Sesiones; Panel admin; Usuarios admin; Ejercicios admin.

## Fuentes y prioridad documental
Base documental: Fase 1 actualizada de 45 páginas, **2227084-207-FASE1-PWEB-LAB.pdf** (adjunto actual, recibido el 8/9 de octubre de 2026); **Sprint-2-Adaptive-RL-Coach-2227084.pdf**, versión 3, de 20 páginas; **Tablas_Adaptive_RL_Coach.pdf**, borrador de ocho tablas. Se usa la Fase 1 actualizada para el comportamiento detallado. El prototipo Python/Tkinter del Sprint 2 sirve para contrastar reglas; la aplicación final es web. RL significa Rocket League.

Calendario oficial: [FIME agosto–diciembre 2026](https://www.fime.uanl.mx/wp-content/uploads/2026/07/calendario-agosto-diciembre2026.pdf). Últimas clases/laboratorios: 20 de noviembre; ordinarios: 23 de noviembre–3 de diciembre. La ventana 16–20 de noviembre es una estimación basada en entregar una semana antes de exámenes, **no una fecha confirmada por profesores**.

