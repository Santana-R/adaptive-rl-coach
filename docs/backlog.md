# Backlog de desarrollo

Estado inicial: pendiente. La publicación en GitHub aún no se ha realizado.

# S1 · Base y viabilidad

Resultado de S1: Contrato, esquema revisado, navegación y prueba real de Ballchasing.

Corte: 2026-10-18. Reparto provisional; ajustar carga con el equipo.

| ID | Responsable | Revisor | Prioridad | Fecha | Depende de |
| --- | --- | --- | --- | --- | --- |
| A01 | Roberto | Luis | P0 | 2026-10-14 | — |
| A02 | Roberto | David | P0 | 2026-10-18 | A01 |
| A03 | Tadeo | Roberto | P0 | 2026-10-14 | — |
| A04 | Tadeo | Luis | P1 | 2026-10-18 | A01, A03 |
| A05 | Luis | Roberto | P0 | 2026-10-14 | — |
| A06 | Luis | David | P0 | 2026-10-18 | A01, A05 |
| A07 | David | Roberto | P0 | 2026-10-14 | — |
| A08 | David | Luis | P0 | 2026-10-18 | A01, A07 |

## [A01](https://github.com/Santana-R/adaptive-rl-coach/issues/1) · Cerrar alcance y contrato API/datos
**Responsable:** Roberto Santana Trujillo. **Revisor:** Luis Enrique Almaguer Castillo. **RF:** RF01–RF12. **Entrega:** 2026-10-14.

- [ ] Mapear los doce RF y las trece pantallas a tareas y pruebas.
- [ ] Acordar payloads, unidades, null, errores, identidad, modalidad, tipo de partida y versionado; cada módulo tiene una interfaz definida.
- [ ] Confirmar horas disponibles y reparto con los cuatro; registrar cambios sin reducir los RF.

**Evidencia:** Matriz RF, contrato JSON y acta de reparto.

**Dependencias:** Ninguna.

## [A02](https://github.com/Santana-R/adaptive-rl-coach/issues/2) · Preparar casos del motor explicable
**Responsable:** Roberto Santana Trujillo. **Revisor:** David Alonso Torres Guerrero. **RF:** RF07, RF08, RF09. **Entrega:** 2026-10-18.

- [ ] Crear casos de primer bloque, comparación válida y no comparable, valores faltantes y empates.
- [ ] Documentar umbrales del prototipo como heurísticas pendientes de calibrar; definir máximo tres prioridades y evidencia por regla.

**Evidencia:** Fixtures sin datos personales y resultados esperados.

**Dependencias:** A01.

## [A03](https://github.com/Santana-R/adaptive-rl-coach/issues/3) · Convertir los bosquejos actuales en flujo de pantallas
**Responsable:** Omar Tadeo Gasca Deciga. **Revisor:** Roberto Santana Trujillo. **RF:** RF01–RF12. **Entrega:** 2026-10-14.

- [ ] Cubrir las trece pantallas de la Fase 1 actualizada, con navegación por rol.
- [ ] Diseñar estados de carga, error, sin historial, comparación no disponible y plan parcial o vacío.

**Evidencia:** Flujo y lista de estados vinculados a cada pantalla.

**Dependencias:** Ninguna.

## [A04](https://github.com/Santana-R/adaptive-rl-coach/issues/4) · Crear base visual y navegación
**Responsable:** Omar Tadeo Gasca Deciga. **Revisor:** Luis Enrique Almaguer Castillo. **RF:** RF01, RF02, RF12. **Entrega:** 2026-10-18.

- [ ] Preparar HTML, CSS, Bootstrap, JavaScript y jQuery con rutas o vistas coherentes.
- [ ] Inicio, Acerca y Ayuda explican el ciclo de cinco replays y las limitaciones; separar navegación de jugador y administrador.

**Evidencia:** PR y recorrido de navegación en escritorio.

**Dependencias:** A01, A03.

## [A05](https://github.com/Santana-R/adaptive-rl-coach/issues/5) · Validar Ballchasing con una prueba real
**Responsable:** Luis Enrique Almaguer Castillo. **Revisor:** Roberto Santana Trujillo. **RF:** RF03, RF04, RF05, RF06. **Entrega:** 2026-10-14.

- [ ] Comprobar con un replay autorizado la carga privada, consulta de procesamiento, respuesta de jugador y métricas disponibles.
- [ ] Documentar límites, permisos, duplicados, errores transitorios y estrategia de espera/reintento según la API vigente.
- [ ] Guardar token solo en servidor; no publicar archivos ni credenciales.

