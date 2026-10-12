# Backlog de desarrollo · revisión del 12 de octubre

44 tareas existentes: 40 de desarrollo y 4 contingencias. Consultar el estado operativo en GitHub; esta revisión cambia instrucciones y reparto, no acredita implementación.

# S1 · Base y viabilidad

Resultado de S1: Contrato, esquema revisado, navegación y prueba real de Ballchasing.

Corte interno: 2026-10-18. Reparto actualizado; confirmar disponibilidad en A01.

| Tarea | Responsable | Revisor | Fecha | Dependencias |
| --- | --- | --- | --- | --- |
| [A01](https://github.com/Santana-R/adaptive-rl-coach/issues/1) | Roberto | Tadeo | 2026-10-14 | — |
| [A02](https://github.com/Santana-R/adaptive-rl-coach/issues/2) | Roberto | David | 2026-10-18 | A01 |
| [A03](https://github.com/Santana-R/adaptive-rl-coach/issues/3) | Luis | Roberto | 2026-10-14 | — |
| [A04](https://github.com/Santana-R/adaptive-rl-coach/issues/4) | Luis | Tadeo | 2026-10-18 | A01, A03 |
| [A05](https://github.com/Santana-R/adaptive-rl-coach/issues/5) | Tadeo | Roberto | 2026-10-14 | — |
| [A06](https://github.com/Santana-R/adaptive-rl-coach/issues/6) | Tadeo | David | 2026-10-18 | A01, A05 |
| [A07](https://github.com/Santana-R/adaptive-rl-coach/issues/7) | David | Roberto | 2026-10-14 | — |
| [A08](https://github.com/Santana-R/adaptive-rl-coach/issues/8) | David | Tadeo | 2026-10-18 | A01, A07 |

El avance y las casillas operativas se registran en cada issue de GitHub. Esta página es la guía de referencia.

## A01 · Cerrar alcance y contrato API/datos

**Responsable:** Roberto Santana Trujillo · **Revisor:** Omar Tadeo Gasca Deciga

**Semana:** S1 · **Entrega interna:** 2026-10-14 · **Prioridad:** P0

**Requisitos:** RF01–RF12 · **Depende de:** Ninguna

### Objetivo
Dejar acuerdos que permitan que los cuatro construyan piezas compatibles.

### Antes de empezar
Fase 1 actualizada, matriz RF01–RF12, trece pantallas y este reparto.

### Pasos sugeridos
1. Confirmar por escrito disponibilidad y aceptación de módulos; registrar ajustes.
2. Completar una fila por RF: pantalla, tarea, dato necesario y prueba.
3. Acordar ejemplos de solicitudes/respuestas, unidades, datos ausentes y errores con quienes consumen cada módulo.

### Entrega concreta
docs/contratos-api.md, planning/trazabilidad-rf.csv y un acuerdo breve del equipo.

Las rutas de archivos son propuestas para organizar la implementación; todavía deben crearse al realizar la tarea.

### Ejemplo de referencia
RF07 → pantalla Análisis → A10/A19 → dos bloques comparables → mostrar cambio y motivo si no se puede comparar.

### Se acepta cuando
- [ ] Mapear los doce RF y las trece pantallas a tareas y pruebas.
- [ ] Acordar payloads, unidades, null, errores, identidad, modalidad, tipo de partida y versionado; cada módulo tiene una interfaz definida.
- [ ] Confirmar horas disponibles y reparto con los cuatro; registrar cambios sin reducir los RF.

### Evidencia para revisar
Matriz RF, contrato JSON y acta de reparto.

### Qué practicarás
Leer requisitos, definir interfaces y coordinar sin depender de reuniones presenciales.

**Cierre:** enlazar entrega/PR y comprobación; el revisor explica qué ejecutó y qué observó. Para código: integrado a main tras revisión. Para documentación: versión guardada y revisada. GitHub conserva el estado real; la planificación no marca esta tarea como realizada. Reparto actualizado con el Release del 12 de octubre; disponibilidad individual pendiente de confirmar.

## A02 · Preparar casos del motor explicable

**Responsable:** Roberto Santana Trujillo · **Revisor:** David Alonso Torres Guerrero

**Semana:** S1 · **Entrega interna:** 2026-10-18 · **Prioridad:** P0

**Requisitos:** RF07, RF08, RF09 · **Depende de:** [A01](https://github.com/Santana-R/adaptive-rl-coach/issues/1)

### Objetivo
Definir datos de prueba y respuestas esperadas antes de programar las reglas.

### Antes de empezar
Contrato de A01, reglas del prototipo y comportamiento de RF07–RF09.

### Pasos sugeridos
1. Preparar al menos los cinco casos descritos en la guía: primer bloque, comparable, incompatible, faltantes y empate.
2. Escribir entrada y salida esperada para cada caso; calcular a mano los ejemplos numéricos.
3. Anotar qué regla usa cada umbral del prototipo, su unidad y su límite; acordar un desempate reproducible.

### Entrega concreta
tests/fixtures/analisis/*.json y docs/casos-motor.md con entradas y resultados esperados.

Las rutas de archivos son propuestas para organizar la implementación; todavía deben crearse al realizar la tarea.

### Ejemplo de referencia
Mismo jugador, modalidad y tipo; bloque A: 8 tiros/2 goles; B: 10 tiros/3 goles. Porcentaje: 25% → 30%; cambio +5 puntos porcentuales. Son datos inventados para una prueba.

| Caso | Entrada preparada | Resultado esperado |
| --- | --- | --- |
| Primer bloque | Un bloque válido sin historial | Línea base; comparación no disponible con motivo. |
| Comparable | A y B posteriores, mismo jugador/contexto/medición | Diferencias con unidades; 25% → 30% son +5 puntos porcentuales. |
| Incompatible | Distinta identidad, modalidad, tipo o medición | No comparar; conservar motivo. |
| Faltantes | Una métrica null | Indicar ausencia; no convertirla en cero ni activar su regla. |
| Empate | Dos reglas con igual prioridad | Orden reproducible acordado; hasta tres prioridades con evidencia. |

Ejemplo **inventado para pruebas**, no respuesta real de Ballchasing ni diagnóstico calibrado:
```json
{
  "case_id": "comparacion-valida",
  "input": {
    "baseline": {
      "shots": 8,
      "goals": 2
    },
    "current": {
      "shots": 10,
      "goals": 3
    },
    "same_player": true,
    "same_context": true,
    "chronology_valid": true
  },
  "expected": {
    "comparable": true,
    "baseline_shooting_pct": 25,
    "current_shooting_pct": 30,
    "delta_pp": 5
  }
}
```

### Se acepta cuando
- [ ] Crear casos de primer bloque, comparación válida y no comparable, valores faltantes y empates.
- [ ] Documentar umbrales del prototipo como heurísticas pendientes de calibrar; definir máximo tres prioridades y evidencia por regla.

### Evidencia para revisar
Fixtures sin datos personales y resultados esperados.

### Qué practicarás
Traducir una regla a un caso verificable; distinguir datos de prueba y datos reales.

**Cierre:** enlazar entrega/PR y comprobación; el revisor explica qué ejecutó y qué observó. Para código: integrado a main tras revisión. Para documentación: versión guardada y revisada. GitHub conserva el estado real; la planificación no marca esta tarea como realizada. Reparto actualizado con el Release del 12 de octubre; disponibilidad individual pendiente de confirmar.

## A03 · Convertir los bosquejos actuales en flujo de pantallas

**Responsable:** Luis Enrique Almaguer Castillo · **Revisor:** Roberto Santana Trujillo

**Semana:** S1 · **Entrega interna:** 2026-10-14 · **Prioridad:** P0

**Requisitos:** RF01–RF12 · **Depende de:** Ninguna

### Objetivo
Convertir los bosquejos de la Fase 1 en un recorrido navegable para jugador y administrador.

### Antes de empezar
Trece pantallas de Fase 1 y requisitos de cada rol.

### Pasos sugeridos
1. Listar cada pantalla y los enlaces de entrada/salida.
2. Dibujar el recorrido de jugador y administrador con los controles permitidos.
3. Para cada pantalla, anotar carga, éxito, error y ausencia de datos; compartir el flujo antes de implementar.

### Entrega concreta
docs/flujo-pantallas.md y un diagrama o capturas de los bosquejos.

Las rutas de archivos son propuestas para organizar la implementación; todavía deben crearse al realizar la tarea.

### Ejemplo de referencia
Carga → procesando → análisis; si falla un replay, mostrar cuál falló y la acción disponible.

### Se acepta cuando
- [ ] Cubrir las trece pantallas de la Fase 1 actualizada, con navegación por rol.
- [ ] Diseñar estados de carga, error, sin historial, comparación no disponible y plan parcial o vacío.

### Evidencia para revisar
Flujo y lista de estados vinculados a cada pantalla.

### Qué practicarás
Luis: conectar diseño de navegación con estados reales del sistema.

**Cierre:** enlazar entrega/PR y comprobación; el revisor explica qué ejecutó y qué observó. Para código: integrado a main tras revisión. Para documentación: versión guardada y revisada. GitHub conserva el estado real; la planificación no marca esta tarea como realizada. Reparto actualizado con el Release del 12 de octubre; disponibilidad individual pendiente de confirmar.

## A04 · Crear base visual y navegación

**Responsable:** Luis Enrique Almaguer Castillo · **Revisor:** Omar Tadeo Gasca Deciga

**Semana:** S1 · **Entrega interna:** 2026-10-18 · **Prioridad:** P1

**Requisitos:** RF01, RF02, RF12 · **Depende de:** [A01](https://github.com/Santana-R/adaptive-rl-coach/issues/1), [A03](https://github.com/Santana-R/adaptive-rl-coach/issues/3)

### Objetivo
Crear la base de interfaz sobre la que se conectarán las funciones posteriores.

### Antes de empezar
Flujo de A03 y contrato de A01.

### Pasos sugeridos
1. Preparar HTML/CSS/Bootstrap y JavaScript/jQuery con una estructura común.
2. Crear navegación y las páginas Inicio, Acerca y Ayuda, además de contenedores para las demás vistas.
3. Separar menús por rol y comprobar enlaces, foco y mensajes en escritorio.

### Entrega concreta
PR con base visual y recorrido reproducible; actualizar instrucciones de ejecución cuando existan.

Las rutas de archivos son propuestas para organizar la implementación; todavía deben crearse al realizar la tarea.

### Ejemplo de referencia
Un jugador puede llegar a Carga desde su menú; no se le presenta el menú de administración.

### Se acepta cuando
- [ ] Preparar HTML, CSS, Bootstrap, JavaScript y jQuery con rutas o vistas coherentes.
- [ ] Inicio, Acerca y Ayuda explican el ciclo de cinco replays y las limitaciones; separar navegación de jugador y administrador.

### Evidencia para revisar
PR y recorrido de navegación en escritorio.

### Qué practicarás
Luis: estructura frontend, eventos y componentes reutilizables.

**Cierre:** enlazar entrega/PR y comprobación; el revisor explica qué ejecutó y qué observó. Para código: integrado a main tras revisión. Para documentación: versión guardada y revisada. GitHub conserva el estado real; la planificación no marca esta tarea como realizada. Reparto actualizado con el Release del 12 de octubre; disponibilidad individual pendiente de confirmar.

## A05 · Validar Ballchasing con una prueba real

**Responsable:** Omar Tadeo Gasca Deciga · **Revisor:** Roberto Santana Trujillo

**Semana:** S1 · **Entrega interna:** 2026-10-14 · **Prioridad:** P0

**Requisitos:** RF03, RF04, RF05, RF06 · **Depende de:** Ninguna

### Objetivo
Comprobar que Ballchasing permite obtener los datos necesarios con un replay real autorizado.

### Antes de empezar
Cuenta/token válido, replay autorizado y documentación oficial vigente de Ballchasing.

### Pasos sugeridos
1. Consultar permisos y límites actuales; hacer una carga privada de prueba desde el servidor.
2. Consultar procesamiento e identificar al jugador y las métricas devueltas.
3. Registrar respuesta anonimizada, errores y estrategia de reintento; comunicar brechas de viabilidad.

### Entrega concreta
scripts/spike-ballchasing.* y docs/viabilidad-ballchasing.md, sin tokens ni replays publicados.

Las rutas de archivos son propuestas para organizar la implementación; todavía deben crearse al realizar la tarea.

### Ejemplo de referencia
Guardar un ejemplo anonimizado de estado pendiente y otro listo, indicando el campo que identifica al jugador.

### Se acepta cuando
- [ ] Comprobar con un replay autorizado la carga privada, consulta de procesamiento, respuesta de jugador y métricas disponibles.
- [ ] Documentar límites, permisos, duplicados, errores transitorios y estrategia de espera/reintento según la API vigente.
- [ ] Guardar token solo en servidor; no publicar archivos ni credenciales.

### Evidencia para revisar
Spike reproducible, respuesta anonimizada y decisión de viabilidad.

### Qué practicarás
Tadeo: explorar una API externa y validar supuestos antes de construir.

**Cierre:** enlazar entrega/PR y comprobación; el revisor explica qué ejecutó y qué observó. Para código: integrado a main tras revisión. Para documentación: versión guardada y revisada. GitHub conserva el estado real; la planificación no marca esta tarea como realizada. Reparto actualizado con el Release del 12 de octubre; disponibilidad individual pendiente de confirmar.

## A06 · Preparar servidor y adaptador de ingestión

**Responsable:** Omar Tadeo Gasca Deciga · **Revisor:** David Alonso Torres Guerrero

**Semana:** S1 · **Entrega interna:** 2026-10-18 · **Prioridad:** P0

**Requisitos:** RF03, RF05 · **Depende de:** [A01](https://github.com/Santana-R/adaptive-rl-coach/issues/1), [A05](https://github.com/Santana-R/adaptive-rl-coach/issues/5)

### Objetivo
Dejar un servidor ejecutable y una interfaz común para cargar y consultar replays.

### Antes de empezar
Contrato de A01 y resultados reales de A05.

### Pasos sugeridos
1. Crear Express y documentar versiones y comandos reales.
2. Añadir .env.example con nombres de variables sin secretos y los estados de replay/bloque acordados.
3. Crear el adaptador de ingestión y un modo de datos de prueba identificado; comprobar endpoints básicos.

### Entrega concreta
PR del servidor, .env.example y docs/estados-procesamiento.md.

Las rutas de archivos son propuestas para organizar la implementación; todavía deben crearse al realizar la tarea.

### Ejemplo de referencia
Un endpoint de prueba devuelve estado pending y después ready con el mismo identificador.

### Se acepta cuando
- [ ] Crear base Node.js LTS/Express y configuración de entorno con .env.example.
- [ ] Definir estados por replay y bloque; el adaptador permite datos de prueba claramente identificados mientras se conecta la API.

### Evidencia para revisar
PR del servidor, contrato de estados y prueba básica de endpoints.

### Qué practicarás
Tadeo: servidor, configuración y separación entre integración externa y lógica propia.

**Cierre:** enlazar entrega/PR y comprobación; el revisor explica qué ejecutó y qué observó. Para código: integrado a main tras revisión. Para documentación: versión guardada y revisada. GitHub conserva el estado real; la planificación no marca esta tarea como realizada. Reparto actualizado con el Release del 12 de octubre; disponibilidad individual pendiente de confirmar.

## A07 · Auditar el modelo de ocho tablas y completar diseño

**Responsable:** David Alonso Torres Guerrero · **Revisor:** Roberto Santana Trujillo

**Semana:** S1 · **Entrega interna:** 2026-10-14 · **Prioridad:** P0

**Requisitos:** RF01–RF12 · **Depende de:** Ninguna

### Objetivo
Completar el diseño de datos antes de implementar funciones que necesitan historial.

### Antes de empezar
ERD de ocho tablas, Fase 1 y contrato de A01 en cuanto esté disponible.

### Pasos sugeridos
1. Revisar qué requisito cubre cada tabla y dónde faltan sesiones, rango declarado, reglas o versiones.
2. Escribir campos, unidades, claves, propietarios y relaciones en un diccionario.
3. Proponer migraciones y revisar el diseño con los consumidores antes de cambiar el ERD o la base.

### Entrega concreta
docs/diccionario-datos.md y propuesta de migraciones; ERD revisado cuando se acuerde.

Las rutas de archivos son propuestas para organizar la implementación; todavía deben crearse al realizar la tarea.

### Ejemplo de referencia
Una sesión necesita apuntar a la versión exacta del plan con la que se entrenó.

### Se acepta cuando
- [ ] Revisar usuarios, bloques, replays, métricas, objetivos, ejercicios, planes y plan_ejercicio.
- [ ] Proponer sesiones, historial de rango declarado, evidencia de reglas y snapshots de objetivos/ejercicios para cada versión del plan.
- [ ] Definir propietarios, claves, integridad, índices y permisos; acordar cualquier cambio del ERD antes de implementarlo.

### Evidencia para revisar
Diccionario y propuesta de migraciones; enlace al ERD actualizado existente.

### Qué practicarás
David: diseñar persistencia trazable y explicar por qué existe cada relación.

**Cierre:** enlazar entrega/PR y comprobación; el revisor explica qué ejecutó y qué observó. Para código: integrado a main tras revisión. Para documentación: versión guardada y revisada. GitHub conserva el estado real; la planificación no marca esta tarea como realizada. Reparto actualizado con el Release del 12 de octubre; disponibilidad individual pendiente de confirmar.

## A08 · Preparar autenticación y permisos de datos

**Responsable:** David Alonso Torres Guerrero · **Revisor:** Omar Tadeo Gasca Deciga

**Semana:** S1 · **Entrega interna:** 2026-10-18 · **Prioridad:** P0

**Requisitos:** RF01, RF02, RF12 · **Depende de:** [A01](https://github.com/Santana-R/adaptive-rl-coach/issues/1), [A07](https://github.com/Santana-R/adaptive-rl-coach/issues/7)

### Objetivo
Permitir acceso por correo y Google y proteger los recursos de cada jugador.

### Antes de empezar
Modelo de A07, contrato de A01 y configuración de Auth documentada.

### Pasos sugeridos
1. Implementar registro, acceso y salida; configurar Google según la documentación vigente.
2. Integrar validación de identidad en Express y propiedad de los datos.
3. Probar dos jugadores, administrador y suspensión; documentar el procedimiento de prueba.

### Entrega concreta
PR de autenticación, configuración sin secretos y matriz de permisos.

Las rutas de archivos son propuestas para organizar la implementación; todavía deben crearse al realizar la tarea.

### Ejemplo de referencia
Jugador A intenta consultar un bloque de B: acceso denegado; el registro público no crea administradores.

### Se acepta cuando
- [ ] Implementar registro por correo y Google, inicio y cierre de sesión con Supabase Auth.
- [ ] El registro público nunca asigna administrador; usuario A no lee ni cambia datos de B y suspensión impide acceso según el contrato.
- [ ] Definir validación del token en Express y política de propiedad por recurso.

### Evidencia para revisar
PR y evidencia con dos jugadores y un administrador.

### Qué practicarás
David: distinguir inicio de sesión, autorización y propiedad de datos.

**Cierre:** enlazar entrega/PR y comprobación; el revisor explica qué ejecutó y qué observó. Para código: integrado a main tras revisión. Para documentación: versión guardada y revisada. GitHub conserva el estado real; la planificación no marca esta tarea como realizada. Reparto actualizado con el Release del 12 de octubre; disponibilidad individual pendiente de confirmar.

# S2 · Primer bloque real

Resultado de S2: Jugador autenticado carga cinco replays privados y obtiene métricas válidas.

Corte interno: 2026-10-25. Reparto actualizado; confirmar disponibilidad en A01.

| Tarea | Responsable | Revisor | Fecha | Dependencias |
| --- | --- | --- | --- | --- |
| [A09](https://github.com/Santana-R/adaptive-rl-coach/issues/9) | Roberto | Tadeo | 2026-10-25 | A02, A05, A14 |
| [A10](https://github.com/Santana-R/adaptive-rl-coach/issues/10) | Roberto | David | 2026-10-25 | A09, A15 |
| [A11](https://github.com/Santana-R/adaptive-rl-coach/issues/11) | Luis | Tadeo | 2026-10-25 | A04, A13 |
| [A12](https://github.com/Santana-R/adaptive-rl-coach/issues/12) | Luis | David | 2026-10-25 | A04, A08 |
| [A13](https://github.com/Santana-R/adaptive-rl-coach/issues/13) | Tadeo | David | 2026-10-22 | A06, A08, A15 |
| [A14](https://github.com/Santana-R/adaptive-rl-coach/issues/14) | Tadeo | Roberto | 2026-10-21 | A05, A06, A08 |
| [A15](https://github.com/Santana-R/adaptive-rl-coach/issues/15) | David | Tadeo | 2026-10-21 | A07, A08 |
| [A16](https://github.com/Santana-R/adaptive-rl-coach/issues/16) | David | Roberto | 2026-10-25 | A07, A08 |

El avance y las casillas operativas se registran en cada issue de GitHub. Esta página es la guía de referencia.

## A09 · Normalizar métricas de cinco replays

**Responsable:** Roberto Santana Trujillo · **Revisor:** Omar Tadeo Gasca Deciga

**Semana:** S2 · **Entrega interna:** 2026-10-25 · **Prioridad:** P0

**Requisitos:** RF06 · **Depende de:** [A02](https://github.com/Santana-R/adaptive-rl-coach/issues/2), [A05](https://github.com/Santana-R/adaptive-rl-coach/issues/5), [A14](https://github.com/Santana-R/adaptive-rl-coach/issues/14)

### Objetivo
Producir métricas correctas para el jugador a partir de cinco replays válidos.

### Antes de empezar
Casos A02, datos disponibles A05 y extracción compatible A14.

### Pasos sugeridos
1. Localizar al jugador de interés en cada replay y conservar trazabilidad.
2. Documentar fórmula, unidad y denominador de cada métrica; mantener null si falta información.
3. Comparar resultados de la función con cálculos manuales y registrar exclusiones.

### Entrega concreta
PR de normalización, docs/metricas.md y casos calculados a mano.

Las rutas de archivos son propuestas para organizar la implementación; todavía deben crearse al realizar la tarea.

### Ejemplo de referencia
2 goles/8 tiros y 3 goles/12 tiros se agregan como 5/20 = 25%; no se promedian porcentajes sin sus denominadores.

### Se acepta cuando
- [ ] Extraer exclusivamente al jugador identificado en cada replay.
- [ ] Agregar con denominadores y unidades explícitos; porcentajes ponderados por totales, null para datos ausentes y exclusiones visibles.

### Evidencia para revisar
Casos calculados a mano y resultados coincidentes.

### Qué practicarás
Roberto: transformación de datos, funciones y pruebas numéricas.

**Cierre:** enlazar entrega/PR y comprobación; el revisor explica qué ejecutó y qué observó. Para código: integrado a main tras revisión. Para documentación: versión guardada y revisada. GitHub conserva el estado real; la planificación no marca esta tarea como realizada. Reparto actualizado con el Release del 12 de octubre; disponibilidad individual pendiente de confirmar.

## A10 · Resolver línea base y comparación válida

**Responsable:** Roberto Santana Trujillo · **Revisor:** David Alonso Torres Guerrero

**Semana:** S2 · **Entrega interna:** 2026-10-25 · **Prioridad:** P0

**Requisitos:** RF07 · **Depende de:** [A09](https://github.com/Santana-R/adaptive-rl-coach/issues/9), [A15](https://github.com/Santana-R/adaptive-rl-coach/issues/15)

### Objetivo
Decidir cuándo comparar dos bloques y explicar claramente el resultado.

### Antes de empezar
Métricas A09 y bloques persistidos A15.

### Pasos sugeridos
1. Definir línea base si solo existe un bloque válido.
2. Validar identidad, modalidad, tipo, cronología y equivalencia de medición.
3. Calcular cambios por métrica y devolver un motivo verificable cuando la comparación no aplica.

### Entrega concreta
PR de comparación y pruebas de línea base, incompatibilidad y cambios.

Las rutas de archivos son propuestas para organizar la implementación; todavía deben crearse al realizar la tarea.

### Ejemplo de referencia
Un bloque ranked 2v2 no se compara con casual 3v3; se conserva y muestra el motivo.

### Se acepta cuando
- [ ] Primer bloque se marca como línea base.
- [ ] Comparar solo misma identidad, modalidad, tipo casual/ranked y medición equivalente; el seguimiento debe ser posterior.
- [ ] Bloques no comparables conservan motivo y no producen una mejora inventada.

### Evidencia para revisar
Pruebas de cronología, incompatibilidad y comparación válida.

### Qué practicarás
Roberto: condiciones, fechas y un contrato que después consumirá su pantalla A19.

**Cierre:** enlazar entrega/PR y comprobación; el revisor explica qué ejecutó y qué observó. Para código: integrado a main tras revisión. Para documentación: versión guardada y revisada. GitHub conserva el estado real; la planificación no marca esta tarea como realizada. Reparto actualizado con el Release del 12 de octubre; disponibilidad individual pendiente de confirmar.

## A11 · Implementar carga e historial de bloques

**Responsable:** Luis Enrique Almaguer Castillo · **Revisor:** Omar Tadeo Gasca Deciga

**Semana:** S2 · **Entrega interna:** 2026-10-25 · **Prioridad:** P0

**Requisitos:** RF03, RF04, RF05 · **Depende de:** [A04](https://github.com/Santana-R/adaptive-rl-coach/issues/4), [A13](https://github.com/Santana-R/adaptive-rl-coach/issues/13)

### Objetivo
Permitir cargar cinco replays y seguir el estado de cada bloque desde la interfaz.

### Antes de empezar
Base A04 y contrato/endpoint A13; durante desarrollo usar respuestas de prueba marcadas.

### Pasos sugeridos
1. Crear selección de exactamente cinco .replay y validación antes de enviar.
2. Conectar envío y estados por archivo, bloque, espera, error y reintento.
3. Crear historial con IDs y enlace a detalle; bloquear envíos repetidos accidentales.

### Entrega concreta
PR frontend y capturas de carga válida, inválida y parcial.

Las rutas de archivos son propuestas para organizar la implementación; todavía deben crearse al realizar la tarea.

### Ejemplo de referencia
Al seleccionar cuatro archivos se explica que faltan uno; el botón no envía el bloque.

### Se acepta cuando
- [ ] Aceptar exactamente cinco archivos .replay desde PC y mostrar validaciones antes de enviar.
- [ ] Mostrar estado individual, duplicados, espera, fallos y reintentos; impedir doble envío accidental.
- [ ] Historial conserva IDs y permite ver el detalle de un bloque.

### Evidencia para revisar
Demo de bloque correcto, inválido y procesamiento parcial.

### Qué practicarás
Luis: formularios, peticiones asíncronas y representación de estados.

**Cierre:** enlazar entrega/PR y comprobación; el revisor explica qué ejecutó y qué observó. Para código: integrado a main tras revisión. Para documentación: versión guardada y revisada. GitHub conserva el estado real; la planificación no marca esta tarea como realizada. Reparto actualizado con el Release del 12 de octubre; disponibilidad individual pendiente de confirmar.

## A12 · Conectar registro, login y perfil

**Responsable:** Luis Enrique Almaguer Castillo · **Revisor:** David Alonso Torres Guerrero

**Semana:** S2 · **Entrega interna:** 2026-10-25 · **Prioridad:** P1

**Requisitos:** RF01, RF02 · **Depende de:** [A04](https://github.com/Santana-R/adaptive-rl-coach/issues/4), [A08](https://github.com/Santana-R/adaptive-rl-coach/issues/8)

### Objetivo
Conectar las pantallas de acceso y perfil con autenticación y persistencia.

### Antes de empezar
Base A04 y autenticación A08.

### Pasos sugeridos
1. Conectar correo y Google y representar fallos comprensibles.
2. Añadir plataforma, modalidad e identidad Epic/Steam con validación.
3. Comprobar que una edición persiste al recargar y que no se analiza un perfil incompleto.

### Entrega concreta
PR y recorrido de acceso/perfil con ambos métodos.

Las rutas de archivos son propuestas para organizar la implementación; todavía deben crearse al realizar la tarea.

### Ejemplo de referencia
Sin identidad del jugador, la pantalla explica qué falta antes de analizar replays.

### Se acepta cuando
- [ ] Conectar correo y Google y mensajes de error; Discord queda opcional.
- [ ] Guardar plataforma, modalidad e identidad Epic o Steam; impedir análisis sin perfil válido.

### Evidencia para revisar
Demo de ambos métodos y edición persistente de perfil.

### Qué practicarás
Luis: estado de sesión, validación y datos persistidos desde formularios.

**Cierre:** enlazar entrega/PR y comprobación; el revisor explica qué ejecutó y qué observó. Para código: integrado a main tras revisión. Para documentación: versión guardada y revisada. GitHub conserva el estado real; la planificación no marca esta tarea como realizada. Reparto actualizado con el Release del 12 de octubre; disponibilidad individual pendiente de confirmar.

## A13 · Implementar carga privada y estados de procesamiento

**Responsable:** Omar Tadeo Gasca Deciga · **Revisor:** David Alonso Torres Guerrero

**Semana:** S2 · **Entrega interna:** 2026-10-22 · **Prioridad:** P0

**Requisitos:** RF03, RF04, RF05 · **Depende de:** [A06](https://github.com/Santana-R/adaptive-rl-coach/issues/6), [A08](https://github.com/Santana-R/adaptive-rl-coach/issues/8), [A15](https://github.com/Santana-R/adaptive-rl-coach/issues/15)

### Objetivo
Procesar cargas privadas sin perder estados ni duplicar registros durante reintentos.

### Antes de empezar
Servidor A06, autorización A08 y persistencia A15.

### Pasos sugeridos
1. Validar el lote y registrar IDs/propiedad antes de consultar procesamiento.
2. Implementar espera y reintento controlado conservando estados individuales.
3. Probar formato, duplicados y fallos; comprobar una carga real privada autorizada.

### Entrega concreta
PR del adaptador y pruebas con fallos y un bloque real.

Las rutas de archivos son propuestas para organizar la implementación; todavía deben crearse al realizar la tarea.

### Ejemplo de referencia
Un fallo transitorio se reintenta sobre el registro existente; no crea otro replay propio.

### Se acepta cuando
- [ ] Recibir cinco replays autorizados, validar formato y duplicados, guardar IDs y consultar estados.
- [ ] Reintentar fallos transitorios sin duplicar registros; conservar bloque pendiente o fallido hasta resolverlo.
- [ ] Limpiar solo cargas propias y temporales; nunca borrar el duplicado externo de otro usuario.

### Evidencia para revisar
Pruebas del adaptador con errores y un bloque real.

### Qué practicarás
Tadeo: procesos externos, estados e idempotencia de reintentos.

**Cierre:** enlazar entrega/PR y comprobación; el revisor explica qué ejecutó y qué observó. Para código: integrado a main tras revisión. Para documentación: versión guardada y revisada. GitHub conserva el estado real; la planificación no marca esta tarea como realizada. Reparto actualizado con el Release del 12 de octubre; disponibilidad individual pendiente de confirmar.

## A14 · Validar identidad y compatibilidad del bloque

**Responsable:** Omar Tadeo Gasca Deciga · **Revisor:** Roberto Santana Trujillo

**Semana:** S2 · **Entrega interna:** 2026-10-21 · **Prioridad:** P0

**Requisitos:** RF04, RF06 · **Depende de:** [A05](https://github.com/Santana-R/adaptive-rl-coach/issues/5), [A06](https://github.com/Santana-R/adaptive-rl-coach/issues/6), [A08](https://github.com/Santana-R/adaptive-rl-coach/issues/8)

### Objetivo
Entregar al motor datos que pertenezcan al mismo jugador y contexto.

### Antes de empezar
Prueba A05, servidor A06 y perfil autorizado A08.

### Pasos sugeridos
1. Buscar la identidad del perfil en los cinco archivos procesados.
2. Validar modalidad y tipo; devolver motivos por replay y por bloque.
3. Entregar la extracción con IDs, unidades y disponibilidad de métricas al motor A09.

### Entrega concreta
PR, respuesta anonimizada y casos de jugador ausente/contexto incompatible.

Las rutas de archivos son propuestas para organizar la implementación; todavía deben crearse al realizar la tarea.

### Ejemplo de referencia
Si el jugador no aparece en uno de los cinco replays, el bloque no se presenta como una medición completa válida.

### Se acepta cuando
- [ ] Encontrar al jugador del perfil en los cinco replays.
- [ ] Rechazar o señalar modalidad/tipo/identidad incompatibles sin mezclar mediciones.
- [ ] Entregar al motor datos normalizados con trazabilidad al replay.

### Evidencia para revisar
Payload anonimizado de cinco partidas y casos incompatibles.

### Qué practicarás
Tadeo: validar entradas y diseñar la frontera entre API y motor.

**Cierre:** enlazar entrega/PR y comprobación; el revisor explica qué ejecutó y qué observó. Para código: integrado a main tras revisión. Para documentación: versión guardada y revisada. GitHub conserva el estado real; la planificación no marca esta tarea como realizada. Reparto actualizado con el Release del 12 de octubre; disponibilidad individual pendiente de confirmar.

## A15 · Persistir perfil, bloques, replays y métricas

**Responsable:** David Alonso Torres Guerrero · **Revisor:** Omar Tadeo Gasca Deciga

**Semana:** S2 · **Entrega interna:** 2026-10-21 · **Prioridad:** P0

**Requisitos:** RF02, RF05, RF06 · **Depende de:** [A07](https://github.com/Santana-R/adaptive-rl-coach/issues/7), [A08](https://github.com/Santana-R/adaptive-rl-coach/issues/8)

### Objetivo
Guardar perfil, bloques, replays y métricas con propiedad e integridad.

### Antes de empezar
Modelo A07 y autenticación A08.

### Pasos sugeridos
1. Crear las migraciones acordadas y datos de ejemplo.
2. Persistir IDs y estados sin duplicados y conservar datos ausentes como null.
3. Entregar consultas/ejemplos anonimizados para A09–A10 y después A19.

### Entrega concreta
Migraciones, seed de ejemplo y consultas de integridad.

Las rutas de archivos son propuestas para organizar la implementación; todavía deben crearse al realizar la tarea.

### Ejemplo de referencia
Tras reiniciar el servidor se consulta el mismo bloque, con sus cinco replays y sus estados.

### Se acepta cuando
- [ ] Crear migraciones acordadas y relaciones de propiedad.
- [ ] Persistir estados y métricas sin duplicar cargas; null sigue siendo null.
- [ ] Exportar datos de ejemplo sin información privada para el desarrollo de los demás.

### Evidencia para revisar
Migración, seed de prueba y consultas de integridad.

### Qué practicarás
David: relaciones, restricciones y recuperación de datos para una función completa.

**Cierre:** enlazar entrega/PR y comprobación; el revisor explica qué ejecutó y qué observó. Para código: integrado a main tras revisión. Para documentación: versión guardada y revisada. GitHub conserva el estado real; la planificación no marca esta tarea como realizada. Reparto actualizado con el Release del 12 de octubre; disponibilidad individual pendiente de confirmar.

## A16 · Implementar objetivos con historial

**Responsable:** David Alonso Torres Guerrero · **Revisor:** Roberto Santana Trujillo

**Semana:** S2 · **Entrega interna:** 2026-10-25 · **Prioridad:** P1

**Requisitos:** RF10 · **Depende de:** [A07](https://github.com/Santana-R/adaptive-rl-coach/issues/7), [A08](https://github.com/Santana-R/adaptive-rl-coach/issues/8)

### Objetivo
Permitir objetivos propios con historial, sin cambiar artificialmente el diagnóstico.

### Antes de empezar
Modelo A07 y propiedad A08.

### Pasos sugeridos
1. Crear endpoints para alta, consulta y edición de metas por modalidad.
2. Conservar historial y archivar metas vinculadas a planes.
3. Probar edición/archivo y acceso de otro jugador; documentar efecto sobre planes nuevos.

### Entrega concreta
PR de objetivos y casos de historial/propiedad.

Las rutas de archivos son propuestas para organizar la implementación; todavía deben crearse al realizar la tarea.

### Ejemplo de referencia
Archivar una meta vinculada conserva el plan que ya la usó; las métricas anteriores no se modifican.

### Se acepta cuando
- [ ] Crear, consultar y editar objetivos por modalidad, con meta principal de rendimiento y meta opcional de entrenamiento.
- [ ] Archivar metas vinculadas a planes/historial en lugar de destruirlas; conservar versión cuando cambien.
- [ ] Objetivos no alteran métricas ni diagnóstico para forzar una recomendación.

### Evidencia para revisar
Endpoints y casos de edición, archivo y propiedad.

### Qué practicarás
David: CRUD con historial y reglas de conservación.

**Cierre:** enlazar entrega/PR y comprobación; el revisor explica qué ejecutó y qué observó. Para código: integrado a main tras revisión. Para documentación: versión guardada y revisada. GitHub conserva el estado real; la planificación no marca esta tarea como realizada. Reparto actualizado con el Release del 12 de octubre; disponibilidad individual pendiente de confirmar.

# S3 · Diagnóstico y plan

Resultado de S3: Diagnóstico explicable, plan versionado, objetivos y registro de sesiones.

Corte interno: 2026-11-01. Reparto actualizado; confirmar disponibilidad en A01.

| Tarea | Responsable | Revisor | Fecha | Dependencias |
| --- | --- | --- | --- | --- |
| [A17](https://github.com/Santana-R/adaptive-rl-coach/issues/17) | Roberto | Tadeo | 2026-10-28 | A02, A09, A10 |
| [A18](https://github.com/Santana-R/adaptive-rl-coach/issues/18) | Roberto | David | 2026-11-01 | A16, A17, A23, A24 |
| [A19](https://github.com/Santana-R/adaptive-rl-coach/issues/19) | Roberto | Luis | 2026-11-01 | A06, A10, A11, A15, A17 |
| [A20](https://github.com/Santana-R/adaptive-rl-coach/issues/20) | Luis | David | 2026-11-01 | A12, A16 |
| [A21](https://github.com/Santana-R/adaptive-rl-coach/issues/21) | Tadeo | David | 2026-11-01 | A08, A24 |
| [A22](https://github.com/Santana-R/adaptive-rl-coach/issues/22) | Tadeo | Roberto | 2026-11-01 | A10, A16, A21 |
| [A23](https://github.com/Santana-R/adaptive-rl-coach/issues/23) | David | Roberto | 2026-10-28 | A07, A08 |
| [A24](https://github.com/Santana-R/adaptive-rl-coach/issues/24) | David | Tadeo | 2026-10-28 | A07, A15, A16 |

Dos tareas por persona no son una cuota. En S3 Roberto tiene A17/A18/A19; en S4 Tadeo coordina A25 además de A29/A30. Ajustar compromisos con disponibilidad y entregas intermedias; no añadir tareas para igualar conteos.

El avance y las casillas operativas se registran en cada issue de GitHub. Esta página es la guía de referencia.

## A17 · Implementar reglas con máximo tres prioridades

**Responsable:** Roberto Santana Trujillo · **Revisor:** Omar Tadeo Gasca Deciga

**Semana:** S3 · **Entrega interna:** 2026-10-28 · **Prioridad:** P0

**Requisitos:** RF08 · **Depende de:** [A02](https://github.com/Santana-R/adaptive-rl-coach/issues/2), [A09](https://github.com/Santana-R/adaptive-rl-coach/issues/9), [A10](https://github.com/Santana-R/adaptive-rl-coach/issues/10)

### Objetivo
Generar prioridades reproducibles que se puedan explicar con evidencia.

### Antes de empezar
Casos A02, métricas A09 y comparación A10.

### Pasos sugeridos
1. Trasladar las reglas acordadas a JavaScript con versión explícita.
2. Ordenar y limitar a tres prioridades; cada salida conserva regla, dato y unidad.
3. Comprobar empates, faltantes y ausencia de señal con los casos preparados.

### Entrega concreta
PR del motor y resultados de los casos de reglas.

Las rutas de archivos son propuestas para organizar la implementación; todavía deben crearse al realizar la tarea.

### Ejemplo de referencia
Una prioridad incluye el ID de regla y la métrica que la activó; un dato ausente no activa una conclusión inventada.

### Se acepta cuando
- [ ] Generar como máximo tres prioridades ordenadas de forma determinista.
- [ ] Cada prioridad conserva regla, evidencia, unidades y contexto; datos insuficientes producen explicación.
- [ ] Verificar salida del motor web frente a los casos del prototipo.

### Evidencia para revisar
Pruebas de reglas, empates, null y ausencia de prioridades.

### Qué practicarás
Roberto: lógica determinista, ordenamiento y explicaciones comprobables.

**Cierre:** enlazar entrega/PR y comprobación; el revisor explica qué ejecutó y qué observó. Para código: integrado a main tras revisión. Para documentación: versión guardada y revisada. GitHub conserva el estado real; la planificación no marca esta tarea como realizada. Reparto actualizado con el Release del 12 de octubre; disponibilidad individual pendiente de confirmar.

## A18 · Generar planes compatibles y versionados

**Responsable:** Roberto Santana Trujillo · **Revisor:** David Alonso Torres Guerrero

**Semana:** S3 · **Entrega interna:** 2026-11-01 · **Prioridad:** P0

**Requisitos:** RF09 · **Depende de:** [A16](https://github.com/Santana-R/adaptive-rl-coach/issues/16), [A17](https://github.com/Santana-R/adaptive-rl-coach/issues/17), [A23](https://github.com/Santana-R/adaptive-rl-coach/issues/23), [A24](https://github.com/Santana-R/adaptive-rl-coach/issues/24)

### Objetivo
Crear un plan posible de realizar y conservar las versiones anteriores.

### Antes de empezar
Metas A16, prioridades A17, catálogo A23 y versiones A24.

### Pasos sugeridos
1. Elegir ejercicios activos compatibles con prioridad, meta, plataforma y disponibilidad.
2. Comprobar duración, sesiones e instrucciones de cada ejercicio.
3. Guardar otra versión al actualizar y explicar cobertura parcial o vacía.

### Entrega concreta
PR del generador y casos de catálogo suficiente, parcial y vacío.

Las rutas de archivos son propuestas para organizar la implementación; todavía deben crearse al realizar la tarea.

### Ejemplo de referencia
Si solo existe un ejercicio compatible para dos prioridades, se muestra plan parcial y la cobertura que falta.

### Se acepta cuando
- [ ] Seleccionar ejercicios activos según prioridades, metas, plataforma, disponibilidad y sesiones.
- [ ] Incluir instrucciones, duración, dificultad y recurso; validar que el tiempo cabe en la disponibilidad.
- [ ] Sin cobertura total, declarar plan parcial o vacío y motivo; Actualizar plan crea otra versión.

### Evidencia para revisar
Casos con catálogo suficiente, parcial y vacío.

### Qué practicarás
Roberto: restricciones, selección y conexión entre reglas y persistencia.

**Cierre:** enlazar entrega/PR y comprobación; el revisor explica qué ejecutó y qué observó. Para código: integrado a main tras revisión. Para documentación: versión guardada y revisada. GitHub conserva el estado real; la planificación no marca esta tarea como realizada. Reparto actualizado con el Release del 12 de octubre; disponibilidad individual pendiente de confirmar.

## A19 · Conectar datos, API y pantalla de análisis con comparación

**Responsable:** Roberto Santana Trujillo · **Revisor:** Luis Enrique Almaguer Castillo

**Semana:** S3 · **Entrega interna:** 2026-11-01 · **Prioridad:** P1

**Requisitos:** RF06, RF07, RF08 · **Depende de:** [A06](https://github.com/Santana-R/adaptive-rl-coach/issues/6), [A10](https://github.com/Santana-R/adaptive-rl-coach/issues/10), [A11](https://github.com/Santana-R/adaptive-rl-coach/issues/11), [A15](https://github.com/Santana-R/adaptive-rl-coach/issues/15), [A17](https://github.com/Santana-R/adaptive-rl-coach/issues/17)

### Objetivo
Construir una función completa para que Roberto conecte datos, servidor e interfaz.

### Antes de empezar
Servidor A06; comparación A10; acceso al bloque desde A11; consultas A15; prioridades A17; base visual A04.

### Pasos sugeridos
1. Consultar los bloques propios y acordar con Tadeo la ruta del endpoint de análisis.
2. Reutilizar A09/A10/A17 y devolver el resultado autorizado con unidades, motivos y evidencia.
3. Conectar la respuesta a la pantalla Análisis con JavaScript/Chart.js; revisar su uso con Luis mediante el PR.

### Entrega concreta
PR que incluya consulta, endpoint y pantalla; ejemplo de respuesta, prueba del recorrido y capturas.

Las rutas de archivos son propuestas para organizar la implementación; todavía deben crearse al realizar la tarea.

### Ejemplo de referencia
Abrir bloque B desde el historial: la API recupera A/B propios, calcula +5 puntos porcentuales de tiro en el caso de prueba y la pantalla lo muestra con unidad y período.

### Se acepta cuando
- [ ] Consultar bloques guardados del jugador autorizado y reutilizar la normalización/comparación de A09–A10 y las prioridades de A17.
- [ ] Implementar la consulta del análisis en Express y conectar su respuesta a la pantalla existente con JavaScript y Chart.js.
- [ ] Mostrar métricas por replay/bloque, unidades, faltantes, línea base o comparación, hasta tres prioridades y el motivo de incompatibilidad.
- [ ] Comprobar el recorrido datos → API → interfaz con bloques comparables, primer bloque, datos faltantes y acceso a datos ajenos denegado.

### Evidencia para revisar
PR de la función completa, ejemplo de respuesta, capturas y prueba del recorrido con cifras verificadas.

### Qué practicarás
Roberto: comprender y construir una función desde persistencia hasta interfaz; Tadeo mantiene el servidor común, David el modelo y Luis la base visual.

**Cierre:** enlazar entrega/PR y comprobación; el revisor explica qué ejecutó y qué observó. Para código: integrado a main tras revisión. Para documentación: versión guardada y revisada. GitHub conserva el estado real; la planificación no marca esta tarea como realizada. Reparto actualizado con el Release del 12 de octubre; disponibilidad individual pendiente de confirmar.

## A20 · Construir gestión de objetivos

**Responsable:** Luis Enrique Almaguer Castillo · **Revisor:** David Alonso Torres Guerrero

**Semana:** S3 · **Entrega interna:** 2026-11-01 · **Prioridad:** P1

**Requisitos:** RF10 · **Depende de:** [A12](https://github.com/Santana-R/adaptive-rl-coach/issues/12), [A16](https://github.com/Santana-R/adaptive-rl-coach/issues/16)

### Objetivo
Dar al jugador una interfaz para mantener sus objetivos.

### Antes de empezar
Perfil A12 y endpoints A16.

### Pasos sugeridos
1. Crear listado y formularios por modalidad.
2. Conectar alta, edición y archivo con los mensajes correspondientes.
3. Mostrar metas de rendimiento y entrenamiento por separado y comprobar conservación del historial.

### Entrega concreta
PR de pantalla Objetivos y recorrido de todos sus estados.

Las rutas de archivos son propuestas para organizar la implementación; todavía deben crearse al realizar la tarea.

### Ejemplo de referencia
Archivar una meta cambia su estado visible y permite seguir consultando el plan histórico relacionado.

### Se acepta cuando
- [ ] Crear, consultar, editar y archivar metas por modalidad.
- [ ] Distinguir meta de rendimiento y entrenamiento y explicar su relación con planes e historial.

### Evidencia para revisar
Recorrido de todos los estados de objetivos.

### Qué practicarás
Luis: formularios CRUD y explicación de cambios con historial.

**Cierre:** enlazar entrega/PR y comprobación; el revisor explica qué ejecutó y qué observó. Para código: integrado a main tras revisión. Para documentación: versión guardada y revisada. GitHub conserva el estado real; la planificación no marca esta tarea como realizada. Reparto actualizado con el Release del 12 de octubre; disponibilidad individual pendiente de confirmar.

## A21 · Implementar CRUD de sesiones ligadas al plan

**Responsable:** Omar Tadeo Gasca Deciga · **Revisor:** David Alonso Torres Guerrero

**Semana:** S3 · **Entrega interna:** 2026-11-01 · **Prioridad:** P0

**Requisitos:** RF10 · **Depende de:** [A08](https://github.com/Santana-R/adaptive-rl-coach/issues/8), [A24](https://github.com/Santana-R/adaptive-rl-coach/issues/24)

### Objetivo
Registrar entrenamiento realizado sobre la versión exacta del plan.

### Antes de empezar
Autorización A08 y versiones A24.

### Pasos sugeridos
1. Implementar alta, consulta, corrección y eliminación de sesiones propias.
2. Validar fecha, duración, ejercicio y versión del plan.
3. Recalcular conteos tras una corrección/eliminación y comprobar dos versiones distintas.

### Entrega concreta
PR de sesiones y pruebas CRUD/recálculo.

Las rutas de archivos son propuestas para organizar la implementación; todavía deben crearse al realizar la tarea.

### Ejemplo de referencia
Corregir una sesión de 20 a 15 minutos actualiza el total de entrenamiento; no demuestra una mejora en partidas.

### Se acepta cuando
- [ ] Crear, consultar, corregir y eliminar sesiones propias ligadas a la versión exacta del plan.
- [ ] Validar fecha, ejercicio y duración; la actividad es autorreportada.
- [ ] Corrección o eliminación deja progresos coherentes y nunca prueba por sí sola mejora en partidas.

### Evidencia para revisar
Casos CRUD y recálculo con dos versiones de plan.

### Qué practicarás
Tadeo: endpoints CRUD y coherencia de datos derivados.

**Cierre:** enlazar entrega/PR y comprobación; el revisor explica qué ejecutó y qué observó. Para código: integrado a main tras revisión. Para documentación: versión guardada y revisada. GitHub conserva el estado real; la planificación no marca esta tarea como realizada. Reparto actualizado con el Release del 12 de octubre; disponibilidad individual pendiente de confirmar.

## A22 · Calcular progreso y contrato de reportes

**Responsable:** Omar Tadeo Gasca Deciga · **Revisor:** Roberto Santana Trujillo

**Semana:** S3 · **Entrega interna:** 2026-11-01 · **Prioridad:** P1

**Requisitos:** RF10, RF11 · **Depende de:** [A10](https://github.com/Santana-R/adaptive-rl-coach/issues/10), [A16](https://github.com/Santana-R/adaptive-rl-coach/issues/16), [A21](https://github.com/Santana-R/adaptive-rl-coach/issues/21)

### Objetivo
Entregar reportes con fuentes y unidades claras.

### Antes de empezar
Comparación A10, objetivos A16 y sesiones A21.

### Pasos sugeridos
1. Separar entrenamiento declarado, cumplimiento de metas y métricas de partidas.
2. Agregar período, cantidad de observaciones, denominador y exclusiones.
3. Comprobar respuestas con datos de prueba y documentar su consumo por A28.

### Entrega concreta
PR de reportes y ejemplos numéricos verificados.

Las rutas de archivos son propuestas para organizar la implementación; todavía deben crearse al realizar la tarea.

### Ejemplo de referencia
45 minutos declarados se presentan como entrenamiento; el cambio de rendimiento proviene de bloques comparables.

### Se acepta cuando
- [ ] Separar progreso de entrenamiento, metas de rendimiento y cambios de métricas.
- [ ] Incluir período, conteos, denominador, unidades, exclusiones y fuente de cada dato; rango se identifica como declarado.

### Evidencia para revisar
Respuestas de reporte verificadas con fixtures.

### Qué practicarás
Tadeo: agregaciones y contratos claros para gráficas.

**Cierre:** enlazar entrega/PR y comprobación; el revisor explica qué ejecutó y qué observó. Para código: integrado a main tras revisión. Para documentación: versión guardada y revisada. GitHub conserva el estado real; la planificación no marca esta tarea como realizada. Reparto actualizado con el Release del 12 de octubre; disponibilidad individual pendiente de confirmar.

## A23 · Implementar catálogo CRUD y semilla validada

**Responsable:** David Alonso Torres Guerrero · **Revisor:** Roberto Santana Trujillo

**Semana:** S3 · **Entrega interna:** 2026-10-28 · **Prioridad:** P0

**Requisitos:** RF09, RF12 · **Depende de:** [A07](https://github.com/Santana-R/adaptive-rl-coach/issues/7), [A08](https://github.com/Santana-R/adaptive-rl-coach/issues/8)

### Objetivo
Mantener ejercicios y recursos que realmente puedan usarse en planes nuevos.

### Antes de empezar
Diseño A07 y permisos A08.

### Pasos sugeridos
1. Implementar CRUD autorizado de ejercicios y recursos.
2. Validar compatibilidad, duración, dificultad e instrucciones.
3. Preparar y revisar la semilla mínima; probar que un ejercicio desactivado no entra en un plan nuevo.

### Entrega concreta
PR de catálogo y seed revisado para las prioridades del MVP.

Las rutas de archivos son propuestas para organizar la implementación; todavía deben crearse al realizar la tarea.

### Ejemplo de referencia
Desactivar un ejercicio lo excluye de planes nuevos y conserva la descripción del plan que ya lo usó.

### Se acepta cuando
- [ ] Administrador crea, consulta, edita y desactiva ejercicios y recursos.
- [ ] Validar modalidad/plataforma, duración, dificultad e instrucciones; seed revisado habilita ejercicios explícitamente.
- [ ] Jugador no administra catálogo; ejercicios desactivados no entran en planes nuevos.

### Evidencia para revisar
Endpoints y seed suficiente para cubrir prioridades del MVP.

### Qué practicarás
David: catálogo autorizado y conservación de datos históricos.

**Cierre:** enlazar entrega/PR y comprobación; el revisor explica qué ejecutó y qué observó. Para código: integrado a main tras revisión. Para documentación: versión guardada y revisada. GitHub conserva el estado real; la planificación no marca esta tarea como realizada. Reparto actualizado con el Release del 12 de octubre; disponibilidad individual pendiente de confirmar.

## A24 · Persistir versiones y snapshots del plan

**Responsable:** David Alonso Torres Guerrero · **Revisor:** Omar Tadeo Gasca Deciga

**Semana:** S3 · **Entrega interna:** 2026-10-28 · **Prioridad:** P0

**Requisitos:** RF09, RF10 · **Depende de:** [A07](https://github.com/Santana-R/adaptive-rl-coach/issues/7), [A15](https://github.com/Santana-R/adaptive-rl-coach/issues/15), [A16](https://github.com/Santana-R/adaptive-rl-coach/issues/16)

### Objetivo
Conservar exactamente qué datos y reglas originaron cada versión del plan.

### Antes de empezar
Modelo A07, datos A15 y objetivos A16.

### Pasos sugeridos
1. Guardar la copia histórica de meta, perfil, ejercicio, regla y evidencia aplicada.
2. Enlazar plan_ejercicio y sesiones a su versión correcta.
3. Modificar datos actuales y demostrar que una versión previa permanece idéntica.

### Entrega concreta
Migraciones/PR y comparación de versiones antes/después.

Las rutas de archivos son propuestas para organizar la implementación; todavía deben crearse al realizar la tarea.

### Ejemplo de referencia
Editar hoy la duración de un ejercicio no cambia el tiempo que mostraba el plan de ayer.

### Se acepta cuando
- [ ] Conservar metas, perfil, ejercicios, evidencia y reglas aplicadas en cada versión.
- [ ] Cambiar perfil/meta/catálogo no reescribe versiones anteriores; actualizar crea otra.
- [ ] Sesiones y plan_ejercicio referencian la versión correcta.

### Evidencia para revisar
Migraciones y comparación antes/después de una actualización.

### Qué practicarás
David: snapshots, versionado y trazabilidad.

**Cierre:** enlazar entrega/PR y comprobación; el revisor explica qué ejecutó y qué observó. Para código: integrado a main tras revisión. Para documentación: versión guardada y revisada. GitHub conserva el estado real; la planificación no marca esta tarea como realizada. Reparto actualizado con el Release del 12 de octubre; disponibilidad individual pendiente de confirmar.

# S4 · Integración completa

Resultado de S4: RF01–RF12 conectados, administración y segundo bloque comparable.

Corte interno: 2026-11-06. Reparto actualizado; confirmar disponibilidad en A01.

| Tarea | Responsable | Revisor | Fecha | Dependencias |
| --- | --- | --- | --- | --- |
| [A25](https://github.com/Santana-R/adaptive-rl-coach/issues/25) | Tadeo | Roberto | 2026-11-06 | A18, A19, A21, A22, A24 |
| [A26](https://github.com/Santana-R/adaptive-rl-coach/issues/26) | Roberto | David | 2026-11-06 | A17, A18 |
| [A27](https://github.com/Santana-R/adaptive-rl-coach/issues/27) | Luis | David | 2026-11-06 | A18, A20, A21, A24 |
| [A28](https://github.com/Santana-R/adaptive-rl-coach/issues/28) | Luis | Roberto | 2026-11-06 | A19, A22, A31 |
| [A29](https://github.com/Santana-R/adaptive-rl-coach/issues/29) | Tadeo | David | 2026-11-04 | A08 |
| [A30](https://github.com/Santana-R/adaptive-rl-coach/issues/30) | Tadeo | Roberto | 2026-11-06 | A13, A14 |
| [A31](https://github.com/Santana-R/adaptive-rl-coach/issues/31) | David | Roberto | 2026-11-04 | A16, A22, A24 |
| [A32](https://github.com/Santana-R/adaptive-rl-coach/issues/32) | David | Luis | 2026-11-06 | A04, A23, A29 |

Dos tareas por persona no son una cuota. En S3 Roberto tiene A17/A18/A19; en S4 Tadeo coordina A25 además de A29/A30. Ajustar compromisos con disponibilidad y entregas intermedias; no añadir tareas para igualar conteos.

El avance y las casillas operativas se registran en cada issue de GitHub. Esta página es la guía de referencia.

## A25 · Coordinar y comprobar la integración del ciclo completo

**Responsable:** Omar Tadeo Gasca Deciga · **Revisor:** Roberto Santana Trujillo

**Semana:** S4 · **Entrega interna:** 2026-11-06 · **Prioridad:** P0

**Requisitos:** RF01–RF12 · **Depende de:** [A18](https://github.com/Santana-R/adaptive-rl-coach/issues/18), [A19](https://github.com/Santana-R/adaptive-rl-coach/issues/19), [A21](https://github.com/Santana-R/adaptive-rl-coach/issues/21), [A22](https://github.com/Santana-R/adaptive-rl-coach/issues/22), [A24](https://github.com/Santana-R/adaptive-rl-coach/issues/24)

### Objetivo
Comprobar que los módulos de los cuatro funcionan juntos en el recorrido obligatorio.

### Antes de empezar
A18, A19, A21, A22 y A24 integradas o con entregas intermedias acordadas.

### Pasos sugeridos
1. Tadeo coordina el recorrido completo con dos bloques reales comparables.
2. Abrir incidencias con módulo afectado, evidencia y responsable; cada dueño corrige su pieza.
3. Repetir el recorrido tras los arreglos y dejar evidencia antes del corte.

### Entrega concreta
Registro de integración, incidencias resueltas y demo del ciclo completo.

Las rutas de archivos son propuestas para organizar la implementación; todavía deben crearse al realizar la tarea.

### Ejemplo de referencia
Login → perfil → bloque A → análisis → meta → plan → sesión → bloque B → reevaluación.

### Se acepta cuando
- [ ] Completar login → perfil → bloque A → análisis → meta → plan → sesión → bloque B comparable.
- [ ] Demostrar reevaluación con evidencia; metas o sesiones no inventan cambio de desempeño.
- [ ] Abrir incidencias de integración y cerrarlas antes del corte del viernes.

### Evidencia para revisar
Demo integrada con dos bloques y PRs revisados.

### Qué practicarás
Tadeo: integración y diagnóstico de fallos entre módulos; Roberto revisa la función de análisis. No exige trabajo acompañado.

**Cierre:** enlazar entrega/PR y comprobación; el revisor explica qué ejecutó y qué observó. Para código: integrado a main tras revisión. Para documentación: versión guardada y revisada. GitHub conserva el estado real; la planificación no marca esta tarea como realizada. Reparto actualizado con el Release del 12 de octubre; disponibilidad individual pendiente de confirmar.

## A26 · Calibrar heurísticas y documentar límites

**Responsable:** Roberto Santana Trujillo · **Revisor:** David Alonso Torres Guerrero

**Semana:** S4 · **Entrega interna:** 2026-11-06 · **Prioridad:** P1

**Requisitos:** RF07, RF08, RF09 · **Depende de:** [A17](https://github.com/Santana-R/adaptive-rl-coach/issues/17), [A18](https://github.com/Santana-R/adaptive-rl-coach/issues/18)

### Objetivo
Comprobar y documentar qué permiten concluir las heurísticas.

### Antes de empezar
Reglas A17 y planes A18 con casos reproducibles.

### Pasos sugeridos
1. Comparar resultados con casos revisados manualmente por modalidad.
2. Registrar cambios de umbral y la versión que los usa.
3. Explicar incertidumbre y límites sin presentar correlaciones como causalidad.

### Entrega concreta
docs/calibracion-reglas.md y casos reproducibles de la versión usada.

Las rutas de archivos son propuestas para organizar la implementación; todavía deben crearse al realizar la tarea.

### Ejemplo de referencia
Un cambio entre bloques es evidencia de una diferencia observada; no prueba por sí solo que el ejercicio la causó.

### Se acepta cuando
- [ ] Contrastar umbrales con casos manuales y contextos de modalidad.
- [ ] Conservar reglas y evidencia reproducibles; describir incertidumbre y límites sin afirmar causalidad.

### Evidencia para revisar
Tabla de casos y versión de reglas usada.

### Qué practicarás
Roberto: evaluar límites del diagnóstico además de implementarlo.

**Cierre:** enlazar entrega/PR y comprobación; el revisor explica qué ejecutó y qué observó. Para código: integrado a main tras revisión. Para documentación: versión guardada y revisada. GitHub conserva el estado real; la planificación no marca esta tarea como realizada. Reparto actualizado con el Release del 12 de octubre; disponibilidad individual pendiente de confirmar.

## A27 · Conectar plan y sesiones en la interfaz

**Responsable:** Luis Enrique Almaguer Castillo · **Revisor:** David Alonso Torres Guerrero

**Semana:** S4 · **Entrega interna:** 2026-11-06 · **Prioridad:** P0

**Requisitos:** RF09, RF10 · **Depende de:** [A18](https://github.com/Santana-R/adaptive-rl-coach/issues/18), [A20](https://github.com/Santana-R/adaptive-rl-coach/issues/20), [A21](https://github.com/Santana-R/adaptive-rl-coach/issues/21), [A24](https://github.com/Santana-R/adaptive-rl-coach/issues/24)

### Objetivo
Conectar planes y sesiones sin perder sus versiones.

### Antes de empezar
Generador A18, objetivos A20, sesiones A21 y versiones A24.

### Pasos sugeridos
1. Mostrar versión, recursos, instrucciones, duración y cobertura.
2. Conectar actualización de plan y consulta de versiones anteriores.
3. Conectar registro/corrección/eliminación de sesiones sobre la versión elegida.

### Entrega concreta
PR de Plan/Sesiones y recorrido con conservación de historial.

Las rutas de archivos son propuestas para organizar la implementación; todavía deben crearse al realizar la tarea.

### Ejemplo de referencia
Tras actualizar el plan a v2, una sesión de v1 sigue mostrando los ejercicios de v1.

### Se acepta cuando
- [ ] Mostrar versión, recursos, duración y estados de cobertura.
- [ ] Actualizar plan crea versión y permite consultar anteriores; sesiones se registran/corrigen/eliminan sobre su versión.

### Evidencia para revisar
Recorrido integrado y prueba de conservación de historial.

### Qué practicarás
Luis: interfaz con relaciones y versiones persistentes.

**Cierre:** enlazar entrega/PR y comprobación; el revisor explica qué ejecutó y qué observó. Para código: integrado a main tras revisión. Para documentación: versión guardada y revisada. GitHub conserva el estado real; la planificación no marca esta tarea como realizada. Reparto actualizado con el Release del 12 de octubre; disponibilidad individual pendiente de confirmar.

## A28 · Construir reportes y cerrar estados de pantallas

**Responsable:** Luis Enrique Almaguer Castillo · **Revisor:** Roberto Santana Trujillo

**Semana:** S4 · **Entrega interna:** 2026-11-06 · **Prioridad:** P1

**Requisitos:** RF11 · **Depende de:** [A19](https://github.com/Santana-R/adaptive-rl-coach/issues/19), [A22](https://github.com/Santana-R/adaptive-rl-coach/issues/22), [A31](https://github.com/Santana-R/adaptive-rl-coach/issues/31)

### Objetivo
Mostrar reportes comprensibles y completar los estados del recorrido del jugador.

### Antes de empezar
Análisis A19, reportes A22 e historial A31.

### Pasos sugeridos
1. Separar las gráficas por fuente: partidas, objetivos y rango declarado.
2. Añadir unidades, períodos, muestra y explicación de exclusiones.
3. Revisar todas las pantallas del jugador y sus estados de error/ausencia de datos.

### Entrega concreta
PR de reportes y capturas con datos completos y faltantes.

Las rutas de archivos son propuestas para organizar la implementación; todavía deben crearse al realizar la tarea.

### Ejemplo de referencia
Un valor ausente genera un hueco o mensaje, no una barra de cero; el rango se etiqueta como declarado.

### Se acepta cuando
- [ ] Separar gráficas de métricas, objetivos y rango declarado.
- [ ] Mostrar períodos, unidades, muestras y exclusiones; no dibujar null como cero.
- [ ] Completar todas las trece pantallas y navegación del ciclo del jugador.

### Evidencia para revisar
Demo de reportes con casos de ausencia de datos.

### Qué practicarás
Luis: visualización fiel de datos y comprensión de límites.

**Cierre:** enlazar entrega/PR y comprobación; el revisor explica qué ejecutó y qué observó. Para código: integrado a main tras revisión. Para documentación: versión guardada y revisada. GitHub conserva el estado real; la planificación no marca esta tarea como realizada. Reparto actualizado con el Release del 12 de octubre; disponibilidad individual pendiente de confirmar.

## A29 · Implementar administración de usuarios

**Responsable:** Omar Tadeo Gasca Deciga · **Revisor:** David Alonso Torres Guerrero

**Semana:** S4 · **Entrega interna:** 2026-11-04 · **Prioridad:** P0

**Requisitos:** RF12 · **Depende de:** [A08](https://github.com/Santana-R/adaptive-rl-coach/issues/8)

### Objetivo
Permitir al administrador consultar y cambiar el estado de usuarios.

### Antes de empezar
Autorización A08.

### Pasos sugeridos
1. Crear consulta y cambio activo/suspendido desde el servidor.
2. Comprobar rol y suspensión en cada operación protegida.
3. Probar suspensión/reactivación y acceso del jugador a endpoints de administración.

### Entrega concreta
PR de administración y matriz de rol/estado.

Las rutas de archivos son propuestas para organizar la implementación; todavía deben crearse al realizar la tarea.

### Ejemplo de referencia
Un jugador que envía directamente una petición de suspensión recibe acceso denegado.

### Se acepta cuando
- [ ] Administrador consulta usuarios y cambia activo/suspendido.
- [ ] Validar rol en servidor y acceso de usuarios suspendidos; no habilitar alta pública de administradores.

### Evidencia para revisar
Pruebas de rol, suspensión y reactivación.

### Qué practicarás
Tadeo: autorización en servidor y reglas de estado.

**Cierre:** enlazar entrega/PR y comprobación; el revisor explica qué ejecutó y qué observó. Para código: integrado a main tras revisión. Para documentación: versión guardada y revisada. GitHub conserva el estado real; la planificación no marca esta tarea como realizada. Reparto actualizado con el Release del 12 de octubre; disponibilidad individual pendiente de confirmar.

## A30 · Cerrar errores de API, privacidad y reintentos

**Responsable:** Omar Tadeo Gasca Deciga · **Revisor:** Roberto Santana Trujillo

**Semana:** S4 · **Entrega interna:** 2026-11-06 · **Prioridad:** P0

**Requisitos:** RF04, RF05 · **Depende de:** [A13](https://github.com/Santana-R/adaptive-rl-coach/issues/13), [A14](https://github.com/Santana-R/adaptive-rl-coach/issues/14)

### Objetivo
Cerrar los casos de fallo de ingestión y recuperación de bloques.

### Antes de empezar
Carga A13 y compatibilidad A14.

### Pasos sugeridos
1. Simular espera prolongada, fallo temporal, duplicado y lote parcial.
2. Comprobar privacidad y conservación de registros/estados.
3. Documentar cómo retomar un bloque y qué puede limpiar el sistema.

### Entrega concreta
Matriz de fallos, PR de arreglos y evidencia de recuperación.

Las rutas de archivos son propuestas para organizar la implementación; todavía deben crearse al realizar la tarea.

### Ejemplo de referencia
Una carga duplicada externa no se borra; se explica el conflicto y solo se limpian recursos propios permitidos.

### Se acepta cuando
- [ ] Probar espera prolongada, duplicados, caída temporal y carga parcial sin perder estados.
- [ ] Verificar cargas privadas y limpieza solo de archivos propios; documentar cómo retomar un bloque.

### Evidencia para revisar
Matriz de fallos y evidencia del manejo.

### Qué practicarás
Tadeo: recuperación de errores sin perder trazabilidad.

**Cierre:** enlazar entrega/PR y comprobación; el revisor explica qué ejecutó y qué observó. Para código: integrado a main tras revisión. Para documentación: versión guardada y revisada. GitHub conserva el estado real; la planificación no marca esta tarea como realizada. Reparto actualizado con el Release del 12 de octubre; disponibilidad individual pendiente de confirmar.

## A31 · Cerrar historial de objetivos y rango declarado

**Responsable:** David Alonso Torres Guerrero · **Revisor:** Roberto Santana Trujillo

**Semana:** S4 · **Entrega interna:** 2026-11-04 · **Prioridad:** P1

**Requisitos:** RF10, RF11 · **Depende de:** [A16](https://github.com/Santana-R/adaptive-rl-coach/issues/16), [A22](https://github.com/Santana-R/adaptive-rl-coach/issues/22), [A24](https://github.com/Santana-R/adaptive-rl-coach/issues/24)

### Objetivo
Conservar historial de metas y rango declarado de forma coherente con planes y reportes.

### Antes de empezar
Objetivos A16, reportes A22 y versiones A24.

### Pasos sugeridos
1. Registrar rango manual con fecha y modalidad.
2. Probar correcciones de metas/sesiones y cambios de catálogo.
3. Comprobar relaciones e historial y entregar datos al reporte A28.

### Entrega concreta
PR y casos de integridad antes/después.

Las rutas de archivos son propuestas para organizar la implementación; todavía deben crearse al realizar la tarea.

### Ejemplo de referencia
Una entrada de rango manual conserva fecha, modalidad y fuente declarada; no se presenta como MMR obtenido automáticamente.

### Se acepta cuando
- [ ] Registrar rango manual con fecha/modalidad y mostrar su fuente.
- [ ] Conservar historial ante corrección de metas/sesiones y actualización del catálogo.
- [ ] Verificar coherencia de plan, metas y reportes con las nuevas relaciones.

### Evidencia para revisar
Casos de integridad y reporte antes/después.

### Qué practicarás
David: historial temporal y consistencia entre recursos.

**Cierre:** enlazar entrega/PR y comprobación; el revisor explica qué ejecutó y qué observó. Para código: integrado a main tras revisión. Para documentación: versión guardada y revisada. GitHub conserva el estado real; la planificación no marca esta tarea como realizada. Reparto actualizado con el Release del 12 de octubre; disponibilidad individual pendiente de confirmar.

## A32 · Conectar panel admin y CRUD del catálogo

**Responsable:** David Alonso Torres Guerrero · **Revisor:** Luis Enrique Almaguer Castillo

**Semana:** S4 · **Entrega interna:** 2026-11-06 · **Prioridad:** P0

**Requisitos:** RF12 · **Depende de:** [A04](https://github.com/Santana-R/adaptive-rl-coach/issues/4), [A23](https://github.com/Santana-R/adaptive-rl-coach/issues/23), [A29](https://github.com/Santana-R/adaptive-rl-coach/issues/29)

### Objetivo
Conectar las tres pantallas administrativas a operaciones autorizadas.

### Antes de empezar
Base visual A04, catálogo A23 y usuarios A29.

### Pasos sugeridos
1. Construir panel, usuarios y ejercicios usando los componentes comunes.
2. Conectar CRUD y activo/suspendido con mensajes de éxito/error.
3. Probar administrador y jugador; pedir a Luis la revisión frontend por PR.

### Entrega concreta
PR y demo de panel, usuarios y ejercicios.

Las rutas de archivos son propuestas para organizar la implementación; todavía deben crearse al realizar la tarea.

### Ejemplo de referencia
Un administrador desactiva un ejercicio y lo ve actualizado; un jugador no puede ejecutar esa operación.

### Se acepta cuando
- [ ] Construir panel, usuarios y ejercicios con mensajes de éxito/error.
- [ ] CRUD de ejercicios y cambio de estado de usuarios funcionan con autorización del servidor.

### Evidencia para revisar
Demo de las tres pantallas administrativas.

### Qué practicarás
David: consumir su catálogo desde interfaz; Luis revisa usabilidad.

**Cierre:** enlazar entrega/PR y comprobación; el revisor explica qué ejecutó y qué observó. Para código: integrado a main tras revisión. Para documentación: versión guardada y revisada. GitHub conserva el estado real; la planificación no marca esta tarea como realizada. Reparto actualizado con el Release del 12 de octubre; disponibilidad individual pendiente de confirmar.

# S5 · Entrega preparada

Resultado de S5: Pruebas cerradas, despliegue reproducible, documentos y ensayo de demostración.

Corte interno: 2026-11-13. Reparto actualizado; confirmar disponibilidad en A01.

| Tarea | Responsable | Revisor | Fecha | Dependencias |
| --- | --- | --- | --- | --- |
| [A33](https://github.com/Santana-R/adaptive-rl-coach/issues/33) | Roberto | Tadeo | 2026-11-13 | A25, A26 |
| [A34](https://github.com/Santana-R/adaptive-rl-coach/issues/34) | Roberto | David | 2026-11-13 | A25, A26 |
| [A35](https://github.com/Santana-R/adaptive-rl-coach/issues/35) | Luis | David | 2026-11-13 | A27, A28, A32 |
| [A36](https://github.com/Santana-R/adaptive-rl-coach/issues/36) | Luis | Roberto | 2026-11-13 | A25, A35 |
| [A37](https://github.com/Santana-R/adaptive-rl-coach/issues/37) | Tadeo | David | 2026-11-13 | A29, A30, A32 |
| [A38](https://github.com/Santana-R/adaptive-rl-coach/issues/38) | Tadeo | Roberto | 2026-11-13 | A25, A37 |
| [A39](https://github.com/Santana-R/adaptive-rl-coach/issues/39) | David | Tadeo | 2026-11-13 | A27, A31, A32 |
| [A40](https://github.com/Santana-R/adaptive-rl-coach/issues/40) | David | Luis | 2026-11-13 | A33, A35, A38, A39 |

El avance y las casillas operativas se registran en cada issue de GitHub. Esta página es la guía de referencia.

## A33 · Cerrar regresión de métricas, reglas y planes

**Responsable:** Roberto Santana Trujillo · **Revisor:** Omar Tadeo Gasca Deciga

**Semana:** S5 · **Entrega interna:** 2026-11-13 · **Prioridad:** P0

**Requisitos:** RF06, RF07, RF08, RF09 · **Depende de:** [A25](https://github.com/Santana-R/adaptive-rl-coach/issues/25), [A26](https://github.com/Santana-R/adaptive-rl-coach/issues/26)

### Objetivo
Cerrar las regresiones del motor y de la función completa de análisis.

### Antes de empezar
Integración A25 y calibración A26.

### Pasos sugeridos
1. Ejecutar casos de normalización, comparación, reglas y planes.
2. Repetir el recorrido de A19 y comprobar que API/pantalla coinciden.
3. Corregir fallos del ciclo obligatorio y enlazar resultados al commit de entrega.

### Entrega concreta
Informe de regresión con versión, esperado/observado y evidencias.

Las rutas de archivos son propuestas para organizar la implementación; todavía deben crearse al realizar la tarea.

### Ejemplo de referencia
El ejemplo 25% → 30% debe seguir mostrando +5 puntos porcentuales en función, API y pantalla.

### Se acepta cuando
- [ ] Ejecutar casos de línea base, ponderación, comparación incompatible, null y plan parcial.
- [ ] Cero fallos abiertos que impidan el ciclo obligatorio; adjuntar resultados al commit de entrega.

### Evidencia para revisar
Informe de pruebas y commit final.

### Qué practicarás
Roberto: comprobar coherencia de una función de extremo a extremo.

**Cierre:** enlazar entrega/PR y comprobación; el revisor explica qué ejecutó y qué observó. Para código: integrado a main tras revisión. Para documentación: versión guardada y revisada. GitHub conserva el estado real; la planificación no marca esta tarea como realizada. Reparto actualizado con el Release del 12 de octubre; disponibilidad individual pendiente de confirmar.

## A34 · Preparar evidencia técnica para PROGSA

**Responsable:** Roberto Santana Trujillo · **Revisor:** David Alonso Torres Guerrero

**Semana:** S5 · **Entrega interna:** 2026-11-13 · **Prioridad:** P1

**Requisitos:** RF07, RF08, RF09 · **Depende de:** [A25](https://github.com/Santana-R/adaptive-rl-coach/issues/25), [A26](https://github.com/Santana-R/adaptive-rl-coach/issues/26)

### Objetivo
Preparar evidencia de adaptación y decisiones para PROGSA.

### Antes de empezar
Integración A25, límites A26 e instrucciones vigentes de PROGSA.

### Pasos sugeridos
1. Organizar problema, System Map, reglas, adaptación y ejemplos.
2. Separar prototipo Python y funciones realmente implementadas en la web.
3. Adaptar a la rúbrica confirmada y enlazar evidencia técnica reutilizable.

### Entrega concreta
Documento técnico en el formato que confirme el curso; ejemplos y referencias.

Las rutas de archivos son propuestas para organizar la implementación; todavía deben crearse al realizar la tarea.

### Ejemplo de referencia
Explicar cómo un nuevo bloque cambia el diagnóstico y crea otro plan, con sus límites.

### Se acepta cuando
- [ ] Documentar problema, decisiones, System Map, reglas, adaptación y limitaciones.
- [ ] Separar lo demostrado por el prototipo de lo implementado en la web; validar formato con las instrucciones de PROGSA cuando se confirmen.

### Evidencia para revisar
Documento técnico, ejemplos y referencias de evidencia.

### Qué practicarás
Roberto: comunicar decisiones técnicas con evidencia.

**Cierre:** enlazar entrega/PR y comprobación; el revisor explica qué ejecutó y qué observó. Para código: integrado a main tras revisión. Para documentación: versión guardada y revisada. GitHub conserva el estado real; la planificación no marca esta tarea como realizada. Reparto actualizado con el Release del 12 de octubre; disponibilidad individual pendiente de confirmar.

## A35 · Revisar uso, mensajes y accesibilidad

**Responsable:** Luis Enrique Almaguer Castillo · **Revisor:** David Alonso Torres Guerrero

**Semana:** S5 · **Entrega interna:** 2026-11-13 · **Prioridad:** P1

**Requisitos:** RF01–RF12 · **Depende de:** [A27](https://github.com/Santana-R/adaptive-rl-coach/issues/27), [A28](https://github.com/Santana-R/adaptive-rl-coach/issues/28), [A32](https://github.com/Santana-R/adaptive-rl-coach/issues/32)

### Objetivo
Eliminar obstáculos de uso en los recorridos de jugador y administrador.

### Antes de empezar
Pantallas A27, A28 y A32.

### Pasos sugeridos
1. Revisar teclado, foco, contraste, etiquetas y mensajes en escritorio.
2. Pedir al revisor que ejecute los recorridos con instrucciones y reporte hallazgos de forma asíncrona.
3. Corregir bloqueos y registrar capturas finales.

### Entrega concreta
Checklist de uso y PR de correcciones.

Las rutas de archivos son propuestas para organizar la implementación; todavía deben crearse al realizar la tarea.

### Ejemplo de referencia
Un error de formulario identifica el campo y conserva los valores que el jugador ya escribió.

### Se acepta cuando
- [ ] Revisar etiquetas, teclado, contraste, foco, errores y visualización en escritorio.
- [ ] Probar recorridos jugador/admin y ayuda con otra persona del equipo; cerrar bloqueos de uso.

### Evidencia para revisar
Lista de revisión y capturas finales.

### Qué practicarás
Luis: evaluar la interfaz con casos de uso completos.

**Cierre:** enlazar entrega/PR y comprobación; el revisor explica qué ejecutó y qué observó. Para código: integrado a main tras revisión. Para documentación: versión guardada y revisada. GitHub conserva el estado real; la planificación no marca esta tarea como realizada. Reparto actualizado con el Release del 12 de octubre; disponibilidad individual pendiente de confirmar.

## A36 · Preparar demo, capturas y ensayo

**Responsable:** Luis Enrique Almaguer Castillo · **Revisor:** Roberto Santana Trujillo

**Semana:** S5 · **Entrega interna:** 2026-11-13 · **Prioridad:** P1

**Requisitos:** RF01–RF12 · **Depende de:** [A25](https://github.com/Santana-R/adaptive-rl-coach/issues/25), [A35](https://github.com/Santana-R/adaptive-rl-coach/issues/35)

### Objetivo
Preparar una demostración reproducible y una explicación por integrante.

### Antes de empezar
Ciclo A25, revisión A35 y rúbrica que confirme el profesor.

### Pasos sugeridos
1. Escribir guion de ocho a diez minutos ajustable a la rúbrica.
2. Preparar capturas y datos de respaldo identificados como demostración.
3. Cada integrante prepara su explicación breve; cronometrar el recorrido en el formato que permita su disponibilidad.

### Entrega concreta
Guion, capturas y resultado del ensayo; no requiere reunión presencial.

Las rutas de archivos son propuestas para organizar la implementación; todavía deben crearse al realizar la tarea.

### Ejemplo de referencia
Mostrar primer bloque, diagnóstico, plan, sesión y comparación; cada dueño explica su pieza y una conexión con otra.

### Se acepta cuando
- [ ] Crear guion de demostración de ocho a diez minutos ajustable a la rúbrica.
- [ ] Cada integrante explica su módulo; preparar datos de respaldo marcados como demostración si la API no está disponible.

### Evidencia para revisar
Guion, capturas y ensayo cronometrado.

### Qué practicarás
Luis: explicar el recorrido del producto y coordinar la presentación.

**Cierre:** enlazar entrega/PR y comprobación; el revisor explica qué ejecutó y qué observó. Para código: integrado a main tras revisión. Para documentación: versión guardada y revisada. GitHub conserva el estado real; la planificación no marca esta tarea como realizada. Reparto actualizado con el Release del 12 de octubre; disponibilidad individual pendiente de confirmar.

## A37 · Verificar seguridad y privacidad funcional

**Responsable:** Omar Tadeo Gasca Deciga · **Revisor:** David Alonso Torres Guerrero

**Semana:** S5 · **Entrega interna:** 2026-11-13 · **Prioridad:** P0

**Requisitos:** RF01, RF02, RF05, RF12 · **Depende de:** [A29](https://github.com/Santana-R/adaptive-rl-coach/issues/29), [A30](https://github.com/Santana-R/adaptive-rl-coach/issues/30), [A32](https://github.com/Santana-R/adaptive-rl-coach/issues/32)

### Objetivo
Verificar permisos y privacidad en los endpoints reales.

### Antes de empezar
Administración A29, fallos A30 y panel A32.

### Pasos sugeridos
1. Probar sin sesión, jugador A/B, administrador y suspendido.
2. Comprobar validación de archivos/entradas y mensajes sin datos privados.
3. Verificar que secretos permanecen en entorno y que frontend/logs no los exponen.

### Entrega concreta
Matriz de autorización, comprobación de secretos y arreglos necesarios.

Las rutas de archivos son propuestas para organizar la implementación; todavía deben crearse al realizar la tarea.

### Ejemplo de referencia
Copiar un ID de bloque de otro jugador no permite ver ni editar su análisis.

### Se acepta cuando
- [ ] Comprobar acceso directo a endpoints con jugador A/B/admin/suspendido y sin token.
- [ ] Validar entradas, archivos y errores; credenciales solo en entorno del servidor y logs sin datos privados.

### Evidencia para revisar
Matriz de autorización y comprobación de secretos.

### Qué practicarás
Tadeo: probar permisos a través de peticiones directas.

**Cierre:** enlazar entrega/PR y comprobación; el revisor explica qué ejecutó y qué observó. Para código: integrado a main tras revisión. Para documentación: versión guardada y revisada. GitHub conserva el estado real; la planificación no marca esta tarea como realizada. Reparto actualizado con el Release del 12 de octubre; disponibilidad individual pendiente de confirmar.

## A38 · Preparar ejecución y despliegue reproducibles

**Responsable:** Omar Tadeo Gasca Deciga · **Revisor:** Roberto Santana Trujillo

**Semana:** S5 · **Entrega interna:** 2026-11-13 · **Prioridad:** P0

**Requisitos:** RF01–RF12 · **Depende de:** [A25](https://github.com/Santana-R/adaptive-rl-coach/issues/25), [A37](https://github.com/Santana-R/adaptive-rl-coach/issues/37)

### Objetivo
Permitir que otra persona ejecute y demuestre la versión de entrega.

### Antes de empezar
Integración A25 y comprobaciones A37.

### Pasos sugeridos
1. Documentar instalación, versiones, migraciones y variables de entorno reales.
2. Validar el entorno elegido, OAuth y conexiones; conservar ejecución local de respaldo.
3. Pedir al revisor ejecutar desde cero de forma asíncrona y crear tag después de validar.

### Entrega concreta
README reproducible, registro de ejecución y tag final.

Las rutas de archivos son propuestas para organizar la implementación; todavía deben crearse al realizar la tarea.

### Ejemplo de referencia
Un compañero sigue el README en una copia limpia y completa el recorrido principal sin indicaciones adicionales.

### Se acepta cuando
- [ ] Otra persona ejecuta el proyecto desde cero con README, migraciones y .env.example.
- [ ] Configurar entorno de entrega elegido por el equipo, validar OAuth y conexiones reales; conservar ruta de respaldo local.
- [ ] Crear tag de entrega solo después de comprobar la versión final.

### Evidencia para revisar
URL o ejecución documentada, smoke test y tag.

### Qué practicarás
Tadeo: reproducibilidad, entorno e integración operativa.

**Cierre:** enlazar entrega/PR y comprobación; el revisor explica qué ejecutó y qué observó. Para código: integrado a main tras revisión. Para documentación: versión guardada y revisada. GitHub conserva el estado real; la planificación no marca esta tarea como realizada. Reparto actualizado con el Release del 12 de octubre; disponibilidad individual pendiente de confirmar.

## A39 · Auditar los tres CRUD y la integridad

**Responsable:** David Alonso Torres Guerrero · **Revisor:** Omar Tadeo Gasca Deciga

**Semana:** S5 · **Entrega interna:** 2026-11-13 · **Prioridad:** P0

**Requisitos:** RF09, RF10, RF12 · **Depende de:** [A27](https://github.com/Santana-R/adaptive-rl-coach/issues/27), [A31](https://github.com/Santana-R/adaptive-rl-coach/issues/31), [A32](https://github.com/Santana-R/adaptive-rl-coach/issues/32)

### Objetivo
Comprobar los tres CRUD y la integridad después de cambios.

### Antes de empezar
Interfaz A27, historial A31 y catálogo/admin A32.

### Pasos sugeridos
1. Ejecutar alta, consulta, edición y eliminación/archivo permitidos de objetivos, sesiones y ejercicios.
2. Comprobar propiedad, relaciones y conservación de versiones.
3. Preparar seed limpio de demo y registrar cada resultado.

### Entrega concreta
Matriz CRUD y consultas de integridad.

Las rutas de archivos son propuestas para organizar la implementación; todavía deben crearse al realizar la tarea.

### Ejemplo de referencia
Eliminar una sesión recalcula entrenamiento; archivar una meta no borra el plan histórico.

### Se acepta cuando
- [ ] Ejecutar altas, consultas, cambios, archivo/eliminación permitida en objetivos, sesiones y ejercicios.
- [ ] Comprobar propietarios, relaciones y conservación de snapshots; preparar seed limpio de demo.

### Evidencia para revisar
Matriz CRUD y consultas de integridad.

### Qué practicarás
David: pruebas de persistencia frente a recorridos reales.

**Cierre:** enlazar entrega/PR y comprobación; el revisor explica qué ejecutó y qué observó. Para código: integrado a main tras revisión. Para documentación: versión guardada y revisada. GitHub conserva el estado real; la planificación no marca esta tarea como realizada. Reparto actualizado con el Release del 12 de octubre; disponibilidad individual pendiente de confirmar.

## A40 · Preparar entrega LBPWEB y checklist común

**Responsable:** David Alonso Torres Guerrero · **Revisor:** Luis Enrique Almaguer Castillo

**Semana:** S5 · **Entrega interna:** 2026-11-13 · **Prioridad:** P0

**Requisitos:** RF01–RF12 · **Depende de:** [A33](https://github.com/Santana-R/adaptive-rl-coach/issues/33), [A35](https://github.com/Santana-R/adaptive-rl-coach/issues/35), [A38](https://github.com/Santana-R/adaptive-rl-coach/issues/38), [A39](https://github.com/Santana-R/adaptive-rl-coach/issues/39)

### Objetivo
Preparar la entrega de LBPWEB y el checklist común con evidencia localizable.

### Antes de empezar
Regresión A33, uso A35, ejecución A38 e integridad A39.

### Pasos sugeridos
1. Vincular cada RF a pantalla, endpoint, datos, tarea y prueba.
2. Reunir instalación, ERD vigente, capturas y requisitos de formato confirmados.
3. Pedir revisión de los cuatro antes del corte y conservar una copia estable.

### Entrega concreta
Paquete/checklist de entrega y referencias por materia.

Las rutas de archivos son propuestas para organizar la implementación; todavía deben crearse al realizar la tarea.

### Ejemplo de referencia
RF03 apunta a la pantalla Carga, su endpoint y una evidencia de cinco replays reales.

### Se acepta cuando
- [ ] Vincular cada RF a pantalla, endpoint, datos, tarea y evidencia.
- [ ] Reunir instalación, ERD vigente, capturas y documentación requerida; confirmar fecha y rúbrica de ambas materias.
- [ ] Cerrar checklist en conjunto el viernes 13 y guardar una copia estable.

### Evidencia para revisar
Paquete de entrega y checklist firmado por los cuatro.

### Qué practicarás
David: trazabilidad entre requisito y evidencia.

**Cierre:** enlazar entrega/PR y comprobación; el revisor explica qué ejecutó y qué observó. Para código: integrado a main tras revisión. Para documentación: versión guardada y revisada. GitHub conserva el estado real; la planificación no marca esta tarea como realizada. Reparto actualizado con el Release del 12 de octubre; disponibilidad individual pendiente de confirmar.

# S6 · Reserva de entrega

Resultado de S6: Correcciones puntuales y entrega en la fecha que confirmen los profesores.

Corte interno: 2026-11-20. Reparto actualizado; confirmar disponibilidad en A01. Las cuatro tareas son condicionales.

| Tarea | Responsable | Revisor | Fecha | Dependencias |
| --- | --- | --- | --- | --- |
| [B01](https://github.com/Santana-R/adaptive-rl-coach/issues/41) | Roberto | Tadeo | 2026-11-20 | A33 |
| [B02](https://github.com/Santana-R/adaptive-rl-coach/issues/42) | Luis | David | 2026-11-20 | A36 |
| [B03](https://github.com/Santana-R/adaptive-rl-coach/issues/43) | Tadeo | Roberto | 2026-11-20 | A38 |
| [B04](https://github.com/Santana-R/adaptive-rl-coach/issues/44) | David | Luis | 2026-11-20 | A40 |

El avance y las casillas operativas se registran en cada issue de GitHub. Esta página es la guía de referencia.

## B01 · Corregir defectos de motor si aparecen

**Responsable:** Roberto Santana Trujillo · **Revisor:** Omar Tadeo Gasca Deciga

**Semana:** S6 · **Entrega interna:** 2026-11-20 · **Prioridad:** P1

**Requisitos:** RF07, RF08, RF09 · **Depende de:** [A33](https://github.com/Santana-R/adaptive-rl-coach/issues/33)

**Reserva condicional:** activar únicamente si surge la necesidad; no añade funciones.

### Objetivo
Corregir únicamente fallos del motor que aparezcan en la versión final.

### Antes de empezar
Regresión A33 y defecto confirmado.

### Pasos sugeridos
1. Registrar reproducción y resultado esperado.
2. Corregir el caso afectado y repetir su comprobación.
3. Adjuntar evidencia sin ampliar funciones.

### Entrega concreta
PR del arreglo y prueba del defecto.

Las rutas de archivos son propuestas para organizar la implementación; todavía deben crearse al realizar la tarea.

### Ejemplo de referencia
Si un empate altera el orden entre ejecuciones, corregirlo y repetir ese caso.

### Se acepta cuando
- [ ] Atender solo defectos de la versión de entrega; repetir los casos afectados.

### Evidencia para revisar
Issue y prueba del arreglo.

### Qué practicarás
Roberto: corrección localizada y regresión.

**Cierre:** enlazar entrega/PR y comprobación; el revisor explica qué ejecutó y qué observó. Para código: integrado a main tras revisión. Para documentación: versión guardada y revisada. GitHub conserva el estado real; la planificación no marca esta tarea como realizada. Reparto actualizado con el Release del 12 de octubre; disponibilidad individual pendiente de confirmar.

## B02 · Ajustar presentación y experiencia si se solicita

**Responsable:** Luis Enrique Almaguer Castillo · **Revisor:** David Alonso Torres Guerrero

**Semana:** S6 · **Entrega interna:** 2026-11-20 · **Prioridad:** P1

**Requisitos:** RF01–RF12 · **Depende de:** [A36](https://github.com/Santana-R/adaptive-rl-coach/issues/36)

**Reserva condicional:** activar únicamente si surge la necesidad; no añade funciones.

### Objetivo
Aplicar ajustes de presentación o uso solicitados para la entrega.

### Antes de empezar
Guion A36 y observación concreta del ensayo/profesor.

### Pasos sugeridos
1. Registrar el ajuste solicitado.
2. Modificar mensaje, vista o guion dentro del alcance.
3. Comprobarlo y guardar captura.

### Entrega concreta
Captura o guion actualizado y evidencia del ajuste.

Las rutas de archivos son propuestas para organizar la implementación; todavía deben crearse al realizar la tarea.

### Ejemplo de referencia
Aclarar el texto de una gráfica sin añadir otra función.

### Se acepta cuando
- [ ] Aplicar correcciones del ensayo o profesor sin ampliar el alcance.

### Evidencia para revisar
Capturas o guion actualizado.

### Qué practicarás
Luis: iteración de interfaz a partir de feedback.

**Cierre:** enlazar entrega/PR y comprobación; el revisor explica qué ejecutó y qué observó. Para código: integrado a main tras revisión. Para documentación: versión guardada y revisada. GitHub conserva el estado real; la planificación no marca esta tarea como realizada. Reparto actualizado con el Release del 12 de octubre; disponibilidad individual pendiente de confirmar.

## B03 · Verificar entorno antes de entregar

**Responsable:** Omar Tadeo Gasca Deciga · **Revisor:** Roberto Santana Trujillo

**Semana:** S6 · **Entrega interna:** 2026-11-20 · **Prioridad:** P1

**Requisitos:** RF01–RF12 · **Depende de:** [A38](https://github.com/Santana-R/adaptive-rl-coach/issues/38)

**Reserva condicional:** activar únicamente si surge la necesidad; no añade funciones.

### Objetivo
Comprobar el entorno en la fecha real de entrega.

### Antes de empezar
Ejecución A38 y fecha confirmada.

### Pasos sugeridos
1. Ejecutar el recorrido principal con la versión elegida.
2. Comprobar conexión y respaldo local.
3. Registrar resultado y atender únicamente bloqueos de entrega.

### Entrega concreta
Registro de comprobación rápida de la versión final.

Las rutas de archivos son propuestas para organizar la implementación; todavía deben crearse al realizar la tarea.

### Ejemplo de referencia
Abrir la app y verificar login, carga y consulta antes de presentarla.

### Se acepta cuando
- [ ] Repetir recorrido principal y respaldo local en la fecha confirmada.

### Evidencia para revisar
Smoke test de la versión de entrega.

### Qué practicarás
Tadeo: verificación operativa de entrega.

**Cierre:** enlazar entrega/PR y comprobación; el revisor explica qué ejecutó y qué observó. Para código: integrado a main tras revisión. Para documentación: versión guardada y revisada. GitHub conserva el estado real; la planificación no marca esta tarea como realizada. Reparto actualizado con el Release del 12 de octubre; disponibilidad individual pendiente de confirmar.

## B04 · Revisar paquete y confirmar recepción

**Responsable:** David Alonso Torres Guerrero · **Revisor:** Luis Enrique Almaguer Castillo

**Semana:** S6 · **Entrega interna:** 2026-11-20 · **Prioridad:** P1

**Requisitos:** RF01–RF12 · **Depende de:** [A40](https://github.com/Santana-R/adaptive-rl-coach/issues/40)

**Reserva condicional:** activar únicamente si surge la necesidad; no añade funciones.

### Objetivo
Comprobar el paquete final y registrar la entrega cuando ocurra.

### Antes de empezar
Checklist A40 y formato/fecha confirmados.

### Pasos sugeridos
1. Revisar nombres, enlaces, evidencias y formatos por materia.
2. Comprobar la copia estable y el acceso del destinatario cuando esté autorizado.
3. Guardar comprobante de recepción si existe.

### Entrega concreta
Checklist final y comprobante cuando se entregue.

Las rutas de archivos son propuestas para organizar la implementación; todavía deben crearse al realizar la tarea.

### Ejemplo de referencia
Un enlace de evidencia abre la versión utilizada en la presentación.

### Se acepta cuando
- [ ] Comprobar nombres, evidencias y formatos por materia; registrar la fecha real de entrega.

### Evidencia para revisar
Checklist y comprobante de entrega cuando exista.

### Qué practicarás
David: cierre documental comprobable.

**Cierre:** enlazar entrega/PR y comprobación; el revisor explica qué ejecutó y qué observó. Para código: integrado a main tras revisión. Para documentación: versión guardada y revisada. GitHub conserva el estado real; la planificación no marca esta tarea como realizada. Reparto actualizado con el Release del 12 de octubre; disponibilidad individual pendiente de confirmar.