**Evidencia:** Spike reproducible, respuesta anonimizada y decisión de viabilidad.

**Dependencias:** Ninguna.

## [A06](https://github.com/Santana-R/adaptive-rl-coach/issues/6) · Preparar servidor y adaptador de ingestión
**Responsable:** Luis Enrique Almaguer Castillo. **Revisor:** David Alonso Torres Guerrero. **RF:** RF03, RF05. **Entrega:** 2026-10-18.

- [ ] Crear base Node.js LTS/Express y configuración de entorno con .env.example.
- [ ] Definir estados por replay y bloque; el adaptador permite datos de prueba claramente identificados mientras se conecta la API.

**Evidencia:** PR del servidor, contrato de estados y prueba básica de endpoints.

**Dependencias:** A01, A05.

## [A07](https://github.com/Santana-R/adaptive-rl-coach/issues/7) · Auditar el modelo de ocho tablas y completar diseño
**Responsable:** David Alonso Torres Guerrero. **Revisor:** Roberto Santana Trujillo. **RF:** RF01–RF12. **Entrega:** 2026-10-14.

- [ ] Revisar usuarios, bloques, replays, métricas, objetivos, ejercicios, planes y plan_ejercicio.
- [ ] Proponer sesiones, historial de rango declarado, evidencia de reglas y snapshots de objetivos/ejercicios para cada versión del plan.
- [ ] Definir propietarios, claves, integridad, índices y permisos; acordar cualquier cambio del ERD antes de implementarlo.

**Evidencia:** Diccionario y propuesta de migraciones; enlace al ERD actualizado existente.

**Dependencias:** Ninguna.

## [A08](https://github.com/Santana-R/adaptive-rl-coach/issues/8) · Preparar autenticación y permisos de datos
**Responsable:** David Alonso Torres Guerrero. **Revisor:** Luis Enrique Almaguer Castillo. **RF:** RF01, RF02, RF12. **Entrega:** 2026-10-18.

- [ ] Implementar registro por correo y Google, inicio y cierre de sesión con Supabase Auth.
- [ ] El registro público nunca asigna administrador; usuario A no lee ni cambia datos de B y suspensión impide acceso según el contrato.
- [ ] Definir validación del token en Express y política de propiedad por recurso.

**Evidencia:** PR y evidencia con dos jugadores y un administrador.

**Dependencias:** A01, A07.

# S2 · Primer bloque real

Resultado de S2: Jugador autenticado carga cinco replays privados y obtiene métricas válidas.

Corte: 2026-10-25. Reparto provisional; ajustar carga con el equipo.

| ID | Responsable | Revisor | Prioridad | Fecha | Depende de |
| --- | --- | --- | --- | --- | --- |
| A09 | Roberto | Luis | P0 | 2026-10-25 | A02, A05, A14 |
| A10 | Roberto | David | P0 | 2026-10-25 | A09, A15 |
| A11 | Tadeo | Luis | P0 | 2026-10-25 | A04, A13 |
| A12 | Tadeo | David | P1 | 2026-10-25 | A04, A08 |
| A13 | Luis | David | P0 | 2026-10-22 | A06, A08, A15 |
| A14 | Luis | Roberto | P0 | 2026-10-21 | A05, A06, A08 |
| A15 | David | Luis | P0 | 2026-10-21 | A07, A08 |
| A16 | David | Roberto | P1 | 2026-10-25 | A07, A08 |

## [A09](https://github.com/Santana-R/adaptive-rl-coach/issues/9) · Normalizar métricas de cinco replays
**Responsable:** Roberto Santana Trujillo. **Revisor:** Luis Enrique Almaguer Castillo. **RF:** RF06. **Entrega:** 2026-10-25.

- [ ] Extraer exclusivamente al jugador identificado en cada replay.
- [ ] Agregar con denominadores y unidades explícitos; porcentajes ponderados por totales, null para datos ausentes y exclusiones visibles.

**Evidencia:** Casos calculados a mano y resultados coincidentes.

**Dependencias:** A02, A05, A14.

## [A10](https://github.com/Santana-R/adaptive-rl-coach/issues/10) · Resolver línea base y comparación válida
**Responsable:** Roberto Santana Trujillo. **Revisor:** David Alonso Torres Guerrero. **RF:** RF07. **Entrega:** 2026-10-25.

- [ ] Primer bloque se marca como línea base.
- [ ] Comparar solo misma identidad, modalidad, tipo casual/ranked y medición equivalente; el seguimiento debe ser posterior.
- [ ] Bloques no comparables conservan motivo y no producen una mejora inventada.

**Evidencia:** Pruebas de cronología, incompatibilidad y comparación válida.

**Dependencias:** A09, A15.

## [A11](https://github.com/Santana-R/adaptive-rl-coach/issues/11) · Implementar carga e historial de bloques
**Responsable:** Omar Tadeo Gasca Deciga. **Revisor:** Luis Enrique Almaguer Castillo. **RF:** RF03, RF04, RF05. **Entrega:** 2026-10-25.

- [ ] Aceptar exactamente cinco archivos .replay desde PC y mostrar validaciones antes de enviar.
- [ ] Mostrar estado individual, duplicados, espera, fallos y reintentos; impedir doble envío accidental.
- [ ] Historial conserva IDs y permite ver el detalle de un bloque.

**Evidencia:** Demo de bloque correcto, inválido y procesamiento parcial.

**Dependencias:** A04, A13.

## [A12](https://github.com/Santana-R/adaptive-rl-coach/issues/12) · Conectar registro, login y perfil
**Responsable:** Omar Tadeo Gasca Deciga. **Revisor:** David Alonso Torres Guerrero. **RF:** RF01, RF02. **Entrega:** 2026-10-25.

- [ ] Conectar correo y Google y mensajes de error; Discord queda opcional.
- [ ] Guardar plataforma, modalidad e identidad Epic o Steam; impedir análisis sin perfil válido.

**Evidencia:** Demo de ambos métodos y edición persistente de perfil.

**Dependencias:** A04, A08.

## [A13](https://github.com/Santana-R/adaptive-rl-coach/issues/13) · Implementar carga privada y estados de procesamiento
**Responsable:** Luis Enrique Almaguer Castillo. **Revisor:** David Alonso Torres Guerrero. **RF:** RF03, RF04, RF05. **Entrega:** 2026-10-22.

- [ ] Recibir cinco replays autorizados, validar formato y duplicados, guardar IDs y consultar estados.
- [ ] Reintentar fallos transitorios sin duplicar registros; conservar bloque pendiente o fallido hasta resolverlo.
- [ ] Limpiar solo cargas propias y temporales; nunca borrar el duplicado externo de otro usuario.

**Evidencia:** Pruebas del adaptador con errores y un bloque real.

**Dependencias:** A06, A08, A15.

## [A14](https://github.com/Santana-R/adaptive-rl-coach/issues/14) · Validar identidad y compatibilidad del bloque
**Responsable:** Luis Enrique Almaguer Castillo. **Revisor:** Roberto Santana Trujillo. **RF:** RF04, RF06. **Entrega:** 2026-10-21.

- [ ] Encontrar al jugador del perfil en los cinco replays.
- [ ] Rechazar o señalar modalidad/tipo/identidad incompatibles sin mezclar mediciones.
- [ ] Entregar al motor datos normalizados con trazabilidad al replay.

**Evidencia:** Payload anonimizado de cinco partidas y casos incompatibles.

**Dependencias:** A05, A06, A08.

## [A15](https://github.com/Santana-R/adaptive-rl-coach/issues/15) · Persistir perfil, bloques, replays y métricas
**Responsable:** David Alonso Torres Guerrero. **Revisor:** Luis Enrique Almaguer Castillo. **RF:** RF02, RF05, RF06. **Entrega:** 2026-10-21.

- [ ] Crear migraciones acordadas y relaciones de propiedad.
- [ ] Persistir estados y métricas sin duplicar cargas; null sigue siendo null.
- [ ] Exportar datos de ejemplo sin información privada para el desarrollo de los demás.

**Evidencia:** Migración, seed de prueba y consultas de integridad.

**Dependencias:** A07, A08.

## [A16](https://github.com/Santana-R/adaptive-rl-coach/issues/16) · Implementar objetivos con historial
**Responsable:** David Alonso Torres Guerrero. **Revisor:** Roberto Santana Trujillo. **RF:** RF10. **Entrega:** 2026-10-25.

- [ ] Crear, consultar y editar objetivos por modalidad, con meta principal de rendimiento y meta opcional de entrenamiento.
- [ ] Archivar metas vinculadas a planes/historial en lugar de destruirlas; conservar versión cuando cambien.
- [ ] Objetivos no alteran métricas ni diagnóstico para forzar una recomendación.

**Evidencia:** Endpoints y casos de edición, archivo y propiedad.

**Dependencias:** A07, A08.

# S3 · Diagnóstico y plan

Resultado de S3: Diagnóstico explicable, plan versionado, objetivos y registro de sesiones.

Corte: 2026-11-01. Reparto provisional; ajustar carga con el equipo.

| ID | Responsable | Revisor | Prioridad | Fecha | Depende de |
| --- | --- | --- | --- | --- | --- |
| A17 | Roberto | Luis | P0 | 2026-10-28 | A02, A09, A10 |
| A18 | Roberto | David | P0 | 2026-11-01 | A16, A17, A23, A24 |
| A19 | Tadeo | Roberto | P1 | 2026-11-01 | A10, A11, A17 |
| A20 | Tadeo | David | P1 | 2026-11-01 | A12, A16 |
| A21 | Luis | David | P0 | 2026-11-01 | A08, A24 |
| A22 | Luis | Roberto | P1 | 2026-11-01 | A10, A16, A21 |
| A23 | David | Roberto | P0 | 2026-10-28 | A07, A08 |
| A24 | David | Luis | P0 | 2026-10-28 | A07, A15, A16 |

## [A17](https://github.com/Santana-R/adaptive-rl-coach/issues/17) · Implementar reglas con máximo tres prioridades
**Responsable:** Roberto Santana Trujillo. **Revisor:** Luis Enrique Almaguer Castillo. **RF:** RF08. **Entrega:** 2026-10-28.

- [ ] Generar como máximo tres prioridades ordenadas de forma determinista.
- [ ] Cada prioridad conserva regla, evidencia, unidades y contexto; datos insuficientes producen explicación.
- [ ] Verificar salida del motor web frente a los casos del prototipo.

**Evidencia:** Pruebas de reglas, empates, null y ausencia de prioridades.

**Dependencias:** A02, A09, A10.

## [A18](https://github.com/Santana-R/adaptive-rl-coach/issues/18) · Generar planes compatibles y versionados
**Responsable:** Roberto Santana Trujillo. **Revisor:** David Alonso Torres Guerrero. **RF:** RF09. **Entrega:** 2026-11-01.

- [ ] Seleccionar ejercicios activos según prioridades, metas, plataforma, disponibilidad y sesiones.
- [ ] Incluir instrucciones, duración, dificultad y recurso; validar que el tiempo cabe en la disponibilidad.
- [ ] Sin cobertura total, declarar plan parcial o vacío y motivo; Actualizar plan crea otra versión.

**Evidencia:** Casos con catálogo suficiente, parcial y vacío.

**Dependencias:** A16, A17, A23, A24.

## [A19](https://github.com/Santana-R/adaptive-rl-coach/issues/19) · Construir análisis con evidencia
**Responsable:** Omar Tadeo Gasca Deciga. **Revisor:** Roberto Santana Trujillo. **RF:** RF06, RF07, RF08. **Entrega:** 2026-11-01.

- [ ] Mostrar métricas por replay/bloque, línea base o comparación y hasta tres prioridades.
- [ ] Chart.js presenta unidades y faltantes; motivos de incompatibilidad son visibles.

**Evidencia:** Demo contra fixtures con números comprobados.

**Dependencias:** A10, A11, A17.

## [A20](https://github.com/Santana-R/adaptive-rl-coach/issues/20) · Construir gestión de objetivos
**Responsable:** Omar Tadeo Gasca Deciga. **Revisor:** David Alonso Torres Guerrero. **RF:** RF10. **Entrega:** 2026-11-01.

- [ ] Crear, consultar, editar y archivar metas por modalidad.
- [ ] Distinguir meta de rendimiento y entrenamiento y explicar su relación con planes e historial.

**Evidencia:** Recorrido de todos los estados de objetivos.

**Dependencias:** A12, A16.

## [A21](https://github.com/Santana-R/adaptive-rl-coach/issues/21) · Implementar CRUD de sesiones ligadas al plan
**Responsable:** Luis Enrique Almaguer Castillo. **Revisor:** David Alonso Torres Guerrero. **RF:** RF10. **Entrega:** 2026-11-01.

- [ ] Crear, consultar, corregir y eliminar sesiones propias ligadas a la versión exacta del plan.
- [ ] Validar fecha, ejercicio y duración; la actividad es autorreportada.
- [ ] Corrección o eliminación deja progresos coherentes y nunca prueba por sí sola mejora en partidas.

**Evidencia:** Casos CRUD y recálculo con dos versiones de plan.

**Dependencias:** A08, A24.

## [A22](https://github.com/Santana-R/adaptive-rl-coach/issues/22) · Calcular progreso y contrato de reportes
**Responsable:** Luis Enrique Almaguer Castillo. **Revisor:** Roberto Santana Trujillo. **RF:** RF10, RF11. **Entrega:** 2026-11-01.

- [ ] Separar progreso de entrenamiento, metas de rendimiento y cambios de métricas.
- [ ] Incluir período, conteos, denominador, unidades, exclusiones y fuente de cada dato; rango se identifica como declarado.

**Evidencia:** Respuestas de reporte verificadas con fixtures.

**Dependencias:** A10, A16, A21.

## [A23](https://github.com/Santana-R/adaptive-rl-coach/issues/23) · Implementar catálogo CRUD y semilla validada
**Responsable:** David Alonso Torres Guerrero. **Revisor:** Roberto Santana Trujillo. **RF:** RF09, RF12. **Entrega:** 2026-10-28.

- [ ] Administrador crea, consulta, edita y desactiva ejercicios y recursos.
- [ ] Validar modalidad/plataforma, duración, dificultad e instrucciones; seed revisado habilita ejercicios explícitamente.
- [ ] Jugador no administra catálogo; ejercicios desactivados no entran en planes nuevos.

**Evidencia:** Endpoints y seed suficiente para cubrir prioridades del MVP.

**Dependencias:** A07, A08.

## [A24](https://github.com/Santana-R/adaptive-rl-coach/issues/24) · Persistir versiones y snapshots del plan
**Responsable:** David Alonso Torres Guerrero. **Revisor:** Luis Enrique Almaguer Castillo. **RF:** RF09, RF10. **Entrega:** 2026-10-28.

- [ ] Conservar metas, perfil, ejercicios, evidencia y reglas aplicadas en cada versión.
- [ ] Cambiar perfil/meta/catálogo no reescribe versiones anteriores; actualizar crea otra.
- [ ] Sesiones y plan_ejercicio referencian la versión correcta.

**Evidencia:** Migraciones y comparación antes/después de una actualización.

**Dependencias:** A07, A15, A16.

# S4 · Integración completa

Resultado de S4: RF01–RF12 conectados, administración y segundo bloque comparable.

Corte: 2026-11-06. Reparto provisional; ajustar carga con el equipo.

| ID | Responsable | Revisor | Prioridad | Fecha | Depende de |
| --- | --- | --- | --- | --- | --- |
| A25 | Roberto | Luis | P0 | 2026-11-06 | A18, A19, A21, A22, A24 |
| A26 | Roberto | David | P1 | 2026-11-06 | A17, A18 |
| A27 | Tadeo | David | P0 | 2026-11-06 | A18, A20, A21, A24 |
| A28 | Tadeo | Luis | P1 | 2026-11-06 | A19, A22, A31 |
| A29 | Luis | David | P0 | 2026-11-04 | A08 |
| A30 | Luis | Roberto | P0 | 2026-11-06 | A13, A14 |
| A31 | David | Roberto | P1 | 2026-11-04 | A16, A22, A24 |
| A32 | David | Tadeo | P0 | 2026-11-06 | A04, A23, A29 |

## [A25](https://github.com/Santana-R/adaptive-rl-coach/issues/25) · Integrar el ciclo adaptativo completo
**Responsable:** Roberto Santana Trujillo. **Revisor:** Luis Enrique Almaguer Castillo. **RF:** RF01–RF12. **Entrega:** 2026-11-06.

- [ ] Completar login → perfil → bloque A → análisis → meta → plan → sesión → bloque B comparable.
- [ ] Demostrar reevaluación con evidencia; metas o sesiones no inventan cambio de desempeño.
- [ ] Abrir incidencias de integración y cerrarlas antes del corte del viernes.

**Evidencia:** Demo integrada con dos bloques y PRs revisados.

**Dependencias:** A18, A19, A21, A22, A24.

## [A26](https://github.com/Santana-R/adaptive-rl-coach/issues/26) · Calibrar heurísticas y documentar límites
**Responsable:** Roberto Santana Trujillo. **Revisor:** David Alonso Torres Guerrero. **RF:** RF07, RF08, RF09. **Entrega:** 2026-11-06.

- [ ] Contrastar umbrales con casos manuales y contextos de modalidad.
- [ ] Conservar reglas y evidencia reproducibles; describir incertidumbre y límites sin afirmar causalidad.

**Evidencia:** Tabla de casos y versión de reglas usada.

**Dependencias:** A17, A18.

## [A27](https://github.com/Santana-R/adaptive-rl-coach/issues/27) · Conectar plan y sesiones en la interfaz
**Responsable:** Omar Tadeo Gasca Deciga. **Revisor:** David Alonso Torres Guerrero. **RF:** RF09, RF10. **Entrega:** 2026-11-06.

- [ ] Mostrar versión, recursos, duración y estados de cobertura.
- [ ] Actualizar plan crea versión y permite consultar anteriores; sesiones se registran/corrigen/eliminan sobre su versión.

**Evidencia:** Recorrido integrado y prueba de conservación de historial.

**Dependencias:** A18, A20, A21, A24.

## [A28](https://github.com/Santana-R/adaptive-rl-coach/issues/28) · Construir reportes y cerrar estados de pantallas
**Responsable:** Omar Tadeo Gasca Deciga. **Revisor:** Luis Enrique Almaguer Castillo. **RF:** RF11. **Entrega:** 2026-11-06.

- [ ] Separar gráficas de métricas, objetivos y rango declarado.
- [ ] Mostrar períodos, unidades, muestras y exclusiones; no dibujar null como cero.
- [ ] Completar todas las trece pantallas y navegación del ciclo del jugador.

**Evidencia:** Demo de reportes con casos de ausencia de datos.

**Dependencias:** A19, A22, A31.

## [A29](https://github.com/Santana-R/adaptive-rl-coach/issues/29) · Implementar administración de usuarios
**Responsable:** Luis Enrique Almaguer Castillo. **Revisor:** David Alonso Torres Guerrero. **RF:** RF12. **Entrega:** 2026-11-04.

- [ ] Administrador consulta usuarios y cambia activo/suspendido.
- [ ] Validar rol en servidor y acceso de usuarios suspendidos; no habilitar alta pública de administradores.

**Evidencia:** Pruebas de rol, suspensión y reactivación.

**Dependencias:** A08.

## [A30](https://github.com/Santana-R/adaptive-rl-coach/issues/30) · Cerrar errores de API, privacidad y reintentos
**Responsable:** Luis Enrique Almaguer Castillo. **Revisor:** Roberto Santana Trujillo. **RF:** RF04, RF05. **Entrega:** 2026-11-06.

- [ ] Probar espera prolongada, duplicados, caída temporal y carga parcial sin perder estados.
- [ ] Verificar cargas privadas y limpieza solo de archivos propios; documentar cómo retomar un bloque.

**Evidencia:** Matriz de fallos y evidencia del manejo.

**Dependencias:** A13, A14.

## [A31](https://github.com/Santana-R/adaptive-rl-coach/issues/31) · Cerrar historial de objetivos y rango declarado
**Responsable:** David Alonso Torres Guerrero. **Revisor:** Roberto Santana Trujillo. **RF:** RF10, RF11. **Entrega:** 2026-11-04.

- [ ] Registrar rango manual con fecha/modalidad y mostrar su fuente.
- [ ] Conservar historial ante corrección de metas/sesiones y actualización del catálogo.
- [ ] Verificar coherencia de plan, metas y reportes con las nuevas relaciones.

**Evidencia:** Casos de integridad y reporte antes/después.

**Dependencias:** A16, A22, A24.

## [A32](https://github.com/Santana-R/adaptive-rl-coach/issues/32) · Conectar panel admin y CRUD del catálogo
**Responsable:** David Alonso Torres Guerrero. **Revisor:** Omar Tadeo Gasca Deciga. **RF:** RF12. **Entrega:** 2026-11-06.

- [ ] Construir panel, usuarios y ejercicios con mensajes de éxito/error.
- [ ] CRUD de ejercicios y cambio de estado de usuarios funcionan con autorización del servidor.

**Evidencia:** Demo de las tres pantallas administrativas.

**Dependencias:** A04, A23, A29.

# S5 · Entrega preparada

Resultado de S5: Pruebas cerradas, despliegue reproducible, documentos y ensayo de demostración.

Corte: 2026-11-13. Reparto provisional; ajustar carga con el equipo.

| ID | Responsable | Revisor | Prioridad | Fecha | Depende de |
| --- | --- | --- | --- | --- | --- |
| A33 | Roberto | Luis | P0 | 2026-11-13 | A25, A26 |
| A34 | Roberto | David | P1 | 2026-11-13 | A25, A26 |
| A35 | Tadeo | David | P1 | 2026-11-13 | A27, A28, A32 |
| A36 | Tadeo | Roberto | P1 | 2026-11-13 | A25, A35 |
| A37 | Luis | David | P0 | 2026-11-13 | A29, A30, A32 |
| A38 | Luis | Roberto | P0 | 2026-11-13 | A25, A37 |
| A39 | David | Luis | P0 | 2026-11-13 | A27, A31, A32 |
| A40 | David | Tadeo | P0 | 2026-11-13 | A33, A35, A38, A39 |

## [A33](https://github.com/Santana-R/adaptive-rl-coach/issues/33) · Cerrar regresión de métricas, reglas y planes
**Responsable:** Roberto Santana Trujillo. **Revisor:** Luis Enrique Almaguer Castillo. **RF:** RF06, RF07, RF08, RF09. **Entrega:** 2026-11-13.

- [ ] Ejecutar casos de línea base, ponderación, comparación incompatible, null y plan parcial.
- [ ] Cero fallos abiertos que impidan el ciclo obligatorio; adjuntar resultados al commit de entrega.

**Evidencia:** Informe de pruebas y commit final.

**Dependencias:** A25, A26.

## [A34](https://github.com/Santana-R/adaptive-rl-coach/issues/34) · Preparar evidencia técnica para PROGSA
**Responsable:** Roberto Santana Trujillo. **Revisor:** David Alonso Torres Guerrero. **RF:** RF07, RF08, RF09. **Entrega:** 2026-11-13.

- [ ] Documentar problema, decisiones, System Map, reglas, adaptación y limitaciones.
- [ ] Separar lo demostrado por el prototipo de lo implementado en la web; validar formato con las instrucciones de PROGSA cuando se confirmen.

**Evidencia:** Documento técnico, ejemplos y referencias de evidencia.

**Dependencias:** A25, A26.

## [A35](https://github.com/Santana-R/adaptive-rl-coach/issues/35) · Revisar uso, mensajes y accesibilidad
**Responsable:** Omar Tadeo Gasca Deciga. **Revisor:** David Alonso Torres Guerrero. **RF:** RF01–RF12. **Entrega:** 2026-11-13.

- [ ] Revisar etiquetas, teclado, contraste, foco, errores y visualización en escritorio.
- [ ] Probar recorridos jugador/admin y ayuda con otra persona del equipo; cerrar bloqueos de uso.

**Evidencia:** Lista de revisión y capturas finales.

**Dependencias:** A27, A28, A32.

## [A36](https://github.com/Santana-R/adaptive-rl-coach/issues/36) · Preparar demo, capturas y ensayo
**Responsable:** Omar Tadeo Gasca Deciga. **Revisor:** Roberto Santana Trujillo. **RF:** RF01–RF12. **Entrega:** 2026-11-13.

- [ ] Crear guion de demostración de ocho a diez minutos ajustable a la rúbrica.
- [ ] Cada integrante explica su módulo; preparar datos de respaldo marcados como demostración si la API no está disponible.

**Evidencia:** Guion, capturas y ensayo cronometrado.

**Dependencias:** A25, A35.

## [A37](https://github.com/Santana-R/adaptive-rl-coach/issues/37) · Verificar seguridad y privacidad funcional
**Responsable:** Luis Enrique Almaguer Castillo. **Revisor:** David Alonso Torres Guerrero. **RF:** RF01, RF02, RF05, RF12. **Entrega:** 2026-11-13.

- [ ] Comprobar acceso directo a endpoints con jugador A/B/admin/suspendido y sin token.
- [ ] Validar entradas, archivos y errores; credenciales solo en entorno del servidor y logs sin datos privados.

**Evidencia:** Matriz de autorización y comprobación de secretos.

**Dependencias:** A29, A30, A32.

## [A38](https://github.com/Santana-R/adaptive-rl-coach/issues/38) · Preparar ejecución y despliegue reproducibles
**Responsable:** Luis Enrique Almaguer Castillo. **Revisor:** Roberto Santana Trujillo. **RF:** RF01–RF12. **Entrega:** 2026-11-13.

- [ ] Otra persona ejecuta el proyecto desde cero con README, migraciones y .env.example.
- [ ] Configurar entorno de entrega elegido por el equipo, validar OAuth y conexiones reales; conservar ruta de respaldo local.
- [ ] Crear tag de entrega solo después de comprobar la versión final.

**Evidencia:** URL o ejecución documentada, smoke test y tag.

**Dependencias:** A25, A37.

## [A39](https://github.com/Santana-R/adaptive-rl-coach/issues/39) · Auditar los tres CRUD y la integridad
**Responsable:** David Alonso Torres Guerrero. **Revisor:** Luis Enrique Almaguer Castillo. **RF:** RF09, RF10, RF12. **Entrega:** 2026-11-13.

- [ ] Ejecutar altas, consultas, cambios, archivo/eliminación permitida en objetivos, sesiones y ejercicios.
- [ ] Comprobar propietarios, relaciones y conservación de snapshots; preparar seed limpio de demo.

**Evidencia:** Matriz CRUD y consultas de integridad.

**Dependencias:** A27, A31, A32.

## [A40](https://github.com/Santana-R/adaptive-rl-coach/issues/40) · Preparar entrega LBPWEB y checklist común
**Responsable:** David Alonso Torres Guerrero. **Revisor:** Omar Tadeo Gasca Deciga. **RF:** RF01–RF12. **Entrega:** 2026-11-13.

- [ ] Vincular cada RF a pantalla, endpoint, datos, tarea y evidencia.
- [ ] Reunir instalación, ERD vigente, capturas y documentación requerida; confirmar fecha y rúbrica de ambas materias.
- [ ] Cerrar checklist en conjunto el viernes 13 y guardar una copia estable.

**Evidencia:** Paquete de entrega y checklist firmado por los cuatro.

**Dependencias:** A33, A35, A38, A39.

# S6 · Reserva de entrega

Resultado de S6: Correcciones puntuales y entrega en la fecha que confirmen los profesores.

Corte: 2026-11-20. Reparto provisional; ajustar carga con el equipo. Estas cuatro tareas son condicionales y no agregan funciones nuevas.

| ID | Responsable | Revisor | Prioridad | Fecha | Depende de |
| --- | --- | --- | --- | --- | --- |
| B01 | Roberto | Luis | P1 | 2026-11-20 | A33 |
| B02 | Tadeo | David | P1 | 2026-11-20 | A36 |
| B03 | Luis | Roberto | P1 | 2026-11-20 | A38 |
| B04 | David | Tadeo | P1 | 2026-11-20 | A40 |

## [B01](https://github.com/Santana-R/adaptive-rl-coach/issues/41) · Corregir defectos de motor si aparecen
**Responsable:** Roberto Santana Trujillo. **Revisor:** Luis Enrique Almaguer Castillo. **RF:** RF07, RF08, RF09. **Entrega:** 2026-11-20.

- [ ] Atender solo defectos de la versión de entrega; repetir los casos afectados.

**Evidencia:** Issue y prueba del arreglo.

**Dependencias:** A33.

## [B02](https://github.com/Santana-R/adaptive-rl-coach/issues/42) · Ajustar presentación y experiencia si se solicita
**Responsable:** Omar Tadeo Gasca Deciga. **Revisor:** David Alonso Torres Guerrero. **RF:** RF01–RF12. **Entrega:** 2026-11-20.

- [ ] Aplicar correcciones del ensayo o profesor sin ampliar el alcance.

**Evidencia:** Capturas o guion actualizado.

**Dependencias:** A36.

## [B03](https://github.com/Santana-R/adaptive-rl-coach/issues/43) · Verificar entorno antes de entregar
**Responsable:** Luis Enrique Almaguer Castillo. **Revisor:** Roberto Santana Trujillo. **RF:** RF01–RF12. **Entrega:** 2026-11-20.

- [ ] Repetir recorrido principal y respaldo local en la fecha confirmada.

**Evidencia:** Smoke test de la versión de entrega.

**Dependencias:** A38.

## [B04](https://github.com/Santana-R/adaptive-rl-coach/issues/44) · Revisar paquete y confirmar recepción
**Responsable:** David Alonso Torres Guerrero. **Revisor:** Omar Tadeo Gasca Deciga. **RF:** RF01–RF12. **Entrega:** 2026-11-20.

- [ ] Comprobar nombres, evidencias y formatos por materia; registrar la fecha real de entrega.

**Evidencia:** Checklist y comprobante de entrega cuando exista.

**Dependencias:** A40.