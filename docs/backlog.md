# Backlog · revisión del 13 de octubre

44 tareas existentes; estado operativo en GitHub. Base preparada y reparto aceptado; integración real pendiente.

# S1 · Base y viabilidad

Resultado de S1: Contrato, esquema revisado, navegación y prueba real de Ballchasing.

Corte interno: 2026-10-18. Entregas intermedias el jueves; cierre semanal conservado. Reparto aceptado por Roberto; informar bloqueos de disponibilidad/acceso.

| Tarea | Responsable | Revisor | Fecha | Dependencias para cerrar |
| --- | --- | --- | --- | --- |
| [A01](https://github.com/Santana-R/adaptive-rl-coach/issues/1) | Roberto | Tadeo | 2026-10-15 | — |
| [A02](https://github.com/Santana-R/adaptive-rl-coach/issues/2) | Roberto | David | 2026-10-18 | A01 |
| [A03](https://github.com/Santana-R/adaptive-rl-coach/issues/3) | Luis | Roberto | 2026-10-15 | — |
| [A04](https://github.com/Santana-R/adaptive-rl-coach/issues/4) | Luis | Tadeo | 2026-10-18 | A01, A03 |
| [A05](https://github.com/Santana-R/adaptive-rl-coach/issues/5) | Tadeo | Roberto | 2026-10-15 | — |
| [A06](https://github.com/Santana-R/adaptive-rl-coach/issues/6) | Tadeo | David | 2026-10-18 | A01, A05 |
| [A07](https://github.com/Santana-R/adaptive-rl-coach/issues/7) | David | Roberto | 2026-10-15 | — |
| [A08](https://github.com/Santana-R/adaptive-rl-coach/issues/8) | David | Tadeo | 2026-10-18 | A01, A07 |

El contrato y ejemplos permiten empezar en paralelo; los módulos reales deben conectarse antes del cierre. El estado operativo vive en GitHub. En S3 Roberto lleva A17/A18/A19; en S4 Tadeo A25/A29/A30. Conteos no equivalen a horas y no se añaden tareas para igualarlos.

## A01 · Revisar y validar la base del proyecto

**Responsable:** Roberto Santana Trujillo · **Revisor:** Omar Tadeo Gasca Deciga

**Semana:** S1 · **Entrega interna:** 2026-10-15 · **Prioridad:** P0

**Requisitos:** RF01–RF12 · **Dependencias para cerrar:** Ninguna

### Qué vas a conseguir
Entender la base ya preparada y registrar observaciones concretas para empezar a implementar.

### Empieza por aquí
Abrir docs/base-tecnica.md y leer el ejemplo del recorrido antes de tocar los otros documentos.

### Base que ya tienes
Base preparada en docs/base-tecnica.md, docs/contratos-api.md, docs/diccionario-datos.md, docs/flujo-pantallas.md y planning/trazabilidad-rf.csv. Roberto aceptó el reparto el 13 de octubre.

[docs/base-tecnica.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/base-tecnica.md) · [docs/contratos-api.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/contratos-api.md) · [docs/flujo-pantallas.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/flujo-pantallas.md)

### Dónde trabajar
docs/revision-base.md; editar la matriz o contrato solo si aparece un ajuste real.

### Pasos concretos
1. Leer primero docs/base-tecnica.md: recorrido, módulos, quién produce cada dato y primer paso por integrante.
2. Revisar los ejemplos de Carga y Análisis en docs/contratos-api.md; explicar a Tadeo qué recibe la pantalla y qué entrega el servidor.
3. Consultar la matriz ya completa para ubicar los doce requisitos y las trece pantallas. Registrar únicamente dudas, omisiones o cambios necesarios.
4. Dejar docs/revision-base.md con tres apartados: entendido, dudas concretas y ajustes. Tadeo revisa la explicación y la cobertura; anotar responsables de pendientes técnicos.

### Entrega y conexión con el equipo
docs/revision-base.md completado y revisado por Tadeo; la matriz y el contrato ya están preparados.

La base propuesta ya está disponible. Las validaciones A05/A07/A08 no bloquean la lectura ni obligan a cerrar toda la arquitectura.

### Ejemplo del resultado
Entendido: Luis envía cinco archivos al servidor; Tadeo devuelve block_id y estado. Duda: la identidad Epic aún debe comprobarse en A05. Ajuste: actualizar el mapeo cuando exista una respuesta real.

### Cómo comprobarlo
Explicar Carga y Análisis a Tadeo y guardar su observación; las pruebas reales de API siguen en A05.

### Se acepta cuando
- [ ] Roberto explica el recorrido perfil → cinco replays → métricas → análisis → plan → sesiones, usando los ejemplos preparados.
- [ ] Roberto y Tadeo revisan el mapa de doce RF y trece pantallas y registran observaciones o indican que no encontraron cambios.
- [ ] docs/revision-base.md distingue base propuesta de integración real; cada duda técnica apunta a A05, A07, A08 u otra tarea responsable.
- [ ] Tadeo deja la comprobación realizada y su resultado. La revisión inicial puede cerrarse con pendientes técnicos localizados; esos pendientes se validan en sus tareas.

### Evidencia para revisar
Nota de revisión guardada, observaciones concretas y comprobación de Tadeo.

### Qué practicarás
Comprender una especificación preparada, seguir datos entre módulos y explicar decisiones antes de programar.

**Cierre:** enlazar entrega/PR y esperado/observado. El revisor explica qué comprobó. Código: integrado tras revisión; documentación: guardada y revisada. Las rutas de aplicación indicadas son propuestas y se crean durante la implementación. La base, mapa y fixtures enlazados sí están preparados. Los ejemplos sintéticos no acreditan integración real. Reparto aceptado por Roberto el 13 de octubre; informar disponibilidad/acceso si bloquean el compromiso.

[Empieza aquí · Guía del equipo](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f)

## A02 · Preparar casos del motor explicable

**Responsable:** Roberto Santana Trujillo · **Revisor:** David Alonso Torres Guerrero

**Semana:** S1 · **Entrega interna:** 2026-10-18 · **Prioridad:** P0

**Requisitos:** RF07, RF08, RF09 · **Dependencias para cerrar:** [A01](https://github.com/Santana-R/adaptive-rl-coach/issues/1)

### Qué vas a conseguir
Definir datos de prueba y respuestas esperadas antes de programar las reglas.

### Empieza por aquí
Abrir tests/fixtures/analisis/comparable.json y calcular los porcentajes indicados.

### Base que ya tienes
Cinco casos iniciales ya escritos en tests/fixtures/analisis y docs/casos-motor.md; contrato preparado y prototipo Python como referencia de heurísticas.

[docs/base-tecnica.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/base-tecnica.md) · [docs/contratos-api.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/contratos-api.md) · [docs/flujo-pantallas.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/flujo-pantallas.md)

### Dónde trabajar
tests/fixtures/analisis y docs/casos-motor.md.

### Pasos concretos
1. Revisar los cinco JSON preparados y comprobar a mano 2/8 = 25%, 3/10 = 30% y cambio +5 puntos porcentuales.
2. Contrastar los umbrales reales del prototipo: anotar métrica, valor, unidad y limitación; dejar pendiente lo que no exista.
3. Completar resultados esperados de prioridades y desempates con la regla real; David revisa los casos antes de usarlos en A09/A10/A17.

### Entrega y conexión con el equipo
tests/fixtures/analisis/*.json revisados y docs/casos-motor.md completado con los umbrales reales del prototipo.

Se puede revisar los casos mientras A01 se revisa; los ajustes del contrato se incorporan antes de terminar.

### Ejemplo del resultado
Mismo jugador, modalidad y tipo; bloque A: 8 tiros/2 goles; B: 10 tiros/3 goles. Porcentaje: 25% → 30%; cambio +5 puntos porcentuales. Son datos inventados para una prueba.

### Cómo comprobarlo
Los casos identifican entrada, resultado esperado y si el dato es sintético; los umbrales se contrastan con el prototipo.

### Se acepta cuando
- [ ] Revisar y completar los casos preparados de primer bloque, comparación válida/no comparable, faltantes y empates.
- [ ] Documentar umbrales del prototipo como heurísticas pendientes de calibrar; definir máximo tres prioridades y evidencia por regla.

### Evidencia para revisar
Fixtures sin datos personales y resultados esperados.

### Qué practicarás
Traducir una regla a un caso verificable; distinguir datos de prueba y datos reales.

**Cierre:** enlazar entrega/PR y esperado/observado. El revisor explica qué comprobó. Código: integrado tras revisión; documentación: guardada y revisada. Las rutas de aplicación indicadas son propuestas y se crean durante la implementación. La base, mapa y fixtures enlazados sí están preparados. Los ejemplos sintéticos no acreditan integración real. Reparto aceptado por Roberto el 13 de octubre; informar disponibilidad/acceso si bloquean el compromiso.

[Empieza aquí · Guía del equipo](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f)

## A03 · Validar el flujo preparado y los estados de pantallas

**Responsable:** Luis Enrique Almaguer Castillo · **Revisor:** Roberto Santana Trujillo

**Semana:** S1 · **Entrega interna:** 2026-10-15 · **Prioridad:** P0

**Requisitos:** RF01–RF12 · **Dependencias para cerrar:** Ninguna

### Qué vas a conseguir
Convertir los bosquejos de la Fase 1 en un recorrido navegable para jugador y administrador.

### Empieza por aquí
Abrir docs/flujo-pantallas.md y marcar qué control lleva de Carga a Análisis.

### Base que ya tienes
docs/flujo-pantallas.md contiene las trece pantallas y estados iniciales; contrastar con los bosquejos de la Fase 1.

[docs/base-tecnica.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/base-tecnica.md) · [docs/contratos-api.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/contratos-api.md) · [docs/flujo-pantallas.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/flujo-pantallas.md)

### Dónde trabajar
docs/flujo-pantallas.md y los bosquejos actuales.

### Pasos concretos
1. Leer la tabla preparada y recorrer Registro → Perfil → Carga → Análisis → Plan → Sesiones.
2. Contrastar el recorrido del jugador y administrador con los bosquejos; completar controles o mensajes faltantes en la misma tabla.
3. Anotar observaciones y comprobar con Roberto la navegación y los estados antes de construir A04.

### Entrega y conexión con el equipo
docs/flujo-pantallas.md revisado y observaciones/capturas de los bosquejos.

La tabla preparada permite revisar el flujo sin esperar código ni una nueva matriz.

### Ejemplo del resultado
Carga → procesando → análisis; si falla un replay, mostrar cuál falló y la acción disponible.

### Cómo comprobarlo
Recorrer las trece pantallas, incluido usuario sin historial y jugador sin acceso a administración.

### Se acepta cuando
- [ ] Revisar las trece pantallas y sus enlaces, preservando las funciones obligatorias de la Fase 1.
- [ ] Validar carga, error, vacío, comparación no disponible y plan parcial/vacío usando los estados preparados.

### Evidencia para revisar
Flujo y lista de estados vinculados a cada pantalla.

### Qué practicarás
Luis: conectar diseño de navegación con estados reales del sistema.

**Cierre:** enlazar entrega/PR y esperado/observado. El revisor explica qué comprobó. Código: integrado tras revisión; documentación: guardada y revisada. Las rutas de aplicación indicadas son propuestas y se crean durante la implementación. La base, mapa y fixtures enlazados sí están preparados. Los ejemplos sintéticos no acreditan integración real. Reparto aceptado por Roberto el 13 de octubre; informar disponibilidad/acceso si bloquean el compromiso.

[Empieza aquí · Guía del equipo](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f)

## A04 · Crear base visual y navegación

**Responsable:** Luis Enrique Almaguer Castillo · **Revisor:** Omar Tadeo Gasca Deciga

**Semana:** S1 · **Entrega interna:** 2026-10-18 · **Prioridad:** P1

**Requisitos:** RF01, RF02, RF12 · **Dependencias para cerrar:** [A01](https://github.com/Santana-R/adaptive-rl-coach/issues/1), [A03](https://github.com/Santana-R/adaptive-rl-coach/issues/3)

### Qué vas a conseguir
Crear la base de interfaz sobre la que se conectarán las funciones posteriores.

### Empieza por aquí
Crear public/index.html con navegación a Inicio, Acerca y Ayuda, usando la tabla preparada.

### Base que ya tienes
Flujo de A03 y contrato de A01.

[docs/base-tecnica.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/base-tecnica.md) · [docs/contratos-api.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/contratos-api.md) · [docs/flujo-pantallas.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/flujo-pantallas.md)

### Dónde trabajar
public/*.html, public/css/app.css y public/js/navigation.js; estructura propuesta en docs/base-tecnica.md.

### Pasos concretos
1. Preparar HTML/CSS/Bootstrap y JavaScript/jQuery con una estructura común.
2. Crear navegación y las páginas Inicio, Acerca y Ayuda, además de contenedores para las demás vistas.
3. Separar menús por rol y comprobar enlaces, foco y mensajes en escritorio.

### Entrega y conexión con el equipo
PR con base visual y recorrido reproducible; actualizar instrucciones de ejecución cuando existan.

Puede construir componentes con estados de ejemplo; conectar datos reales en A11/A12/A19/A27/A28.

### Ejemplo del resultado
Un jugador puede llegar a Carga desde su menú; no se le presenta el menú de administración.

### Cómo comprobarlo
Abrir cada enlace y comprobar que no termina en una página inexistente; distinguir menú del jugador y administrador.

### Se acepta cuando
- [ ] Preparar HTML, CSS, Bootstrap, JavaScript y jQuery con rutas o vistas coherentes.
- [ ] Inicio, Acerca y Ayuda explican el ciclo de cinco replays y las limitaciones; separar navegación de jugador y administrador.

### Evidencia para revisar
PR y recorrido de navegación en escritorio.

### Qué practicarás
Luis: estructura frontend, eventos y componentes reutilizables.

**Cierre:** enlazar entrega/PR y esperado/observado. El revisor explica qué comprobó. Código: integrado tras revisión; documentación: guardada y revisada. Las rutas de aplicación indicadas son propuestas y se crean durante la implementación. La base, mapa y fixtures enlazados sí están preparados. Los ejemplos sintéticos no acreditan integración real. Reparto aceptado por Roberto el 13 de octubre; informar disponibilidad/acceso si bloquean el compromiso.

[Empieza aquí · Guía del equipo](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f)

## A05 · Validar Ballchasing con una prueba real

**Responsable:** Omar Tadeo Gasca Deciga · **Revisor:** Roberto Santana Trujillo

**Semana:** S1 · **Entrega interna:** 2026-10-15 · **Prioridad:** P0

**Requisitos:** RF03, RF04, RF05, RF06 · **Dependencias para cerrar:** Ninguna

### Qué vas a conseguir
Comprobar que Ballchasing permite obtener los datos necesarios con un replay real autorizado.

### Empieza por aquí
Leer el apartado Ballchasing del contrato; comprobar con una cuenta autorizada el endpoint de ping y un replay propio.

### Base que ya tienes
Cuenta/token válido, replay autorizado y documentación oficial vigente de Ballchasing.

[docs/base-tecnica.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/base-tecnica.md) · [docs/contratos-api.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/contratos-api.md) · [docs/flujo-pantallas.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/flujo-pantallas.md)

### Dónde trabajar
docs/viabilidad-ballchasing.md y fixtures saneados del proveedor; nunca guardar token ni replay privado en GitHub.

### Pasos concretos
1. Consultar permisos y límites actuales; hacer una carga privada de prueba desde el servidor.
2. Consultar procesamiento e identificar al jugador y las métricas devueltas.
3. Registrar respuesta anonimizada, errores y estrategia de reintento; comunicar brechas de viabilidad.

### Entrega y conexión con el equipo
scripts/spike-ballchasing.* y docs/viabilidad-ballchasing.md, sin tokens ni replays publicados.

Entregar a Roberto y David el mapeo observado y los límites de la cuenta el jueves 15. Una duda sobre identidad/unidades se documenta con ejemplo saneado.

### Ejemplo del resultado
Guardar un ejemplo anonimizado de estado pendiente y otro listo, indicando el campo que identifica al jugador.

### Cómo comprobarlo
Registrar HTTP, estado, campos del jugador elegido, identidad y privacidad observada; un fixture no sustituye esta evidencia.

### Se acepta cuando
- [ ] Comprobar con un replay autorizado la carga privada, consulta de procesamiento, respuesta de jugador y métricas disponibles.
- [ ] Documentar límites, permisos, duplicados, errores transitorios y estrategia de espera/reintento según la API vigente.
- [ ] Guardar token solo en servidor; no publicar archivos ni credenciales.

### Evidencia para revisar
Spike reproducible, respuesta anonimizada y decisión de viabilidad.

### Qué practicarás
Tadeo: explorar una API externa y validar supuestos antes de construir.

**Cierre:** enlazar entrega/PR y esperado/observado. El revisor explica qué comprobó. Código: integrado tras revisión; documentación: guardada y revisada. Las rutas de aplicación indicadas son propuestas y se crean durante la implementación. La base, mapa y fixtures enlazados sí están preparados. Los ejemplos sintéticos no acreditan integración real. Reparto aceptado por Roberto el 13 de octubre; informar disponibilidad/acceso si bloquean el compromiso.

[Empieza aquí · Guía del equipo](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f)

## A06 · Preparar servidor y adaptador de ingestión

**Responsable:** Omar Tadeo Gasca Deciga · **Revisor:** David Alonso Torres Guerrero

**Semana:** S1 · **Entrega interna:** 2026-10-18 · **Prioridad:** P0

**Requisitos:** RF03, RF05 · **Dependencias para cerrar:** [A01](https://github.com/Santana-R/adaptive-rl-coach/issues/1), [A05](https://github.com/Santana-R/adaptive-rl-coach/issues/5)

### Qué vas a conseguir
Dejar un servidor ejecutable y una interfaz común para cargar y consultar replays.

### Empieza por aquí
Crear src/app.js con Express y GET /health que devuelva estado ok.

### Base que ya tienes
Contrato de A01 y resultados reales de A05.

[docs/base-tecnica.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/base-tecnica.md) · [docs/contratos-api.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/contratos-api.md) · [docs/flujo-pantallas.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/flujo-pantallas.md)

### Dónde trabajar
src/app.js, src/routes, src/middleware y src/services/ballchasing.js.

### Pasos concretos
1. Crear Express y documentar versiones y comandos reales.
2. Añadir .env.example con nombres de variables sin secretos y los estados de replay/bloque acordados.
3. Crear el adaptador de ingestión y un modo de datos de prueba identificado; comprobar endpoints básicos.

### Entrega y conexión con el equipo
PR del servidor, .env.example y docs/estados-procesamiento.md.

El contrato define la interfaz; cerrar la conexión real después de A05. El servidor común lo mantiene Tadeo.

### Ejemplo del resultado
Un endpoint de prueba devuelve estado pending y después ready con el mismo identificador.

### Cómo comprobarlo
Arrancar el servidor y consultar /health; simular pendiente, error y duplicado del adaptador sin exponer el token.

### Se acepta cuando
- [ ] Crear base Node.js LTS/Express y configuración de entorno con .env.example.
- [ ] Definir estados por replay y bloque; el adaptador permite datos de prueba claramente identificados mientras se conecta la API.

### Evidencia para revisar
PR del servidor, contrato de estados y prueba básica de endpoints.

### Qué practicarás
Tadeo: servidor, configuración y separación entre integración externa y lógica propia.

**Cierre:** enlazar entrega/PR y esperado/observado. El revisor explica qué comprobó. Código: integrado tras revisión; documentación: guardada y revisada. Las rutas de aplicación indicadas son propuestas y se crean durante la implementación. La base, mapa y fixtures enlazados sí están preparados. Los ejemplos sintéticos no acreditan integración real. Reparto aceptado por Roberto el 13 de octubre; informar disponibilidad/acceso si bloquean el compromiso.

[Empieza aquí · Guía del equipo](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f)

## A07 · Validar el modelo de datos preparado

**Responsable:** David Alonso Torres Guerrero · **Revisor:** Roberto Santana Trujillo

**Semana:** S1 · **Entrega interna:** 2026-10-15 · **Prioridad:** P0

**Requisitos:** RF01–RF12 · **Dependencias para cerrar:** Ninguna

### Qué vas a conseguir
Completar el diseño de datos antes de implementar funciones que necesitan historial.

### Empieza por aquí
Leer la fila planes/versiones/sesiones en docs/diccionario-datos.md y contrastarla con el ERD actual.

### Base que ya tienes
docs/diccionario-datos.md propone las entidades y relaciones a partir de las ocho tablas iniciales; docs/contratos-api.md define qué consume cada módulo.

[docs/base-tecnica.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/base-tecnica.md) · [docs/contratos-api.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/contratos-api.md) · [docs/flujo-pantallas.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/flujo-pantallas.md)

### Dónde trabajar
docs/diccionario-datos.md y propuesta de migraciones de Supabase.

### Pasos concretos
1. Comparar las ocho tablas del ERD con las entidades del diccionario preparado; identificar nombres equivalentes y diferencias.
2. Comprobar propietario, claves y relaciones con los ejemplos de bloque, versión de plan y sesión. Registrar ajustes en el diccionario.
3. Preparar el diseño/migraciones que implementarán A08/A15/A24; revisar con Roberto antes de cambiar el ERD.

### Entrega y conexión con el equipo
docs/diccionario-datos.md validado, lista de ajustes y propuesta de migraciones.

David entrega el diccionario validado el jueves 15; la implementación de tablas y políticas corresponde a A08/A15/A24.

### Ejemplo del resultado
Una sesión necesita apuntar a la versión exacta del plan con la que se entrenó.

### Cómo comprobarlo
Una sesión de la versión 1 sigue apuntando a ella después de crear la versión 2; todos los datos privados tienen propietario.

### Se acepta cuando
- [ ] Revisar las ocho entidades originales y las propuestas de sesiones, rango e historial/evidencia de versiones.
- [ ] Comprobar que una sesión apunta a la versión exacta y que sus ejercicios/objetivos conservan snapshots.
- [ ] Definir claves, propietarios, integridad, índices y permisos a partir de la propuesta; registrar cambios antes de implementarlos.

### Evidencia para revisar
Diccionario y propuesta de migraciones; enlace al ERD actualizado existente.

### Qué practicarás
David: diseñar persistencia trazable y explicar por qué existe cada relación.

**Cierre:** enlazar entrega/PR y esperado/observado. El revisor explica qué comprobó. Código: integrado tras revisión; documentación: guardada y revisada. Las rutas de aplicación indicadas son propuestas y se crean durante la implementación. La base, mapa y fixtures enlazados sí están preparados. Los ejemplos sintéticos no acreditan integración real. Reparto aceptado por Roberto el 13 de octubre; informar disponibilidad/acceso si bloquean el compromiso.

[Empieza aquí · Guía del equipo](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f)

## A08 · Preparar autenticación y permisos de datos

**Responsable:** David Alonso Torres Guerrero · **Revisor:** Omar Tadeo Gasca Deciga

**Semana:** S1 · **Entrega interna:** 2026-10-18 · **Prioridad:** P0

**Requisitos:** RF01, RF02, RF12 · **Dependencias para cerrar:** [A01](https://github.com/Santana-R/adaptive-rl-coach/issues/1), [A07](https://github.com/Santana-R/adaptive-rl-coach/issues/7)

### Qué vas a conseguir
Permitir acceso por correo y Google y proteger los recursos de cada jugador.

### Empieza por aquí
Seguir los enlaces oficiales de Auth/RLS del contrato y configurar un entorno de desarrollo con usuario jugador.

### Base que ya tienes
Modelo de A07, contrato de A01 y configuración de Auth documentada.

[docs/base-tecnica.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/base-tecnica.md) · [docs/contratos-api.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/contratos-api.md) · [docs/flujo-pantallas.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/flujo-pantallas.md)

### Dónde trabajar
Supabase Auth, políticas/migraciones y src/middleware/auth.js; guardar solo nombres de variables en .env.example.

### Pasos concretos
1. Implementar registro, acceso y salida; configurar Google según la documentación vigente.
2. Integrar validación de identidad en Express y propiedad de los datos.
3. Probar dos jugadores, administrador y suspensión; documentar el procedimiento de prueba.

### Entrega y conexión con el equipo
PR de autenticación, configuración sin secretos y matriz de permisos.

Usar el diccionario como propuesta mientras A07 revisa relaciones; terminar con permisos reales verificados.

### Ejemplo del resultado
Jugador A intenta consultar un bloque de B: acceso denegado; el registro público no crea administradores.

### Cómo comprobarlo
Sin token: 401. Jugador A no lee datos de B. El formulario público no crea administradores. Suspensión se comprueba en servidor.

### Se acepta cuando
- [ ] Implementar registro por correo y Google, inicio y cierre de sesión con Supabase Auth.
- [ ] El registro público nunca asigna administrador; usuario A no lee ni cambia datos de B y suspensión impide acceso según el contrato.
- [ ] Definir validación del token en Express y política de propiedad por recurso.

### Evidencia para revisar
PR y evidencia con dos jugadores y un administrador.

### Qué practicarás
David: distinguir inicio de sesión, autorización y propiedad de datos.

**Cierre:** enlazar entrega/PR y esperado/observado. El revisor explica qué comprobó. Código: integrado tras revisión; documentación: guardada y revisada. Las rutas de aplicación indicadas son propuestas y se crean durante la implementación. La base, mapa y fixtures enlazados sí están preparados. Los ejemplos sintéticos no acreditan integración real. Reparto aceptado por Roberto el 13 de octubre; informar disponibilidad/acceso si bloquean el compromiso.

[Empieza aquí · Guía del equipo](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f)

# S2 · Primer bloque real

Resultado de S2: Jugador autenticado carga cinco replays privados y obtiene métricas válidas.

Corte interno: 2026-10-25. Entregas intermedias el jueves; cierre semanal conservado. Reparto aceptado por Roberto; informar bloqueos de disponibilidad/acceso.

| Tarea | Responsable | Revisor | Fecha | Dependencias para cerrar |
| --- | --- | --- | --- | --- |
| [A09](https://github.com/Santana-R/adaptive-rl-coach/issues/9) | Roberto | Tadeo | 2026-10-25 | A02, A05, A14 |
| [A10](https://github.com/Santana-R/adaptive-rl-coach/issues/10) | Roberto | David | 2026-10-25 | A09, A15 |
| [A11](https://github.com/Santana-R/adaptive-rl-coach/issues/11) | Luis | Tadeo | 2026-10-25 | A04, A13 |
| [A12](https://github.com/Santana-R/adaptive-rl-coach/issues/12) | Luis | David | 2026-10-25 | A04, A08 |
| [A13](https://github.com/Santana-R/adaptive-rl-coach/issues/13) | Tadeo | David | 2026-10-22 | A06, A08, A15 |
| [A14](https://github.com/Santana-R/adaptive-rl-coach/issues/14) | Tadeo | Roberto | 2026-10-22 | A05, A06, A08 |
| [A15](https://github.com/Santana-R/adaptive-rl-coach/issues/15) | David | Tadeo | 2026-10-22 | A07, A08 |
| [A16](https://github.com/Santana-R/adaptive-rl-coach/issues/16) | David | Roberto | 2026-10-25 | A07, A08 |

El contrato y ejemplos permiten empezar en paralelo; los módulos reales deben conectarse antes del cierre. El estado operativo vive en GitHub. En S3 Roberto lleva A17/A18/A19; en S4 Tadeo A25/A29/A30. Conteos no equivalen a horas y no se añaden tareas para igualarlos.

## A09 · Normalizar métricas de cinco replays

**Responsable:** Roberto Santana Trujillo · **Revisor:** Omar Tadeo Gasca Deciga

**Semana:** S2 · **Entrega interna:** 2026-10-25 · **Prioridad:** P0

**Requisitos:** RF06 · **Dependencias para cerrar:** [A02](https://github.com/Santana-R/adaptive-rl-coach/issues/2), [A05](https://github.com/Santana-R/adaptive-rl-coach/issues/5), [A14](https://github.com/Santana-R/adaptive-rl-coach/issues/14)

### Qué vas a conseguir
Producir métricas correctas para el jugador a partir de cinco replays válidos.

### Empieza por aquí
Abrir el fixture comparable y escribir normalizeBlock(replays, playerIdentity) sobre los datos del jugador seleccionado.

### Base que ya tienes
Casos A02, datos disponibles A05 y extracción compatible A14.

[docs/base-tecnica.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/base-tecnica.md) · [docs/contratos-api.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/contratos-api.md) · [docs/flujo-pantallas.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/flujo-pantallas.md)

### Dónde trabajar
src/domain/metrics.js y pruebas de normalización.

### Pasos concretos
1. Localizar al jugador de interés en cada replay y conservar trazabilidad.
2. Documentar fórmula, unidad y denominador de cada métrica; mantener null si falta información.
3. Comparar resultados de la función con cálculos manuales y registrar exclusiones.

### Entrega y conexión con el equipo
PR de normalización, docs/metricas.md y casos calculados a mano.

A14 entrega identificación/contexto y A15 persistencia; fixtures permiten empezar. Validar contra cinco replays reales antes de cerrar.

### Ejemplo del resultado
2 goles/8 tiros y 3 goles/12 tiros se agregan como 5/20 = 25%; no se promedian porcentajes sin sus denominadores.

### Cómo comprobarlo
Sumar goles y tiros antes de dividir; 2/8 da 25%, un denominador 0 produce null con motivo. Conservar cobertura y unidades.

### Se acepta cuando
- [ ] Extraer exclusivamente al jugador identificado en cada replay.
- [ ] Agregar con denominadores y unidades explícitos; porcentajes ponderados por totales, null para datos ausentes y exclusiones visibles.

### Evidencia para revisar
Casos calculados a mano y resultados coincidentes.

### Qué practicarás
Roberto: transformación de datos, funciones y pruebas numéricas.

**Cierre:** enlazar entrega/PR y esperado/observado. El revisor explica qué comprobó. Código: integrado tras revisión; documentación: guardada y revisada. Las rutas de aplicación indicadas son propuestas y se crean durante la implementación. La base, mapa y fixtures enlazados sí están preparados. Los ejemplos sintéticos no acreditan integración real. Reparto aceptado por Roberto el 13 de octubre; informar disponibilidad/acceso si bloquean el compromiso.

[Empieza aquí · Guía del equipo](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f)

## A10 · Resolver línea base y comparación válida

**Responsable:** Roberto Santana Trujillo · **Revisor:** David Alonso Torres Guerrero

**Semana:** S2 · **Entrega interna:** 2026-10-25 · **Prioridad:** P0

**Requisitos:** RF07 · **Dependencias para cerrar:** [A09](https://github.com/Santana-R/adaptive-rl-coach/issues/9), [A15](https://github.com/Santana-R/adaptive-rl-coach/issues/15)

### Qué vas a conseguir
Decidir cuándo comparar dos bloques y explicar claramente el resultado.

### Empieza por aquí
Escribir compareBlocks(baseline, current) usando compatible, incompatible y primer-bloque de los fixtures.

### Base que ya tienes
Métricas A09 y bloques persistidos A15.

[docs/base-tecnica.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/base-tecnica.md) · [docs/contratos-api.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/contratos-api.md) · [docs/flujo-pantallas.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/flujo-pantallas.md)

### Dónde trabajar
src/domain/comparison.js y pruebas del motor.

### Pasos concretos
1. Definir línea base si solo existe un bloque válido.
2. Validar identidad, modalidad, tipo, cronología y equivalencia de medición.
3. Calcular cambios por métrica y devolver un motivo verificable cuando la comparación no aplica.

### Entrega y conexión con el equipo
PR de comparación y pruebas de línea base, incompatibilidad y cambios.

Se puede escribir la función pura con JSON; verificar después con métricas A09 y bloques guardados A15.

### Ejemplo del resultado
Un bloque ranked 2v2 no se compara con casual 3v3; se conserva y muestra el motivo.

### Cómo comprobarlo
Mismo contexto posterior: delta 5 pp en el ejemplo. Contexto distinto: no comparable con motivo. Sin anterior: línea base.

### Se acepta cuando
- [ ] Primer bloque se marca como línea base.
- [ ] Comparar solo misma identidad, modalidad, tipo casual/ranked y medición equivalente; el seguimiento debe ser posterior.
- [ ] Bloques no comparables conservan motivo y no producen una mejora inventada.

### Evidencia para revisar
Pruebas de cronología, incompatibilidad y comparación válida.

### Qué practicarás
Roberto: condiciones, fechas y un contrato que después consumirá su pantalla A19.

**Cierre:** enlazar entrega/PR y esperado/observado. El revisor explica qué comprobó. Código: integrado tras revisión; documentación: guardada y revisada. Las rutas de aplicación indicadas son propuestas y se crean durante la implementación. La base, mapa y fixtures enlazados sí están preparados. Los ejemplos sintéticos no acreditan integración real. Reparto aceptado por Roberto el 13 de octubre; informar disponibilidad/acceso si bloquean el compromiso.

[Empieza aquí · Guía del equipo](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f)

## A11 · Implementar carga e historial de bloques

**Responsable:** Luis Enrique Almaguer Castillo · **Revisor:** Omar Tadeo Gasca Deciga

**Semana:** S2 · **Entrega interna:** 2026-10-25 · **Prioridad:** P0

**Requisitos:** RF03, RF04, RF05 · **Dependencias para cerrar:** [A04](https://github.com/Santana-R/adaptive-rl-coach/issues/4), [A13](https://github.com/Santana-R/adaptive-rl-coach/issues/13)

### Qué vas a conseguir
Permitir cargar cinco replays y seguir el estado de cada bloque desde la interfaz.

### Empieza por aquí
Crear el formulario con cinco archivos y la lista de estados de docs/flujo-pantallas.md.

### Base que ya tienes
Base A04 y contrato/endpoint A13; durante desarrollo usar respuestas de prueba marcadas.

[docs/base-tecnica.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/base-tecnica.md) · [docs/contratos-api.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/contratos-api.md) · [docs/flujo-pantallas.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/flujo-pantallas.md)

### Dónde trabajar
public/carga.html y public/js/blocks.js; POST/GET /api/v1/blocks.

### Pasos concretos
1. Crear selección de exactamente cinco .replay y validación antes de enviar.
2. Conectar envío y estados por archivo, bloque, espera, error y reintento.
3. Crear historial con IDs y enlace a detalle; bloquear envíos repetidos accidentales.

### Entrega y conexión con el equipo
PR frontend y capturas de carga válida, inválida y parcial.

Usar ejemplo block-pending.json hasta conectar A13; cerrar únicamente con la API real.

### Ejemplo del resultado
Al seleccionar cuatro archivos se explica que faltan uno; el botón no envía el bloque.

### Cómo comprobarlo
Cuatro o seis archivos generan aviso; cinco envían el formulario. Pendiente/fallido/listo se muestran fielmente y se puede reintentar.

### Se acepta cuando
- [ ] Aceptar exactamente cinco archivos .replay desde PC y mostrar validaciones antes de enviar.
- [ ] Mostrar estado individual, duplicados, espera, fallos y reintentos; impedir doble envío accidental.
- [ ] Historial conserva IDs y permite ver el detalle de un bloque.

### Evidencia para revisar
Demo de bloque correcto, inválido y procesamiento parcial.

### Qué practicarás
Luis: formularios, peticiones asíncronas y representación de estados.

**Cierre:** enlazar entrega/PR y esperado/observado. El revisor explica qué comprobó. Código: integrado tras revisión; documentación: guardada y revisada. Las rutas de aplicación indicadas son propuestas y se crean durante la implementación. La base, mapa y fixtures enlazados sí están preparados. Los ejemplos sintéticos no acreditan integración real. Reparto aceptado por Roberto el 13 de octubre; informar disponibilidad/acceso si bloquean el compromiso.

[Empieza aquí · Guía del equipo](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f)

## A12 · Conectar registro, login y perfil

**Responsable:** Luis Enrique Almaguer Castillo · **Revisor:** David Alonso Torres Guerrero

**Semana:** S2 · **Entrega interna:** 2026-10-25 · **Prioridad:** P1

**Requisitos:** RF01, RF02 · **Dependencias para cerrar:** [A04](https://github.com/Santana-R/adaptive-rl-coach/issues/4), [A08](https://github.com/Santana-R/adaptive-rl-coach/issues/8)

### Qué vas a conseguir
Conectar las pantallas de acceso y perfil con autenticación y persistencia.

### Empieza por aquí
Conectar registro/login de Supabase y después GET/PATCH /api/v1/profile según el contrato.

### Base que ya tienes
Base A04 y autenticación A08.

[docs/base-tecnica.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/base-tecnica.md) · [docs/contratos-api.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/contratos-api.md) · [docs/flujo-pantallas.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/flujo-pantallas.md)

### Dónde trabajar
public/login.html, public/perfil.html y public/js/auth.js/profile.js.

### Pasos concretos
1. Conectar correo y Google y representar fallos comprensibles.
2. Añadir plataforma, modalidad e identidad Epic/Steam con validación.
3. Comprobar que una edición persiste al recargar y que no se analiza un perfil incompleto.

### Entrega y conexión con el equipo
PR y recorrido de acceso/perfil con ambos métodos.

Usar A08 para Auth y A15 para persistencia; nunca confiar en rol enviado por el navegador.

### Ejemplo del resultado
Sin identidad del jugador, la pantalla explica qué falta antes de analizar replays.

### Cómo comprobarlo
Registrar jugador, entrar, guardar plataforma/identidad/modalidad y cerrar sesión; Google se prueba con configuración real.

### Se acepta cuando
- [ ] Conectar correo y Google y mensajes de error; Discord queda opcional.
- [ ] Guardar plataforma, modalidad e identidad Epic o Steam; impedir análisis sin perfil válido.

### Evidencia para revisar
Demo de ambos métodos y edición persistente de perfil.

### Qué practicarás
Luis: estado de sesión, validación y datos persistidos desde formularios.

**Cierre:** enlazar entrega/PR y esperado/observado. El revisor explica qué comprobó. Código: integrado tras revisión; documentación: guardada y revisada. Las rutas de aplicación indicadas son propuestas y se crean durante la implementación. La base, mapa y fixtures enlazados sí están preparados. Los ejemplos sintéticos no acreditan integración real. Reparto aceptado por Roberto el 13 de octubre; informar disponibilidad/acceso si bloquean el compromiso.

[Empieza aquí · Guía del equipo](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f)

## A13 · Implementar carga privada y estados de procesamiento

**Responsable:** Omar Tadeo Gasca Deciga · **Revisor:** David Alonso Torres Guerrero

**Semana:** S2 · **Entrega interna:** 2026-10-22 · **Prioridad:** P0

**Requisitos:** RF03, RF04, RF05 · **Dependencias para cerrar:** [A06](https://github.com/Santana-R/adaptive-rl-coach/issues/6), [A08](https://github.com/Santana-R/adaptive-rl-coach/issues/8), [A15](https://github.com/Santana-R/adaptive-rl-coach/issues/15)

### Qué vas a conseguir
Procesar cargas privadas sin perder estados ni duplicar registros durante reintentos.

### Empieza por aquí
Implementar POST /api/v1/blocks para recibir cinco archivos, crear block_id y devolver 202.

### Base que ya tienes
Servidor A06, autorización A08 y persistencia A15.

[docs/base-tecnica.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/base-tecnica.md) · [docs/contratos-api.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/contratos-api.md) · [docs/flujo-pantallas.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/flujo-pantallas.md)

### Dónde trabajar
src/routes/blocks.js, src/services/ingestion.js y repositorio de bloques de David.

### Pasos concretos
1. Validar el lote y registrar IDs/propiedad antes de consultar procesamiento.
2. Implementar espera y reintento controlado conservando estados individuales.
3. Probar formato, duplicados y fallos; comprobar una carga real privada autorizada.

### Entrega y conexión con el equipo
PR del adaptador y pruebas con fallos y un bloque real.

A15 y A14 también entregan el jueves 22. Preparar rutas/adaptador con el ejemplo desde el lunes; coordinar la conexión al recibirlos y registrar cualquier bloqueo.

### Ejemplo del resultado
Un fallo transitorio se reintenta sobre el registro existente; no crea otro replay propio.

### Cómo comprobarlo
Carga privada real → IDs externos → pendiente/procesando → listo solo si los cinco son válidos; fallo/reintento preserva el bloque.

### Se acepta cuando
- [ ] Recibir cinco replays autorizados, validar formato y duplicados, guardar IDs y consultar estados.
- [ ] Reintentar fallos transitorios sin duplicar registros; conservar bloque pendiente o fallido hasta resolverlo.
- [ ] Limpiar solo cargas propias y temporales; nunca borrar el duplicado externo de otro usuario.

### Evidencia para revisar
Pruebas del adaptador con errores y un bloque real.

### Qué practicarás
Tadeo: procesos externos, estados e idempotencia de reintentos.

**Cierre:** enlazar entrega/PR y esperado/observado. El revisor explica qué comprobó. Código: integrado tras revisión; documentación: guardada y revisada. Las rutas de aplicación indicadas son propuestas y se crean durante la implementación. La base, mapa y fixtures enlazados sí están preparados. Los ejemplos sintéticos no acreditan integración real. Reparto aceptado por Roberto el 13 de octubre; informar disponibilidad/acceso si bloquean el compromiso.

[Empieza aquí · Guía del equipo](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f)

## A14 · Validar identidad y compatibilidad del bloque

**Responsable:** Omar Tadeo Gasca Deciga · **Revisor:** Roberto Santana Trujillo

**Semana:** S2 · **Entrega interna:** 2026-10-22 · **Prioridad:** P0

**Requisitos:** RF04, RF06 · **Dependencias para cerrar:** [A05](https://github.com/Santana-R/adaptive-rl-coach/issues/5), [A06](https://github.com/Santana-R/adaptive-rl-coach/issues/6), [A08](https://github.com/Santana-R/adaptive-rl-coach/issues/8)

### Qué vas a conseguir
Entregar al motor datos que pertenezcan al mismo jugador y contexto.

### Empieza por aquí
Extraer un jugador de una respuesta saneada A05 por plataforma e ID, no por nombre visible.

### Base que ya tienes
Prueba A05, servidor A06 y perfil autorizado A08.

[docs/base-tecnica.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/base-tecnica.md) · [docs/contratos-api.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/contratos-api.md) · [docs/flujo-pantallas.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/flujo-pantallas.md)

### Dónde trabajar
src/services/replay-validation.js y mapeo proveedor → contrato.

### Pasos concretos
1. Buscar la identidad del perfil en los cinco archivos procesados.
2. Validar modalidad y tipo; devolver motivos por replay y por bloque.
3. Entregar la extracción con IDs, unidades y disponibilidad de métricas al motor A09.

### Entrega y conexión con el equipo
PR, respuesta anonimizada y casos de jugador ausente/contexto incompatible.

Entregar a Roberto el objeto normalizado y los casos de rechazo el jueves 22; campos no verificados conservan pendiente explícito.

### Ejemplo del resultado
Si el jugador no aparece en uno de los cinco replays, el bloque no se presenta como una medición completa válida.

### Cómo comprobarlo
Jugador ausente, replay repetido o modalidad/tipo distintos impiden marcar el bloque listo; conservar razón legible.

### Se acepta cuando
- [ ] Encontrar al jugador del perfil en los cinco replays.
- [ ] Rechazar o señalar modalidad/tipo/identidad incompatibles sin mezclar mediciones.
- [ ] Entregar al motor datos normalizados con trazabilidad al replay.

### Evidencia para revisar
Payload anonimizado de cinco partidas y casos incompatibles.

### Qué practicarás
Tadeo: validar entradas y diseñar la frontera entre API y motor.

**Cierre:** enlazar entrega/PR y esperado/observado. El revisor explica qué comprobó. Código: integrado tras revisión; documentación: guardada y revisada. Las rutas de aplicación indicadas son propuestas y se crean durante la implementación. La base, mapa y fixtures enlazados sí están preparados. Los ejemplos sintéticos no acreditan integración real. Reparto aceptado por Roberto el 13 de octubre; informar disponibilidad/acceso si bloquean el compromiso.

[Empieza aquí · Guía del equipo](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f)

## A15 · Persistir perfil, bloques, replays y métricas

**Responsable:** David Alonso Torres Guerrero · **Revisor:** Omar Tadeo Gasca Deciga

**Semana:** S2 · **Entrega interna:** 2026-10-22 · **Prioridad:** P0

**Requisitos:** RF02, RF05, RF06 · **Dependencias para cerrar:** [A07](https://github.com/Santana-R/adaptive-rl-coach/issues/7), [A08](https://github.com/Santana-R/adaptive-rl-coach/issues/8)

### Qué vas a conseguir
Guardar perfil, bloques, replays y métricas con propiedad e integridad.

### Empieza por aquí
Crear persistencia de perfil/bloque/replay/métrica siguiendo el diccionario validado.

### Base que ya tienes
Modelo A07 y autenticación A08.

[docs/base-tecnica.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/base-tecnica.md) · [docs/contratos-api.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/contratos-api.md) · [docs/flujo-pantallas.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/flujo-pantallas.md)

### Dónde trabajar
Migraciones/consultas y src/repositories/blocks.js/profile.js.

### Pasos concretos
1. Crear las migraciones acordadas y datos de ejemplo.
2. Persistir IDs y estados sin duplicados y conservar datos ausentes como null.
3. Entregar consultas/ejemplos anonimizados para A09–A10 y después A19.

### Entrega y conexión con el equipo
Migraciones, seed de ejemplo y consultas de integridad.

Entregar consultas y un bloque de ejemplo a Tadeo/Roberto el jueves 22; acordar el punto de conexión con A13 durante el trabajo.

### Ejemplo del resultado
Tras reiniciar el servidor se consulta el mismo bloque, con sus cinco replays y sus estados.

### Cómo comprobarlo
Guardar y recuperar un bloque propio de cinco replays; otro jugador no obtiene su contenido. No convertir métricas faltantes en cero.

### Se acepta cuando
- [ ] Crear migraciones acordadas y relaciones de propiedad.
- [ ] Persistir estados y métricas sin duplicar cargas; null sigue siendo null.
- [ ] Exportar datos de ejemplo sin información privada para el desarrollo de los demás.

### Evidencia para revisar
Migración, seed de prueba y consultas de integridad.

### Qué practicarás
David: relaciones, restricciones y recuperación de datos para una función completa.

**Cierre:** enlazar entrega/PR y esperado/observado. El revisor explica qué comprobó. Código: integrado tras revisión; documentación: guardada y revisada. Las rutas de aplicación indicadas son propuestas y se crean durante la implementación. La base, mapa y fixtures enlazados sí están preparados. Los ejemplos sintéticos no acreditan integración real. Reparto aceptado por Roberto el 13 de octubre; informar disponibilidad/acceso si bloquean el compromiso.

[Empieza aquí · Guía del equipo](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f)

## A16 · Implementar objetivos con historial

**Responsable:** David Alonso Torres Guerrero · **Revisor:** Roberto Santana Trujillo

**Semana:** S2 · **Entrega interna:** 2026-10-25 · **Prioridad:** P1

**Requisitos:** RF10 · **Dependencias para cerrar:** [A07](https://github.com/Santana-R/adaptive-rl-coach/issues/7), [A08](https://github.com/Santana-R/adaptive-rl-coach/issues/8)

### Qué vas a conseguir
Permitir objetivos propios con historial, sin cambiar artificialmente el diagnóstico.

### Empieza por aquí
Implementar POST y GET /api/v1/goals con propietario tomado de la sesión.

### Base que ya tienes
Modelo A07 y propiedad A08.

[docs/base-tecnica.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/base-tecnica.md) · [docs/contratos-api.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/contratos-api.md) · [docs/flujo-pantallas.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/flujo-pantallas.md)

### Dónde trabajar
src/routes/goals.js y consultas de objetivos.

### Pasos concretos
1. Crear endpoints para alta, consulta y edición de metas por modalidad.
2. Conservar historial y archivar metas vinculadas a planes.
3. Probar edición/archivo y acceso de otro jugador; documentar efecto sobre planes nuevos.

### Entrega y conexión con el equipo
PR de objetivos y casos de historial/propiedad.

Modelo A07 y permisos A08; el contrato y goal.json permiten construir sin esperar la pantalla A20.

### Ejemplo del resultado
Archivar una meta vinculada conserva el plan que ya la usó; las métricas anteriores no se modifican.

### Cómo comprobarlo
Alta/consulta/edición funcionan; borrar una meta enlazada la archiva sin eliminar versiones históricas.

### Se acepta cuando
- [ ] Crear, consultar y editar objetivos por modalidad, con meta principal de rendimiento y meta opcional de entrenamiento.
- [ ] Archivar metas vinculadas a planes/historial en lugar de destruirlas; conservar versión cuando cambien.
- [ ] Objetivos no alteran métricas ni diagnóstico para forzar una recomendación.

### Evidencia para revisar
Endpoints y casos de edición, archivo y propiedad.

### Qué practicarás
David: CRUD con historial y reglas de conservación.

**Cierre:** enlazar entrega/PR y esperado/observado. El revisor explica qué comprobó. Código: integrado tras revisión; documentación: guardada y revisada. Las rutas de aplicación indicadas son propuestas y se crean durante la implementación. La base, mapa y fixtures enlazados sí están preparados. Los ejemplos sintéticos no acreditan integración real. Reparto aceptado por Roberto el 13 de octubre; informar disponibilidad/acceso si bloquean el compromiso.

[Empieza aquí · Guía del equipo](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f)

# S3 · Diagnóstico y plan

Resultado de S3: Diagnóstico explicable, plan versionado, objetivos y registro de sesiones.

Corte interno: 2026-11-01. Entregas intermedias el jueves; cierre semanal conservado. Reparto aceptado por Roberto; informar bloqueos de disponibilidad/acceso.

| Tarea | Responsable | Revisor | Fecha | Dependencias para cerrar |
| --- | --- | --- | --- | --- |
| [A17](https://github.com/Santana-R/adaptive-rl-coach/issues/17) | Roberto | Tadeo | 2026-10-29 | A02, A09, A10 |
| [A18](https://github.com/Santana-R/adaptive-rl-coach/issues/18) | Roberto | David | 2026-11-01 | A16, A17, A23, A24 |
| [A19](https://github.com/Santana-R/adaptive-rl-coach/issues/19) | Roberto | Luis | 2026-11-01 | A06, A10, A11, A15, A17 |
| [A20](https://github.com/Santana-R/adaptive-rl-coach/issues/20) | Luis | David | 2026-11-01 | A12, A16 |
| [A21](https://github.com/Santana-R/adaptive-rl-coach/issues/21) | Tadeo | David | 2026-11-01 | A08, A24 |
| [A22](https://github.com/Santana-R/adaptive-rl-coach/issues/22) | Tadeo | Roberto | 2026-11-01 | A10, A16, A21 |
| [A23](https://github.com/Santana-R/adaptive-rl-coach/issues/23) | David | Roberto | 2026-10-29 | A07, A08 |
| [A24](https://github.com/Santana-R/adaptive-rl-coach/issues/24) | David | Tadeo | 2026-10-29 | A07, A15, A16 |

El contrato y ejemplos permiten empezar en paralelo; los módulos reales deben conectarse antes del cierre. El estado operativo vive en GitHub. En S3 Roberto lleva A17/A18/A19; en S4 Tadeo A25/A29/A30. Conteos no equivalen a horas y no se añaden tareas para igualarlos.

## A17 · Implementar reglas con máximo tres prioridades

**Responsable:** Roberto Santana Trujillo · **Revisor:** Omar Tadeo Gasca Deciga

**Semana:** S3 · **Entrega interna:** 2026-10-29 · **Prioridad:** P0

**Requisitos:** RF08 · **Dependencias para cerrar:** [A02](https://github.com/Santana-R/adaptive-rl-coach/issues/2), [A09](https://github.com/Santana-R/adaptive-rl-coach/issues/9), [A10](https://github.com/Santana-R/adaptive-rl-coach/issues/10)

### Qué vas a conseguir
Generar prioridades reproducibles que se puedan explicar con evidencia.

### Empieza por aquí
Escribir diagnose(metrics, comparison, rulesVersion) usando los casos de A02.

### Base que ya tienes
Casos A02, métricas A09 y comparación A10.

[docs/base-tecnica.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/base-tecnica.md) · [docs/contratos-api.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/contratos-api.md) · [docs/flujo-pantallas.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/flujo-pantallas.md)

### Dónde trabajar
src/domain/rules.js y configuración de reglas versionada.

### Pasos concretos
1. Trasladar las reglas acordadas a JavaScript con versión explícita.
2. Ordenar y limitar a tres prioridades; cada salida conserva regla, dato y unidad.
3. Comprobar empates, faltantes y ausencia de señal con los casos preparados.

### Entrega y conexión con el equipo
PR del motor y resultados de los casos de reglas.

Entregar función y un diagnóstico de ejemplo el jueves 29. A19 y A18 lo consumen; las heurísticas se calibran en A26.

### Ejemplo del resultado
Una prioridad incluye el ID de regla y la métrica que la activó; un dato ausente no activa una conclusión inventada.

### Cómo comprobarlo
Máximo tres prioridades; cada una incluye regla, métrica, unidad y evidencia. null no activa una regla; empates son reproducibles.

### Se acepta cuando
- [ ] Generar como máximo tres prioridades ordenadas de forma determinista.
- [ ] Cada prioridad conserva regla, evidencia, unidades y contexto; datos insuficientes producen explicación.
- [ ] Verificar salida del motor web frente a los casos del prototipo.

### Evidencia para revisar
Pruebas de reglas, empates, null y ausencia de prioridades.

### Qué practicarás
Roberto: lógica determinista, ordenamiento y explicaciones comprobables.

**Cierre:** enlazar entrega/PR y esperado/observado. El revisor explica qué comprobó. Código: integrado tras revisión; documentación: guardada y revisada. Las rutas de aplicación indicadas son propuestas y se crean durante la implementación. La base, mapa y fixtures enlazados sí están preparados. Los ejemplos sintéticos no acreditan integración real. Reparto aceptado por Roberto el 13 de octubre; informar disponibilidad/acceso si bloquean el compromiso.

[Empieza aquí · Guía del equipo](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f)

## A18 · Generar planes compatibles y versionados

**Responsable:** Roberto Santana Trujillo · **Revisor:** David Alonso Torres Guerrero

**Semana:** S3 · **Entrega interna:** 2026-11-01 · **Prioridad:** P0

**Requisitos:** RF09 · **Dependencias para cerrar:** [A16](https://github.com/Santana-R/adaptive-rl-coach/issues/16), [A17](https://github.com/Santana-R/adaptive-rl-coach/issues/17), [A23](https://github.com/Santana-R/adaptive-rl-coach/issues/23), [A24](https://github.com/Santana-R/adaptive-rl-coach/issues/24)

### Qué vas a conseguir
Crear un plan posible de realizar y conservar las versiones anteriores.

### Empieza por aquí
Escribir generatePlan(diagnosis, goals, exercises, availableMinutes) con los ejemplos del contrato.

### Base que ya tienes
Metas A16, prioridades A17, catálogo A23 y versiones A24.

[docs/base-tecnica.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/base-tecnica.md) · [docs/contratos-api.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/contratos-api.md) · [docs/flujo-pantallas.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/flujo-pantallas.md)

### Dónde trabajar
src/domain/plans.js y ruta de generación de planes.

### Pasos concretos
1. Elegir ejercicios activos compatibles con prioridad, meta, plataforma y disponibilidad.
2. Comprobar duración, sesiones e instrucciones de cada ejercicio.
3. Guardar otra versión al actualizar y explicar cobertura parcial o vacía.

### Entrega y conexión con el equipo
PR del generador y casos de catálogo suficiente, parcial y vacío.

Puede probar con el catálogo y snapshots de ejemplo; cerrar con A17/A23/A24 reales. David persiste las versiones.

### Ejemplo del resultado
Si solo existe un ejercicio compatible para dos prioridades, se muestra plan parcial y la cobertura que falta.

### Cómo comprobarlo
Usar solo ejercicios activos compatibles; respetar minutos; cobertura completa/parcial/vacía tiene motivo y snapshots.

### Se acepta cuando
- [ ] Seleccionar ejercicios activos según prioridades, metas, plataforma, disponibilidad y sesiones.
- [ ] Incluir instrucciones, duración, dificultad y recurso; validar que el tiempo cabe en la disponibilidad.
- [ ] Sin cobertura total, declarar plan parcial o vacío y motivo; Actualizar plan crea otra versión.

### Evidencia para revisar
Casos con catálogo suficiente, parcial y vacío.

### Qué practicarás
Roberto: restricciones, selección y conexión entre reglas y persistencia.

**Cierre:** enlazar entrega/PR y esperado/observado. El revisor explica qué comprobó. Código: integrado tras revisión; documentación: guardada y revisada. Las rutas de aplicación indicadas son propuestas y se crean durante la implementación. La base, mapa y fixtures enlazados sí están preparados. Los ejemplos sintéticos no acreditan integración real. Reparto aceptado por Roberto el 13 de octubre; informar disponibilidad/acceso si bloquean el compromiso.

[Empieza aquí · Guía del equipo](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f)

## A19 · Conectar datos, API y pantalla de análisis con comparación

**Responsable:** Roberto Santana Trujillo · **Revisor:** Luis Enrique Almaguer Castillo

**Semana:** S3 · **Entrega interna:** 2026-11-01 · **Prioridad:** P1

**Requisitos:** RF06, RF07, RF08 · **Dependencias para cerrar:** [A06](https://github.com/Santana-R/adaptive-rl-coach/issues/6), [A10](https://github.com/Santana-R/adaptive-rl-coach/issues/10), [A11](https://github.com/Santana-R/adaptive-rl-coach/issues/11), [A15](https://github.com/Santana-R/adaptive-rl-coach/issues/15), [A17](https://github.com/Santana-R/adaptive-rl-coach/issues/17)

### Qué vas a conseguir
Construir una función completa para que Roberto conecte datos, servidor e interfaz.

### Empieza por aquí
Seguir la sección función completa A19 de la base: consulta propia → comparación/reglas → endpoint → gráfica.

### Base que ya tienes
Servidor A06; comparación A10; acceso al bloque desde A11; consultas A15; prioridades A17; base visual A04.

[docs/base-tecnica.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/base-tecnica.md) · [docs/contratos-api.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/contratos-api.md) · [docs/flujo-pantallas.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/flujo-pantallas.md)

### Dónde trabajar
src/routes/analysis.js, repositorios existentes, public/analisis.html y public/js/analysis.js.

### Pasos concretos
1. Consultar los bloques propios y acordar con Tadeo la ruta del endpoint de análisis.
2. Reutilizar A09/A10/A17 y devolver el resultado autorizado con unidades, motivos y evidencia.
3. Conectar la respuesta a la pantalla Análisis con JavaScript/Chart.js; revisar su uso con Luis mediante el PR.

### Entrega y conexión con el equipo
PR que incluya consulta, endpoint y pantalla; ejemplo de respuesta, prueba del recorrido y capturas.

Tadeo entrega servidor, David consultas y Luis componentes. Roberto integra esta función; Luis revisa la pantalla. El contrato permite avanzar con fixtures.

### Ejemplo del resultado
Abrir bloque B desde el historial: la API recupera A/B propios, calcula +5 puntos porcentuales de tiro en el caso de prueba y la pantalla lo muestra con unidad y período.

### Cómo comprobarlo
El caso 25% → 30% muestra +5 pp en función, API y pantalla; primer bloque/incompatible/faltante muestran el motivo.

### Se acepta cuando
- [ ] Consultar bloques guardados del jugador autorizado y reutilizar la normalización/comparación de A09–A10 y las prioridades de A17.
- [ ] Implementar la consulta del análisis en Express y conectar su respuesta a la pantalla existente con JavaScript y Chart.js.
- [ ] Mostrar métricas por replay/bloque, unidades, faltantes, línea base o comparación, hasta tres prioridades y el motivo de incompatibilidad.
- [ ] Comprobar el recorrido datos → API → interfaz con bloques comparables, primer bloque, datos faltantes y acceso a datos ajenos denegado.

### Evidencia para revisar
PR de la función completa, ejemplo de respuesta, capturas y prueba del recorrido con cifras verificadas.

### Qué practicarás
Roberto: comprender y construir una función desde persistencia hasta interfaz; Tadeo mantiene el servidor común, David el modelo y Luis la base visual.

**Cierre:** enlazar entrega/PR y esperado/observado. El revisor explica qué comprobó. Código: integrado tras revisión; documentación: guardada y revisada. Las rutas de aplicación indicadas son propuestas y se crean durante la implementación. La base, mapa y fixtures enlazados sí están preparados. Los ejemplos sintéticos no acreditan integración real. Reparto aceptado por Roberto el 13 de octubre; informar disponibilidad/acceso si bloquean el compromiso.

[Empieza aquí · Guía del equipo](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f)

## A20 · Construir gestión de objetivos

**Responsable:** Luis Enrique Almaguer Castillo · **Revisor:** David Alonso Torres Guerrero

**Semana:** S3 · **Entrega interna:** 2026-11-01 · **Prioridad:** P1

**Requisitos:** RF10 · **Dependencias para cerrar:** [A12](https://github.com/Santana-R/adaptive-rl-coach/issues/12), [A16](https://github.com/Santana-R/adaptive-rl-coach/issues/16)

### Qué vas a conseguir
Dar al jugador una interfaz para mantener sus objetivos.

### Empieza por aquí
Crear el formulario/listado de Objetivos usando goal.json y después conectar sus endpoints.

### Base que ya tienes
Perfil A12 y endpoints A16.

[docs/base-tecnica.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/base-tecnica.md) · [docs/contratos-api.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/contratos-api.md) · [docs/flujo-pantallas.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/flujo-pantallas.md)

### Dónde trabajar
public/objetivos.html y public/js/goals.js.

### Pasos concretos
1. Crear listado y formularios por modalidad.
2. Conectar alta, edición y archivo con los mensajes correspondientes.
3. Mostrar metas de rendimiento y entrenamiento por separado y comprobar conservación del historial.

### Entrega y conexión con el equipo
PR de pantalla Objetivos y recorrido de todos sus estados.

Usar A16 para la operación real y A12 para sesión/perfil; un mock solo acredita el diseño.

### Ejemplo del resultado
Archivar una meta cambia su estado visible y permite seguir consultando el plan histórico relacionado.

### Cómo comprobarlo
Crear, editar y borrar/archivar con mensajes claros; la lista refleja el servidor y conserva relaciones históricas.

### Se acepta cuando
- [ ] Crear, consultar, editar y archivar metas por modalidad.
- [ ] Distinguir meta de rendimiento y entrenamiento y explicar su relación con planes e historial.

### Evidencia para revisar
Recorrido de todos los estados de objetivos.

### Qué practicarás
Luis: formularios CRUD y explicación de cambios con historial.

**Cierre:** enlazar entrega/PR y esperado/observado. El revisor explica qué comprobó. Código: integrado tras revisión; documentación: guardada y revisada. Las rutas de aplicación indicadas son propuestas y se crean durante la implementación. La base, mapa y fixtures enlazados sí están preparados. Los ejemplos sintéticos no acreditan integración real. Reparto aceptado por Roberto el 13 de octubre; informar disponibilidad/acceso si bloquean el compromiso.

[Empieza aquí · Guía del equipo](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f)

## A21 · Implementar CRUD de sesiones ligadas al plan

**Responsable:** Omar Tadeo Gasca Deciga · **Revisor:** David Alonso Torres Guerrero

**Semana:** S3 · **Entrega interna:** 2026-11-01 · **Prioridad:** P0

**Requisitos:** RF10 · **Dependencias para cerrar:** [A08](https://github.com/Santana-R/adaptive-rl-coach/issues/8), [A24](https://github.com/Santana-R/adaptive-rl-coach/issues/24)

### Qué vas a conseguir
Registrar entrenamiento realizado sobre la versión exacta del plan.

### Empieza por aquí
Implementar POST /api/v1/sessions con plan_version_id y ejercicio de esa versión.

### Base que ya tienes
Autorización A08 y versiones A24.

[docs/base-tecnica.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/base-tecnica.md) · [docs/contratos-api.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/contratos-api.md) · [docs/flujo-pantallas.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/flujo-pantallas.md)

### Dónde trabajar
src/routes/sessions.js y consultas persistentes.

### Pasos concretos
1. Implementar alta, consulta, corrección y eliminación de sesiones propias.
2. Validar fecha, duración, ejercicio y versión del plan.
3. Recalcular conteos tras una corrección/eliminación y comprobar dos versiones distintas.

### Entrega y conexión con el equipo
PR de sesiones y pruebas CRUD/recálculo.

Plan-version.json permite empezar; validar con versiones reales A24 y permisos A08.

### Ejemplo del resultado
Corregir una sesión de 20 a 15 minutos actualiza el total de entrenamiento; no demuestra una mejora en partidas.

### Cómo comprobarlo
Una sesión de v1 conserva sus ejercicios al crear v2; corregir/borrar recalcula entrenamiento sin cambiar métricas de replays.

### Se acepta cuando
- [ ] Crear, consultar, corregir y eliminar sesiones propias ligadas a la versión exacta del plan.
- [ ] Validar fecha, ejercicio y duración; la actividad es autorreportada.
- [ ] Corrección o eliminación deja progresos coherentes y nunca prueba por sí sola mejora en partidas.

### Evidencia para revisar
Casos CRUD y recálculo con dos versiones de plan.

### Qué practicarás
Tadeo: endpoints CRUD y coherencia de datos derivados.

**Cierre:** enlazar entrega/PR y esperado/observado. El revisor explica qué comprobó. Código: integrado tras revisión; documentación: guardada y revisada. Las rutas de aplicación indicadas son propuestas y se crean durante la implementación. La base, mapa y fixtures enlazados sí están preparados. Los ejemplos sintéticos no acreditan integración real. Reparto aceptado por Roberto el 13 de octubre; informar disponibilidad/acceso si bloquean el compromiso.

[Empieza aquí · Guía del equipo](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f)

## A22 · Calcular progreso y contrato de reportes

**Responsable:** Omar Tadeo Gasca Deciga · **Revisor:** Roberto Santana Trujillo

**Semana:** S3 · **Entrega interna:** 2026-11-01 · **Prioridad:** P1

**Requisitos:** RF10, RF11 · **Dependencias para cerrar:** [A10](https://github.com/Santana-R/adaptive-rl-coach/issues/10), [A16](https://github.com/Santana-R/adaptive-rl-coach/issues/16), [A21](https://github.com/Santana-R/adaptive-rl-coach/issues/21)

### Qué vas a conseguir
Entregar reportes con fuentes y unidades claras.

### Empieza por aquí
Preparar GET /api/v1/reports y separar sus tres series: rendimiento, metas y rango declarado.

### Base que ya tienes
Comparación A10, objetivos A16 y sesiones A21.

[docs/base-tecnica.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/base-tecnica.md) · [docs/contratos-api.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/contratos-api.md) · [docs/flujo-pantallas.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/flujo-pantallas.md)

### Dónde trabajar
src/services/reports.js y src/routes/reports.js.

### Pasos concretos
1. Separar entrenamiento declarado, cumplimiento de metas y métricas de partidas.
2. Agregar período, cantidad de observaciones, denominador y exclusiones.
3. Comprobar respuestas con datos de prueba y documentar su consumo por A28.

### Entrega y conexión con el equipo
PR de reportes y ejemplos numéricos verificados.

Usar fixtures para contrato; completar con comparación A10, metas A16 y sesiones A21 antes de cerrar.

### Ejemplo del resultado
45 minutos declarados se presentan como entrenamiento; el cambio de rendimiento proviene de bloques comparables.

### Cómo comprobarlo
Cada serie declara fuente, fechas, unidad, muestra y exclusiones; rango manual no se presenta como MMR automático.

### Se acepta cuando
- [ ] Separar progreso de entrenamiento, metas de rendimiento y cambios de métricas.
- [ ] Incluir período, conteos, denominador, unidades, exclusiones y fuente de cada dato; rango se identifica como declarado.

### Evidencia para revisar
Respuestas de reporte verificadas con fixtures.

### Qué practicarás
Tadeo: agregaciones y contratos claros para gráficas.

**Cierre:** enlazar entrega/PR y esperado/observado. El revisor explica qué comprobó. Código: integrado tras revisión; documentación: guardada y revisada. Las rutas de aplicación indicadas son propuestas y se crean durante la implementación. La base, mapa y fixtures enlazados sí están preparados. Los ejemplos sintéticos no acreditan integración real. Reparto aceptado por Roberto el 13 de octubre; informar disponibilidad/acceso si bloquean el compromiso.

[Empieza aquí · Guía del equipo](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f)

## A23 · Implementar catálogo CRUD y semilla validada

**Responsable:** David Alonso Torres Guerrero · **Revisor:** Roberto Santana Trujillo

**Semana:** S3 · **Entrega interna:** 2026-10-29 · **Prioridad:** P0

**Requisitos:** RF09, RF12 · **Dependencias para cerrar:** [A07](https://github.com/Santana-R/adaptive-rl-coach/issues/7), [A08](https://github.com/Santana-R/adaptive-rl-coach/issues/8)

### Qué vas a conseguir
Mantener ejercicios y recursos que realmente puedan usarse en planes nuevos.

### Empieza por aquí
Implementar CRUD administrativo de ejercicios y revisar una semilla de ejemplos por prioridad.

### Base que ya tienes
Diseño A07 y permisos A08.

[docs/base-tecnica.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/base-tecnica.md) · [docs/contratos-api.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/contratos-api.md) · [docs/flujo-pantallas.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/flujo-pantallas.md)

### Dónde trabajar
src/routes/exercises.js, catálogo persistente y seed de desarrollo.

### Pasos concretos
1. Implementar CRUD autorizado de ejercicios y recursos.
2. Validar compatibilidad, duración, dificultad e instrucciones.
3. Preparar y revisar la semilla mínima; probar que un ejercicio desactivado no entra en un plan nuevo.

### Entrega y conexión con el equipo
PR de catálogo y seed revisado para las prioridades del MVP.

Entregar catálogo funcional el jueves 29. No prometer recursos no revisados; plan anterior mantiene snapshots tras un cambio.

### Ejemplo del resultado
Desactivar un ejercicio lo excluye de planes nuevos y conserva la descripción del plan que ya lo usó.

### Cómo comprobarlo
Jugador consulta activos; administrador crea/edita/desactiva. Cada ejercicio tiene recurso válido, instrucciones, minutos y compatibilidad.

### Se acepta cuando
- [ ] Administrador crea, consulta, edita y desactiva ejercicios y recursos.
- [ ] Validar modalidad/plataforma, duración, dificultad e instrucciones; seed revisado habilita ejercicios explícitamente.
- [ ] Jugador no administra catálogo; ejercicios desactivados no entran en planes nuevos.

### Evidencia para revisar
Endpoints y seed suficiente para cubrir prioridades del MVP.

### Qué practicarás
David: catálogo autorizado y conservación de datos históricos.

**Cierre:** enlazar entrega/PR y esperado/observado. El revisor explica qué comprobó. Código: integrado tras revisión; documentación: guardada y revisada. Las rutas de aplicación indicadas son propuestas y se crean durante la implementación. La base, mapa y fixtures enlazados sí están preparados. Los ejemplos sintéticos no acreditan integración real. Reparto aceptado por Roberto el 13 de octubre; informar disponibilidad/acceso si bloquean el compromiso.

[Empieza aquí · Guía del equipo](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f)

## A24 · Persistir versiones y snapshots del plan

**Responsable:** David Alonso Torres Guerrero · **Revisor:** Omar Tadeo Gasca Deciga

**Semana:** S3 · **Entrega interna:** 2026-10-29 · **Prioridad:** P0

**Requisitos:** RF09, RF10 · **Dependencias para cerrar:** [A07](https://github.com/Santana-R/adaptive-rl-coach/issues/7), [A15](https://github.com/Santana-R/adaptive-rl-coach/issues/15), [A16](https://github.com/Santana-R/adaptive-rl-coach/issues/16)

### Qué vas a conseguir
Conservar exactamente qué datos y reglas originaron cada versión del plan.

### Empieza por aquí
Crear escritura de plan_version y plan_exercise a partir de plan-version.json.

### Base que ya tienes
Modelo A07, datos A15 y objetivos A16.

[docs/base-tecnica.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/base-tecnica.md) · [docs/contratos-api.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/contratos-api.md) · [docs/flujo-pantallas.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/flujo-pantallas.md)

### Dónde trabajar
Migraciones/consultas de planes, versiones y snapshots.

### Pasos concretos
1. Guardar la copia histórica de meta, perfil, ejercicio, regla y evidencia aplicada.
2. Enlazar plan_ejercicio y sesiones a su versión correcta.
3. Modificar datos actuales y demostrar que una versión previa permanece idéntica.

### Entrega y conexión con el equipo
Migraciones/PR y comparación de versiones antes/después.

Entregar persistencia de versiones el jueves 29 para A18/A21; el esquema preparado permite empezar desde el lunes.

### Ejemplo del resultado
Editar hoy la duración de un ejercicio no cambia el tiempo que mostraba el plan de ayer.

### Cómo comprobarlo
Crear v1 y v2: v1 permanece inmutable con metas, ejercicios y reglas utilizados; sesión referencia versión exacta.

### Se acepta cuando
- [ ] Conservar metas, perfil, ejercicios, evidencia y reglas aplicadas en cada versión.
- [ ] Cambiar perfil/meta/catálogo no reescribe versiones anteriores; actualizar crea otra.
- [ ] Sesiones y plan_ejercicio referencian la versión correcta.

### Evidencia para revisar
Migraciones y comparación antes/después de una actualización.

### Qué practicarás
David: snapshots, versionado y trazabilidad.

**Cierre:** enlazar entrega/PR y esperado/observado. El revisor explica qué comprobó. Código: integrado tras revisión; documentación: guardada y revisada. Las rutas de aplicación indicadas son propuestas y se crean durante la implementación. La base, mapa y fixtures enlazados sí están preparados. Los ejemplos sintéticos no acreditan integración real. Reparto aceptado por Roberto el 13 de octubre; informar disponibilidad/acceso si bloquean el compromiso.

[Empieza aquí · Guía del equipo](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f)

# S4 · Integración completa

Resultado de S4: RF01–RF12 conectados, administración y segundo bloque comparable.

Corte interno: 2026-11-06. Entregas intermedias el jueves; cierre semanal conservado. Reparto aceptado por Roberto; informar bloqueos de disponibilidad/acceso.

| Tarea | Responsable | Revisor | Fecha | Dependencias para cerrar |
| --- | --- | --- | --- | --- |
| [A25](https://github.com/Santana-R/adaptive-rl-coach/issues/25) | Tadeo | Roberto | 2026-11-06 | A18, A19, A21, A22, A24 |
| [A26](https://github.com/Santana-R/adaptive-rl-coach/issues/26) | Roberto | David | 2026-11-06 | A17, A18 |
| [A27](https://github.com/Santana-R/adaptive-rl-coach/issues/27) | Luis | David | 2026-11-06 | A18, A20, A21, A24 |
| [A28](https://github.com/Santana-R/adaptive-rl-coach/issues/28) | Luis | Roberto | 2026-11-06 | A19, A22, A31 |
| [A29](https://github.com/Santana-R/adaptive-rl-coach/issues/29) | Tadeo | David | 2026-11-05 | A08 |
| [A30](https://github.com/Santana-R/adaptive-rl-coach/issues/30) | Tadeo | Roberto | 2026-11-06 | A13, A14 |
| [A31](https://github.com/Santana-R/adaptive-rl-coach/issues/31) | David | Roberto | 2026-11-05 | A16, A22, A24 |
| [A32](https://github.com/Santana-R/adaptive-rl-coach/issues/32) | David | Luis | 2026-11-06 | A04, A23, A29 |

El contrato y ejemplos permiten empezar en paralelo; los módulos reales deben conectarse antes del cierre. El estado operativo vive en GitHub. En S3 Roberto lleva A17/A18/A19; en S4 Tadeo A25/A29/A30. Conteos no equivalen a horas y no se añaden tareas para igualarlos.

## A25 · Coordinar y comprobar la integración del ciclo completo

**Responsable:** Omar Tadeo Gasca Deciga · **Revisor:** Roberto Santana Trujillo

**Semana:** S4 · **Entrega interna:** 2026-11-06 · **Prioridad:** P0

**Requisitos:** RF01–RF12 · **Dependencias para cerrar:** [A18](https://github.com/Santana-R/adaptive-rl-coach/issues/18), [A19](https://github.com/Santana-R/adaptive-rl-coach/issues/19), [A21](https://github.com/Santana-R/adaptive-rl-coach/issues/21), [A22](https://github.com/Santana-R/adaptive-rl-coach/issues/22), [A24](https://github.com/Santana-R/adaptive-rl-coach/issues/24)

### Qué vas a conseguir
Comprobar que los módulos de los cuatro funcionan juntos en el recorrido obligatorio.

### Empieza por aquí
Abrir la fila P11 de pruebas y recorrer registro → perfil → bloque → análisis → plan → sesión → segundo bloque.

### Base que ya tienes
A18, A19, A21, A22 y A24 integradas o con entregas intermedias acordadas.

[docs/base-tecnica.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/base-tecnica.md) · [docs/contratos-api.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/contratos-api.md) · [docs/flujo-pantallas.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/flujo-pantallas.md)

### Dónde trabajar
docs/integracion-ciclo.md y fixes separados en cada módulo.

### Pasos concretos
1. Tadeo coordina el recorrido completo con dos bloques reales comparables.
2. Abrir incidencias con módulo afectado, evidencia y responsable; cada dueño corrige su pieza.
3. Repetir el recorrido tras los arreglos y dejar evidencia antes del corte.

### Entrega y conexión con el equipo
Registro de integración, incidencias resueltas y demo del ciclo completo.

Tadeo coordina, Roberto revisa; empezar a integrar ejemplos antes del corte y terminar con funciones reales.

### Ejemplo del resultado
Login → perfil → bloque A → análisis → meta → plan → sesión → bloque B → reevaluación.

### Cómo comprobarlo
Ejecutar con dos bloques reales compatibles, evidencia por paso y lista de defectos con responsable. Cada dueño corrige su pieza.

### Se acepta cuando
- [ ] Completar login → perfil → bloque A → análisis → meta → plan → sesión → bloque B comparable.
- [ ] Demostrar reevaluación con evidencia; metas o sesiones no inventan cambio de desempeño.
- [ ] Abrir incidencias de integración y cerrarlas antes del corte del viernes.

### Evidencia para revisar
Demo integrada con dos bloques y PRs revisados.

### Qué practicarás
Tadeo: integración y diagnóstico de fallos entre módulos; Roberto revisa la función de análisis. No exige trabajo acompañado.

**Cierre:** enlazar entrega/PR y esperado/observado. El revisor explica qué comprobó. Código: integrado tras revisión; documentación: guardada y revisada. Las rutas de aplicación indicadas son propuestas y se crean durante la implementación. La base, mapa y fixtures enlazados sí están preparados. Los ejemplos sintéticos no acreditan integración real. Reparto aceptado por Roberto el 13 de octubre; informar disponibilidad/acceso si bloquean el compromiso.

[Empieza aquí · Guía del equipo](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f)

## A26 · Calibrar heurísticas y documentar límites

**Responsable:** Roberto Santana Trujillo · **Revisor:** David Alonso Torres Guerrero

**Semana:** S4 · **Entrega interna:** 2026-11-06 · **Prioridad:** P1

**Requisitos:** RF07, RF08, RF09 · **Dependencias para cerrar:** [A17](https://github.com/Santana-R/adaptive-rl-coach/issues/17), [A18](https://github.com/Santana-R/adaptive-rl-coach/issues/18)

### Qué vas a conseguir
Comprobar y documentar qué permiten concluir las heurísticas.

### Empieza por aquí
Comparar las prioridades del prototipo con bloques reales disponibles y registrar por qué se activan.

### Base que ya tienes
Reglas A17 y planes A18 con casos reproducibles.

[docs/base-tecnica.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/base-tecnica.md) · [docs/contratos-api.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/contratos-api.md) · [docs/flujo-pantallas.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/flujo-pantallas.md)

### Dónde trabajar
docs/calibracion-reglas.md y configuración de reglas.

### Pasos concretos
1. Comparar resultados con casos revisados manualmente por modalidad.
2. Registrar cambios de umbral y la versión que los usa.
3. Explicar incertidumbre y límites sin presentar correlaciones como causalidad.

### Entrega y conexión con el equipo
docs/calibracion-reglas.md y casos reproducibles de la versión usada.

Usar A17/A18 implementados; muestras pequeñas se identifican y no se inventan validaciones estadísticas.

### Ejemplo del resultado
Un cambio entre bloques es evidencia de una diferencia observada; no prueba por sí solo que el ejercicio la causó.

### Cómo comprobarlo
Umbral, unidad, versión y limitación están documentados; no se atribuye causalidad a sesiones autorreportadas.

### Se acepta cuando
- [ ] Contrastar umbrales con casos manuales y contextos de modalidad.
- [ ] Conservar reglas y evidencia reproducibles; describir incertidumbre y límites sin afirmar causalidad.

### Evidencia para revisar
Tabla de casos y versión de reglas usada.

### Qué practicarás
Roberto: evaluar límites del diagnóstico además de implementarlo.

**Cierre:** enlazar entrega/PR y esperado/observado. El revisor explica qué comprobó. Código: integrado tras revisión; documentación: guardada y revisada. Las rutas de aplicación indicadas son propuestas y se crean durante la implementación. La base, mapa y fixtures enlazados sí están preparados. Los ejemplos sintéticos no acreditan integración real. Reparto aceptado por Roberto el 13 de octubre; informar disponibilidad/acceso si bloquean el compromiso.

[Empieza aquí · Guía del equipo](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f)

## A27 · Conectar plan y sesiones en la interfaz

**Responsable:** Luis Enrique Almaguer Castillo · **Revisor:** David Alonso Torres Guerrero

**Semana:** S4 · **Entrega interna:** 2026-11-06 · **Prioridad:** P0

**Requisitos:** RF09, RF10 · **Dependencias para cerrar:** [A18](https://github.com/Santana-R/adaptive-rl-coach/issues/18), [A20](https://github.com/Santana-R/adaptive-rl-coach/issues/20), [A21](https://github.com/Santana-R/adaptive-rl-coach/issues/21), [A24](https://github.com/Santana-R/adaptive-rl-coach/issues/24)

### Qué vas a conseguir
Conectar planes y sesiones sin perder sus versiones.

### Empieza por aquí
Crear Plan/Sesiones con plan-version.json y session.json antes de conectar el servidor.

### Base que ya tienes
Generador A18, objetivos A20, sesiones A21 y versiones A24.

[docs/base-tecnica.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/base-tecnica.md) · [docs/contratos-api.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/contratos-api.md) · [docs/flujo-pantallas.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/flujo-pantallas.md)

### Dónde trabajar
public/plan.html, public/sesiones.html y sus controladores JavaScript.

### Pasos concretos
1. Mostrar versión, recursos, instrucciones, duración y cobertura.
2. Conectar actualización de plan y consulta de versiones anteriores.
3. Conectar registro/corrección/eliminación de sesiones sobre la versión elegida.

### Entrega y conexión con el equipo
PR de Plan/Sesiones y recorrido con conservación de historial.

Conectar A18/A20/A21/A24; los ejemplos reducen la espera entre módulos.

### Ejemplo del resultado
Tras actualizar el plan a v2, una sesión de v1 sigue mostrando los ejercicios de v1.

### Cómo comprobarlo
Crear otra versión no modifica la sesión v1; consultar versiones, registrar/corregir/borrar sesiones y mostrar cobertura.

### Se acepta cuando
- [ ] Mostrar versión, recursos, duración y estados de cobertura.
- [ ] Actualizar plan crea versión y permite consultar anteriores; sesiones se registran/corrigen/eliminan sobre su versión.

### Evidencia para revisar
Recorrido integrado y prueba de conservación de historial.

### Qué practicarás
Luis: interfaz con relaciones y versiones persistentes.

**Cierre:** enlazar entrega/PR y esperado/observado. El revisor explica qué comprobó. Código: integrado tras revisión; documentación: guardada y revisada. Las rutas de aplicación indicadas son propuestas y se crean durante la implementación. La base, mapa y fixtures enlazados sí están preparados. Los ejemplos sintéticos no acreditan integración real. Reparto aceptado por Roberto el 13 de octubre; informar disponibilidad/acceso si bloquean el compromiso.

[Empieza aquí · Guía del equipo](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f)

## A28 · Construir reportes y cerrar estados de pantallas

**Responsable:** Luis Enrique Almaguer Castillo · **Revisor:** Roberto Santana Trujillo

**Semana:** S4 · **Entrega interna:** 2026-11-06 · **Prioridad:** P1

**Requisitos:** RF11 · **Dependencias para cerrar:** [A19](https://github.com/Santana-R/adaptive-rl-coach/issues/19), [A22](https://github.com/Santana-R/adaptive-rl-coach/issues/22), [A31](https://github.com/Santana-R/adaptive-rl-coach/issues/31)

### Qué vas a conseguir
Mostrar reportes comprensibles y completar los estados del recorrido del jugador.

### Empieza por aquí
Representar report.json con tres secciones y unidades visibles.

### Base que ya tienes
Análisis A19, reportes A22 e historial A31.

[docs/base-tecnica.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/base-tecnica.md) · [docs/contratos-api.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/contratos-api.md) · [docs/flujo-pantallas.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/flujo-pantallas.md)

### Dónde trabajar
public/reportes o sección de seguimiento de las pantallas aprobadas, y public/js/reports.js.

### Pasos concretos
1. Separar las gráficas por fuente: partidas, objetivos y rango declarado.
2. Añadir unidades, períodos, muestra y explicación de exclusiones.
3. Revisar todas las pantallas del jugador y sus estados de error/ausencia de datos.

### Entrega y conexión con el equipo
PR de reportes y capturas con datos completos y faltantes.

A19/A22/A31 entregan datos; usar el ejemplo para diseño y cerrar al verificar respuestas reales.

### Ejemplo del resultado
Un valor ausente genera un hueco o mensaje, no una barra de cero; el rango se etiqueta como declarado.

### Cómo comprobarlo
No añadir una decimocuarta pantalla: ubicar reportes en Análisis/Objetivos/Sesiones. null muestra hueco/motivo; rango lleva fuente declarada.

### Se acepta cuando
- [ ] Separar gráficas de métricas, objetivos y rango declarado.
- [ ] Mostrar períodos, unidades, muestras y exclusiones; no dibujar null como cero.
- [ ] Completar todas las trece pantallas y navegación del ciclo del jugador.

### Evidencia para revisar
Demo de reportes con casos de ausencia de datos.

### Qué practicarás
Luis: visualización fiel de datos y comprensión de límites.

**Cierre:** enlazar entrega/PR y esperado/observado. El revisor explica qué comprobó. Código: integrado tras revisión; documentación: guardada y revisada. Las rutas de aplicación indicadas son propuestas y se crean durante la implementación. La base, mapa y fixtures enlazados sí están preparados. Los ejemplos sintéticos no acreditan integración real. Reparto aceptado por Roberto el 13 de octubre; informar disponibilidad/acceso si bloquean el compromiso.

[Empieza aquí · Guía del equipo](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f)

## A29 · Implementar administración de usuarios

**Responsable:** Omar Tadeo Gasca Deciga · **Revisor:** David Alonso Torres Guerrero

**Semana:** S4 · **Entrega interna:** 2026-11-05 · **Prioridad:** P0

**Requisitos:** RF12 · **Dependencias para cerrar:** [A08](https://github.com/Santana-R/adaptive-rl-coach/issues/8)

### Qué vas a conseguir
Permitir al administrador consultar y cambiar el estado de usuarios.

### Empieza por aquí
Implementar GET /api/v1/admin/users y PATCH /api/v1/admin/users/:id/status.

### Base que ya tienes
Autorización A08.

[docs/base-tecnica.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/base-tecnica.md) · [docs/contratos-api.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/contratos-api.md) · [docs/flujo-pantallas.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/flujo-pantallas.md)

### Dónde trabajar
src/routes/admin-users.js y consultas de rol/estado.

### Pasos concretos
1. Crear consulta y cambio activo/suspendido desde el servidor.
2. Comprobar rol y suspensión en cada operación protegida.
3. Probar suspensión/reactivación y acceso del jugador a endpoints de administración.

### Entrega y conexión con el equipo
PR de administración y matriz de rol/estado.

Permisos A08; entregar operaciones el jueves 5 para conectar el panel A32.

### Ejemplo del resultado
Un jugador que envía directamente una petición de suspensión recibe acceso denegado.

### Cómo comprobarlo
Jugador recibe 403 al intentar una operación admin; suspensión/reactivación afecta las siguientes peticiones protegidas.

### Se acepta cuando
- [ ] Administrador consulta usuarios y cambia activo/suspendido.
- [ ] Validar rol en servidor y acceso de usuarios suspendidos; no habilitar alta pública de administradores.

### Evidencia para revisar
Pruebas de rol, suspensión y reactivación.

### Qué practicarás
Tadeo: autorización en servidor y reglas de estado.

**Cierre:** enlazar entrega/PR y esperado/observado. El revisor explica qué comprobó. Código: integrado tras revisión; documentación: guardada y revisada. Las rutas de aplicación indicadas son propuestas y se crean durante la implementación. La base, mapa y fixtures enlazados sí están preparados. Los ejemplos sintéticos no acreditan integración real. Reparto aceptado por Roberto el 13 de octubre; informar disponibilidad/acceso si bloquean el compromiso.

[Empieza aquí · Guía del equipo](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f)

## A30 · Cerrar errores de API, privacidad y reintentos

**Responsable:** Omar Tadeo Gasca Deciga · **Revisor:** Roberto Santana Trujillo

**Semana:** S4 · **Entrega interna:** 2026-11-06 · **Prioridad:** P0

**Requisitos:** RF04, RF05 · **Dependencias para cerrar:** [A13](https://github.com/Santana-R/adaptive-rl-coach/issues/13), [A14](https://github.com/Santana-R/adaptive-rl-coach/issues/14)

### Qué vas a conseguir
Cerrar los casos de fallo de ingestión y recuperación de bloques.

### Empieza por aquí
Reproducir cada fallo del apartado carga/reintentos del contrato.

### Base que ya tienes
Carga A13 y compatibilidad A14.

[docs/base-tecnica.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/base-tecnica.md) · [docs/contratos-api.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/contratos-api.md) · [docs/flujo-pantallas.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/flujo-pantallas.md)

### Dónde trabajar
Pruebas de ingestión, adaptador y docs/fallos-ingestion.md.

### Pasos concretos
1. Simular espera prolongada, fallo temporal, duplicado y lote parcial.
2. Comprobar privacidad y conservación de registros/estados.
3. Documentar cómo retomar un bloque y qué puede limpiar el sistema.

### Entrega y conexión con el equipo
Matriz de fallos, PR de arreglos y evidencia de recuperación.

Partir de A13/A14; registrar esperado/observado y corregir el módulo afectado.

### Ejemplo del resultado
Una carga duplicada externa no se borra; se explica el conflicto y solo se limpian recursos propios permitidos.

### Cómo comprobarlo
409 externo no autoriza borrar replay ajeno; 429/5xx tienen espera limitada; un reintento no duplica el bloque.

### Se acepta cuando
- [ ] Probar espera prolongada, duplicados, caída temporal y carga parcial sin perder estados.
- [ ] Verificar cargas privadas y limpieza solo de archivos propios; documentar cómo retomar un bloque.

### Evidencia para revisar
Matriz de fallos y evidencia del manejo.

### Qué practicarás
Tadeo: recuperación de errores sin perder trazabilidad.

**Cierre:** enlazar entrega/PR y esperado/observado. El revisor explica qué comprobó. Código: integrado tras revisión; documentación: guardada y revisada. Las rutas de aplicación indicadas son propuestas y se crean durante la implementación. La base, mapa y fixtures enlazados sí están preparados. Los ejemplos sintéticos no acreditan integración real. Reparto aceptado por Roberto el 13 de octubre; informar disponibilidad/acceso si bloquean el compromiso.

[Empieza aquí · Guía del equipo](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f)

## A31 · Cerrar historial de objetivos y rango declarado

**Responsable:** David Alonso Torres Guerrero · **Revisor:** Roberto Santana Trujillo

**Semana:** S4 · **Entrega interna:** 2026-11-05 · **Prioridad:** P1

**Requisitos:** RF10, RF11 · **Dependencias para cerrar:** [A16](https://github.com/Santana-R/adaptive-rl-coach/issues/16), [A22](https://github.com/Santana-R/adaptive-rl-coach/issues/22), [A24](https://github.com/Santana-R/adaptive-rl-coach/issues/24)

### Qué vas a conseguir
Conservar historial de metas y rango declarado de forma coherente con planes y reportes.

### Empieza por aquí
Implementar registro de rango declarado con fecha/modalidad/fuente y comprobar historial de metas.

### Base que ya tienes
Objetivos A16, reportes A22 y versiones A24.

[docs/base-tecnica.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/base-tecnica.md) · [docs/contratos-api.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/contratos-api.md) · [docs/flujo-pantallas.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/flujo-pantallas.md)

### Dónde trabajar
Consultas de rank_history y pruebas de integridad temporal.

### Pasos concretos
1. Registrar rango manual con fecha y modalidad.
2. Probar correcciones de metas/sesiones y cambios de catálogo.
3. Comprobar relaciones e historial y entregar datos al reporte A28.

### Entrega y conexión con el equipo
PR y casos de integridad antes/después.

Usar A16/A22/A24; no obtener ni inferir MMR automáticamente.

### Ejemplo del resultado
Una entrada de rango manual conserva fecha, modalidad y fuente declarada; no se presenta como MMR obtenido automáticamente.

### Cómo comprobarlo
Modificar meta/catálogo conserva plan histórico; rango aparece separado de métricas. Entregar datos para reportes el jueves 5.

### Se acepta cuando
- [ ] Registrar rango manual con fecha/modalidad y mostrar su fuente.
- [ ] Conservar historial ante corrección de metas/sesiones y actualización del catálogo.
- [ ] Verificar coherencia de plan, metas y reportes con las nuevas relaciones.

### Evidencia para revisar
Casos de integridad y reporte antes/después.

### Qué practicarás
David: historial temporal y consistencia entre recursos.

**Cierre:** enlazar entrega/PR y esperado/observado. El revisor explica qué comprobó. Código: integrado tras revisión; documentación: guardada y revisada. Las rutas de aplicación indicadas son propuestas y se crean durante la implementación. La base, mapa y fixtures enlazados sí están preparados. Los ejemplos sintéticos no acreditan integración real. Reparto aceptado por Roberto el 13 de octubre; informar disponibilidad/acceso si bloquean el compromiso.

[Empieza aquí · Guía del equipo](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f)

## A32 · Conectar panel admin y CRUD del catálogo

**Responsable:** David Alonso Torres Guerrero · **Revisor:** Luis Enrique Almaguer Castillo

**Semana:** S4 · **Entrega interna:** 2026-11-06 · **Prioridad:** P0

**Requisitos:** RF12 · **Dependencias para cerrar:** [A04](https://github.com/Santana-R/adaptive-rl-coach/issues/4), [A23](https://github.com/Santana-R/adaptive-rl-coach/issues/23), [A29](https://github.com/Santana-R/adaptive-rl-coach/issues/29)

### Qué vas a conseguir
Conectar las tres pantallas administrativas a operaciones autorizadas.

### Empieza por aquí
Crear Panel admin, Usuarios admin y Ejercicios admin usando los componentes de Luis.

### Base que ya tienes
Base visual A04, catálogo A23 y usuarios A29.

[docs/base-tecnica.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/base-tecnica.md) · [docs/contratos-api.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/contratos-api.md) · [docs/flujo-pantallas.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/flujo-pantallas.md)

### Dónde trabajar
public/admin/*.html y JavaScript consumidor de admin/users y exercises.

### Pasos concretos
1. Construir panel, usuarios y ejercicios usando los componentes comunes.
2. Conectar CRUD y activo/suspendido con mensajes de éxito/error.
3. Probar administrador y jugador; pedir a Luis la revisión frontend por PR.

### Entrega y conexión con el equipo
PR y demo de panel, usuarios y ejercicios.

A29 entrega el jueves 5; preparar vistas con los ejemplos antes y conectar la operación real para el corte del 6.

### Ejemplo del resultado
Un administrador desactiva un ejercicio y lo ve actualizado; un jugador no puede ejecutar esa operación.

### Cómo comprobarlo
Admin cambia estado y catálogo y observa respuesta; jugador no accede aunque llame endpoints directamente.

### Se acepta cuando
- [ ] Construir panel, usuarios y ejercicios con mensajes de éxito/error.
- [ ] CRUD de ejercicios y cambio de estado de usuarios funcionan con autorización del servidor.

### Evidencia para revisar
Demo de las tres pantallas administrativas.

### Qué practicarás
David: consumir su catálogo desde interfaz; Luis revisa usabilidad.

**Cierre:** enlazar entrega/PR y esperado/observado. El revisor explica qué comprobó. Código: integrado tras revisión; documentación: guardada y revisada. Las rutas de aplicación indicadas son propuestas y se crean durante la implementación. La base, mapa y fixtures enlazados sí están preparados. Los ejemplos sintéticos no acreditan integración real. Reparto aceptado por Roberto el 13 de octubre; informar disponibilidad/acceso si bloquean el compromiso.

[Empieza aquí · Guía del equipo](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f)

# S5 · Entrega preparada

Resultado de S5: Pruebas cerradas, despliegue reproducible, documentos y ensayo de demostración.

Corte interno: 2026-11-13. Entregas intermedias el jueves; cierre semanal conservado. Reparto aceptado por Roberto; informar bloqueos de disponibilidad/acceso.

| Tarea | Responsable | Revisor | Fecha | Dependencias para cerrar |
| --- | --- | --- | --- | --- |
| [A33](https://github.com/Santana-R/adaptive-rl-coach/issues/33) | Roberto | Tadeo | 2026-11-13 | A25, A26 |
| [A34](https://github.com/Santana-R/adaptive-rl-coach/issues/34) | Roberto | David | 2026-11-13 | A25, A26 |
| [A35](https://github.com/Santana-R/adaptive-rl-coach/issues/35) | Luis | David | 2026-11-13 | A27, A28, A32 |
| [A36](https://github.com/Santana-R/adaptive-rl-coach/issues/36) | Luis | Roberto | 2026-11-13 | A25, A35 |
| [A37](https://github.com/Santana-R/adaptive-rl-coach/issues/37) | Tadeo | David | 2026-11-13 | A29, A30, A32 |
| [A38](https://github.com/Santana-R/adaptive-rl-coach/issues/38) | Tadeo | Roberto | 2026-11-13 | A25, A37 |
| [A39](https://github.com/Santana-R/adaptive-rl-coach/issues/39) | David | Tadeo | 2026-11-13 | A27, A31, A32 |
| [A40](https://github.com/Santana-R/adaptive-rl-coach/issues/40) | David | Luis | 2026-11-13 | A33, A35, A38, A39 |

El contrato y ejemplos permiten empezar en paralelo; los módulos reales deben conectarse antes del cierre. El estado operativo vive en GitHub. En S3 Roberto lleva A17/A18/A19; en S4 Tadeo A25/A29/A30. Conteos no equivalen a horas y no se añaden tareas para igualarlos.

## A33 · Cerrar regresión de métricas, reglas y planes

**Responsable:** Roberto Santana Trujillo · **Revisor:** Omar Tadeo Gasca Deciga

**Semana:** S5 · **Entrega interna:** 2026-11-13 · **Prioridad:** P0

**Requisitos:** RF06, RF07, RF08, RF09 · **Dependencias para cerrar:** [A25](https://github.com/Santana-R/adaptive-rl-coach/issues/25), [A26](https://github.com/Santana-R/adaptive-rl-coach/issues/26)

### Qué vas a conseguir
Cerrar las regresiones del motor y de la función completa de análisis.

### Empieza por aquí
Ejecutar los fixtures revisados sobre funciones, API y pantalla de A19.

### Base que ya tienes
Integración A25 y calibración A26.

[docs/base-tecnica.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/base-tecnica.md) · [docs/contratos-api.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/contratos-api.md) · [docs/flujo-pantallas.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/flujo-pantallas.md)

### Dónde trabajar
docs/resultados-regresion.md y correcciones del motor.

### Pasos concretos
1. Ejecutar casos de normalización, comparación, reglas y planes.
2. Repetir el recorrido de A19 y comprobar que API/pantalla coinciden.
3. Corregir fallos del ciclo obligatorio y enlazar resultados al commit de entrega.

### Entrega y conexión con el equipo
Informe de regresión con versión, esperado/observado y evidencias.

Requiere integración A25 y calibración A26 para el cierre; preparar la matriz antes.

### Ejemplo del resultado
El ejemplo 25% → 30% debe seguir mostrando +5 puntos porcentuales en función, API y pantalla.

### Cómo comprobarlo
Registrar commit, caso, esperado y observado; verificar null, porcentajes, comparación, prioridades y plan sin regresiones.

### Se acepta cuando
- [ ] Ejecutar casos de línea base, ponderación, comparación incompatible, null y plan parcial.
- [ ] Cero fallos abiertos que impidan el ciclo obligatorio; adjuntar resultados al commit de entrega.

### Evidencia para revisar
Informe de pruebas y commit final.

### Qué practicarás
Roberto: comprobar coherencia de una función de extremo a extremo.

**Cierre:** enlazar entrega/PR y esperado/observado. El revisor explica qué comprobó. Código: integrado tras revisión; documentación: guardada y revisada. Las rutas de aplicación indicadas son propuestas y se crean durante la implementación. La base, mapa y fixtures enlazados sí están preparados. Los ejemplos sintéticos no acreditan integración real. Reparto aceptado por Roberto el 13 de octubre; informar disponibilidad/acceso si bloquean el compromiso.

[Empieza aquí · Guía del equipo](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f)

## A34 · Preparar evidencia técnica para PROGSA

**Responsable:** Roberto Santana Trujillo · **Revisor:** David Alonso Torres Guerrero

**Semana:** S5 · **Entrega interna:** 2026-11-13 · **Prioridad:** P1

**Requisitos:** RF07, RF08, RF09 · **Dependencias para cerrar:** [A25](https://github.com/Santana-R/adaptive-rl-coach/issues/25), [A26](https://github.com/Santana-R/adaptive-rl-coach/issues/26)

### Qué vas a conseguir
Preparar evidencia de adaptación y decisiones para PROGSA.

### Empieza por aquí
Organizar evidencia de un nuevo bloque que modifica prioridades y genera otra versión de plan.

### Base que ya tienes
Integración A25, límites A26 e instrucciones vigentes de PROGSA.

[docs/base-tecnica.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/base-tecnica.md) · [docs/contratos-api.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/contratos-api.md) · [docs/flujo-pantallas.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/flujo-pantallas.md)

### Dónde trabajar
Paquete de PROGSA y docs/evidencia-progsa.md.

### Pasos concretos
1. Organizar problema, System Map, reglas, adaptación y ejemplos.
2. Separar prototipo Python y funciones realmente implementadas en la web.
3. Adaptar a la rúbrica confirmada y enlazar evidencia técnica reutilizable.

### Entrega y conexión con el equipo
Documento técnico en el formato que confirme el curso; ejemplos y referencias.

Reutilizar evidencia A25/A26; pendientes de profesor se registran, no se presentan como requisitos confirmados.

### Ejemplo del resultado
Explicar cómo un nuevo bloque cambia el diagnóstico y crea otro plan, con sus límites.

### Cómo comprobarlo
Distinguir prototipo Python de web real; cada afirmación tiene captura/resultado. Ajustar formato a rúbrica confirmada.

### Se acepta cuando
- [ ] Documentar problema, decisiones, System Map, reglas, adaptación y limitaciones.
- [ ] Separar lo demostrado por el prototipo de lo implementado en la web; validar formato con las instrucciones de PROGSA cuando se confirmen.

### Evidencia para revisar
Documento técnico, ejemplos y referencias de evidencia.

### Qué practicarás
Roberto: comunicar decisiones técnicas con evidencia.

**Cierre:** enlazar entrega/PR y esperado/observado. El revisor explica qué comprobó. Código: integrado tras revisión; documentación: guardada y revisada. Las rutas de aplicación indicadas son propuestas y se crean durante la implementación. La base, mapa y fixtures enlazados sí están preparados. Los ejemplos sintéticos no acreditan integración real. Reparto aceptado por Roberto el 13 de octubre; informar disponibilidad/acceso si bloquean el compromiso.

[Empieza aquí · Guía del equipo](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f)

## A35 · Revisar uso, mensajes y accesibilidad

**Responsable:** Luis Enrique Almaguer Castillo · **Revisor:** David Alonso Torres Guerrero

**Semana:** S5 · **Entrega interna:** 2026-11-13 · **Prioridad:** P1

**Requisitos:** RF01–RF12 · **Dependencias para cerrar:** [A27](https://github.com/Santana-R/adaptive-rl-coach/issues/27), [A28](https://github.com/Santana-R/adaptive-rl-coach/issues/28), [A32](https://github.com/Santana-R/adaptive-rl-coach/issues/32)

### Qué vas a conseguir
Eliminar obstáculos de uso en los recorridos de jugador y administrador.

### Empieza por aquí
Recorrer con teclado Registro, Carga, Análisis y las vistas administrativas.

### Base que ya tienes
Pantallas A27, A28 y A32.

[docs/base-tecnica.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/base-tecnica.md) · [docs/contratos-api.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/contratos-api.md) · [docs/flujo-pantallas.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/flujo-pantallas.md)

### Dónde trabajar
docs/revision-uso.md y fixes de interfaz.

### Pasos concretos
1. Revisar teclado, foco, contraste, etiquetas y mensajes en escritorio.
2. Pedir al revisor que ejecute los recorridos con instrucciones y reporte hallazgos de forma asíncrona.
3. Corregir bloqueos y registrar capturas finales.

### Entrega y conexión con el equipo
Checklist de uso y PR de correcciones.

Usar A27/A28/A32 conectados. La revisión se puede realizar de forma asíncrona.

### Ejemplo del resultado
Un error de formulario identifica el campo y conserva los valores que el jugador ya escribió.

### Cómo comprobarlo
Foco, etiquetas, errores y valores conservados se comprueban; registrar captura y resultado por bloqueo corregido.

### Se acepta cuando
- [ ] Revisar etiquetas, teclado, contraste, foco, errores y visualización en escritorio.
- [ ] Probar recorridos jugador/admin y ayuda con otra persona del equipo; cerrar bloqueos de uso.

### Evidencia para revisar
Lista de revisión y capturas finales.

### Qué practicarás
Luis: evaluar la interfaz con casos de uso completos.

**Cierre:** enlazar entrega/PR y esperado/observado. El revisor explica qué comprobó. Código: integrado tras revisión; documentación: guardada y revisada. Las rutas de aplicación indicadas son propuestas y se crean durante la implementación. La base, mapa y fixtures enlazados sí están preparados. Los ejemplos sintéticos no acreditan integración real. Reparto aceptado por Roberto el 13 de octubre; informar disponibilidad/acceso si bloquean el compromiso.

[Empieza aquí · Guía del equipo](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f)

## A36 · Preparar demo, capturas y ensayo

**Responsable:** Luis Enrique Almaguer Castillo · **Revisor:** Roberto Santana Trujillo

**Semana:** S5 · **Entrega interna:** 2026-11-13 · **Prioridad:** P1

**Requisitos:** RF01–RF12 · **Dependencias para cerrar:** [A25](https://github.com/Santana-R/adaptive-rl-coach/issues/25), [A35](https://github.com/Santana-R/adaptive-rl-coach/issues/35)

### Qué vas a conseguir
Preparar una demostración reproducible y una explicación por integrante.

### Empieza por aquí
Escribir el guion del ciclo y asignar a cada dueño la explicación de su módulo y una conexión.

### Base que ya tienes
Ciclo A25, revisión A35 y rúbrica que confirme el profesor.

[docs/base-tecnica.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/base-tecnica.md) · [docs/contratos-api.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/contratos-api.md) · [docs/flujo-pantallas.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/flujo-pantallas.md)

### Dónde trabajar
docs/demo.md, capturas y respaldo de demostración.

### Pasos concretos
1. Escribir guion de ocho a diez minutos ajustable a la rúbrica.
2. Preparar capturas y datos de respaldo identificados como demostración.
3. Cada integrante prepara su explicación breve; cronometrar el recorrido en el formato que permita su disponibilidad.

### Entrega y conexión con el equipo
Guion, capturas y resultado del ensayo; no requiere reunión presencial.

Ensayar después de A25/A35; las explicaciones pueden prepararse por escrito sin reunión presencial.

### Ejemplo del resultado
Mostrar primer bloque, diagnóstico, plan, sesión y comparación; cada dueño explica su pieza y una conexión con otra.

### Cómo comprobarlo
Recorrido cronometrado de 8–10 minutos ajustable al profesor; datos simulados se identifican y cada enlace funciona.

### Se acepta cuando
- [ ] Crear guion de demostración de ocho a diez minutos ajustable a la rúbrica.
- [ ] Cada integrante explica su módulo; preparar datos de respaldo marcados como demostración si la API no está disponible.

### Evidencia para revisar
Guion, capturas y ensayo cronometrado.

### Qué practicarás
Luis: explicar el recorrido del producto y coordinar la presentación.

**Cierre:** enlazar entrega/PR y esperado/observado. El revisor explica qué comprobó. Código: integrado tras revisión; documentación: guardada y revisada. Las rutas de aplicación indicadas son propuestas y se crean durante la implementación. La base, mapa y fixtures enlazados sí están preparados. Los ejemplos sintéticos no acreditan integración real. Reparto aceptado por Roberto el 13 de octubre; informar disponibilidad/acceso si bloquean el compromiso.

[Empieza aquí · Guía del equipo](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f)

## A37 · Verificar seguridad y privacidad funcional

**Responsable:** Omar Tadeo Gasca Deciga · **Revisor:** David Alonso Torres Guerrero

**Semana:** S5 · **Entrega interna:** 2026-11-13 · **Prioridad:** P0

**Requisitos:** RF01, RF02, RF05, RF12 · **Dependencias para cerrar:** [A29](https://github.com/Santana-R/adaptive-rl-coach/issues/29), [A30](https://github.com/Santana-R/adaptive-rl-coach/issues/30), [A32](https://github.com/Santana-R/adaptive-rl-coach/issues/32)

### Qué vas a conseguir
Verificar permisos y privacidad en los endpoints reales.

### Empieza por aquí
Preparar usuarios A/B, administrador y suspendido en desarrollo y llamar directamente a endpoints.

### Base que ya tienes
Administración A29, fallos A30 y panel A32.

[docs/base-tecnica.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/base-tecnica.md) · [docs/contratos-api.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/contratos-api.md) · [docs/flujo-pantallas.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/flujo-pantallas.md)

### Dónde trabajar
docs/permisos-verificados.md y pruebas/fixes de autorización.

### Pasos concretos
1. Probar sin sesión, jugador A/B, administrador y suspendido.
2. Comprobar validación de archivos/entradas y mensajes sin datos privados.
3. Verificar que secretos permanecen en entorno y que frontend/logs no los exponen.

### Entrega y conexión con el equipo
Matriz de autorización, comprobación de secretos y arreglos necesarios.

Verificar A29/A30/A32 reales. Probar RLS y middleware, no solo esconder botones.

### Ejemplo del resultado
Copiar un ID de bloque de otro jugador no permite ver ni editar su análisis.

### Cómo comprobarlo
Sin sesión 401; rol indebido 403; recurso privado ajeno no se revela; claves privadas fuera del navegador/repositorio/logs.

### Se acepta cuando
- [ ] Comprobar acceso directo a endpoints con jugador A/B/admin/suspendido y sin token.
- [ ] Validar entradas, archivos y errores; credenciales solo en entorno del servidor y logs sin datos privados.

### Evidencia para revisar
Matriz de autorización y comprobación de secretos.

### Qué practicarás
Tadeo: probar permisos a través de peticiones directas.

**Cierre:** enlazar entrega/PR y esperado/observado. El revisor explica qué comprobó. Código: integrado tras revisión; documentación: guardada y revisada. Las rutas de aplicación indicadas son propuestas y se crean durante la implementación. La base, mapa y fixtures enlazados sí están preparados. Los ejemplos sintéticos no acreditan integración real. Reparto aceptado por Roberto el 13 de octubre; informar disponibilidad/acceso si bloquean el compromiso.

[Empieza aquí · Guía del equipo](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f)

## A38 · Preparar ejecución y despliegue reproducibles

**Responsable:** Omar Tadeo Gasca Deciga · **Revisor:** Roberto Santana Trujillo

**Semana:** S5 · **Entrega interna:** 2026-11-13 · **Prioridad:** P0

**Requisitos:** RF01–RF12 · **Dependencias para cerrar:** [A25](https://github.com/Santana-R/adaptive-rl-coach/issues/25), [A37](https://github.com/Santana-R/adaptive-rl-coach/issues/37)

### Qué vas a conseguir
Permitir que otra persona ejecute y demuestre la versión de entrega.

### Empieza por aquí
Seguir el README desde una copia limpia y documentar los pasos que falten.

### Base que ya tienes
Integración A25 y comprobaciones A37.

[docs/base-tecnica.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/base-tecnica.md) · [docs/contratos-api.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/contratos-api.md) · [docs/flujo-pantallas.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/flujo-pantallas.md)

### Dónde trabajar
README.md, .env.example, migraciones, lockfile y registro de ejecución.

### Pasos concretos
1. Documentar instalación, versiones, migraciones y variables de entorno reales.
2. Validar el entorno elegido, OAuth y conexiones; conservar ejecución local de respaldo.
3. Pedir al revisor ejecutar desde cero de forma asíncrona y crear tag después de validar.

### Entrega y conexión con el equipo
README reproducible, registro de ejecución y tag final.

Usar A25/A37 validados; acordar el alojamiento y conservar respaldo local.

### Ejemplo del resultado
Un compañero sigue el README en una copia limpia y completa el recorrido principal sin indicaciones adicionales.

### Cómo comprobarlo
Otro integrante instala y ejecuta el ciclo sin instrucciones adicionales; OAuth y conexiones funcionan en el entorno elegido.

### Se acepta cuando
- [ ] Otra persona ejecuta el proyecto desde cero con README, migraciones y .env.example.
- [ ] Configurar entorno de entrega elegido por el equipo, validar OAuth y conexiones reales; conservar ruta de respaldo local.
- [ ] Crear tag de entrega solo después de comprobar la versión final.

### Evidencia para revisar
URL o ejecución documentada, smoke test y tag.

### Qué practicarás
Tadeo: reproducibilidad, entorno e integración operativa.

**Cierre:** enlazar entrega/PR y esperado/observado. El revisor explica qué comprobó. Código: integrado tras revisión; documentación: guardada y revisada. Las rutas de aplicación indicadas son propuestas y se crean durante la implementación. La base, mapa y fixtures enlazados sí están preparados. Los ejemplos sintéticos no acreditan integración real. Reparto aceptado por Roberto el 13 de octubre; informar disponibilidad/acceso si bloquean el compromiso.

[Empieza aquí · Guía del equipo](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f)

## A39 · Auditar los tres CRUD y la integridad

**Responsable:** David Alonso Torres Guerrero · **Revisor:** Omar Tadeo Gasca Deciga

**Semana:** S5 · **Entrega interna:** 2026-11-13 · **Prioridad:** P0

**Requisitos:** RF09, RF10, RF12 · **Dependencias para cerrar:** [A27](https://github.com/Santana-R/adaptive-rl-coach/issues/27), [A31](https://github.com/Santana-R/adaptive-rl-coach/issues/31), [A32](https://github.com/Santana-R/adaptive-rl-coach/issues/32)

### Qué vas a conseguir
Comprobar los tres CRUD y la integridad después de cambios.

### Empieza por aquí
Ejecutar alta/consulta/edición/eliminación o archivo en objetivos, sesiones y ejercicios.

### Base que ya tienes
Interfaz A27, historial A31 y catálogo/admin A32.

[docs/base-tecnica.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/base-tecnica.md) · [docs/contratos-api.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/contratos-api.md) · [docs/flujo-pantallas.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/flujo-pantallas.md)

### Dónde trabajar
docs/resultados-crud.md y consultas de integridad.

### Pasos concretos
1. Ejecutar alta, consulta, edición y eliminación/archivo permitidos de objetivos, sesiones y ejercicios.
2. Comprobar propiedad, relaciones y conservación de versiones.
3. Preparar seed limpio de demo y registrar cada resultado.

### Entrega y conexión con el equipo
Matriz CRUD y consultas de integridad.

Recorridos A27/A31/A32 reales; registrar evidencia antes/después.

### Ejemplo del resultado
Eliminar una sesión recalcula entrenamiento; archivar una meta no borra el plan histórico.

### Cómo comprobarlo
Versiones e historial sobreviven cambios; otro propietario no opera sobre los datos; semilla de demo contiene relaciones válidas.

### Se acepta cuando
- [ ] Ejecutar altas, consultas, cambios, archivo/eliminación permitida en objetivos, sesiones y ejercicios.
- [ ] Comprobar propietarios, relaciones y conservación de snapshots; preparar seed limpio de demo.

### Evidencia para revisar
Matriz CRUD y consultas de integridad.

### Qué practicarás
David: pruebas de persistencia frente a recorridos reales.

**Cierre:** enlazar entrega/PR y esperado/observado. El revisor explica qué comprobó. Código: integrado tras revisión; documentación: guardada y revisada. Las rutas de aplicación indicadas son propuestas y se crean durante la implementación. La base, mapa y fixtures enlazados sí están preparados. Los ejemplos sintéticos no acreditan integración real. Reparto aceptado por Roberto el 13 de octubre; informar disponibilidad/acceso si bloquean el compromiso.

[Empieza aquí · Guía del equipo](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f)

## A40 · Preparar entrega LBPWEB y checklist común

**Responsable:** David Alonso Torres Guerrero · **Revisor:** Luis Enrique Almaguer Castillo

**Semana:** S5 · **Entrega interna:** 2026-11-13 · **Prioridad:** P0

**Requisitos:** RF01–RF12 · **Dependencias para cerrar:** [A33](https://github.com/Santana-R/adaptive-rl-coach/issues/33), [A35](https://github.com/Santana-R/adaptive-rl-coach/issues/35), [A38](https://github.com/Santana-R/adaptive-rl-coach/issues/38), [A39](https://github.com/Santana-R/adaptive-rl-coach/issues/39)

### Qué vas a conseguir
Preparar la entrega de LBPWEB y el checklist común con evidencia localizable.

### Empieza por aquí
Abrir la trazabilidad preparada y añadir enlaces a las evidencias reales de cada RF.

### Base que ya tienes
Regresión A33, uso A35, ejecución A38 e integridad A39.

[docs/base-tecnica.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/base-tecnica.md) · [docs/contratos-api.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/contratos-api.md) · [docs/flujo-pantallas.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/flujo-pantallas.md)

### Dónde trabajar
planning/trazabilidad-rf.csv y paquete final LBPWEB.

### Pasos concretos
1. Vincular cada RF a pantalla, endpoint, datos, tarea y prueba.
2. Reunir instalación, ERD vigente, capturas y requisitos de formato confirmados.
3. Pedir revisión de los cuatro antes del corte y conservar una copia estable.

### Entrega y conexión con el equipo
Paquete/checklist de entrega y referencias por materia.

Cerrar con A33/A35/A38/A39 y fechas/rúbricas confirmadas. La matriz preparada reduce trabajo documental.

### Ejemplo del resultado
RF03 apunta a la pantalla Carga, su endpoint y una evidencia de cinco replays reales.

### Cómo comprobarlo
Doce RF y trece pantallas enlazan implementación y comprobación; instalación/ERD/formato/nombres están revisados.

### Se acepta cuando
- [ ] Vincular cada RF a pantalla, endpoint, datos, tarea y evidencia.
- [ ] Reunir instalación, ERD vigente, capturas y documentación requerida; confirmar fecha y rúbrica de ambas materias.
- [ ] Cerrar checklist en conjunto el viernes 13 y guardar una copia estable.

### Evidencia para revisar
Paquete de entrega y checklist firmado por los cuatro.

### Qué practicarás
David: trazabilidad entre requisito y evidencia.

**Cierre:** enlazar entrega/PR y esperado/observado. El revisor explica qué comprobó. Código: integrado tras revisión; documentación: guardada y revisada. Las rutas de aplicación indicadas son propuestas y se crean durante la implementación. La base, mapa y fixtures enlazados sí están preparados. Los ejemplos sintéticos no acreditan integración real. Reparto aceptado por Roberto el 13 de octubre; informar disponibilidad/acceso si bloquean el compromiso.

[Empieza aquí · Guía del equipo](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f)

# S6 · Reserva de entrega

Resultado de S6: Correcciones puntuales y entrega en la fecha que confirmen los profesores.

Corte interno: 2026-11-20. Entregas intermedias el jueves; cierre semanal conservado. Reparto aceptado por Roberto; informar bloqueos de disponibilidad/acceso.

| Tarea | Responsable | Revisor | Fecha | Dependencias para cerrar |
| --- | --- | --- | --- | --- |
| [B01](https://github.com/Santana-R/adaptive-rl-coach/issues/41) | Roberto | Tadeo | 2026-11-20 | A33 |
| [B02](https://github.com/Santana-R/adaptive-rl-coach/issues/42) | Luis | David | 2026-11-20 | A36 |
| [B03](https://github.com/Santana-R/adaptive-rl-coach/issues/43) | Tadeo | Roberto | 2026-11-20 | A38 |
| [B04](https://github.com/Santana-R/adaptive-rl-coach/issues/44) | David | Luis | 2026-11-20 | A40 |

El contrato y ejemplos permiten empezar en paralelo; los módulos reales deben conectarse antes del cierre. El estado operativo vive en GitHub. En S3 Roberto lleva A17/A18/A19; en S4 Tadeo A25/A29/A30. Conteos no equivalen a horas y no se añaden tareas para igualarlos.

## B01 · Corregir defectos de motor si aparecen

**Responsable:** Roberto Santana Trujillo · **Revisor:** Omar Tadeo Gasca Deciga

**Semana:** S6 · **Entrega interna:** 2026-11-20 · **Prioridad:** P1

**Requisitos:** RF07, RF08, RF09 · **Dependencias para cerrar:** [A33](https://github.com/Santana-R/adaptive-rl-coach/issues/33)

**Reserva condicional:** activar solo ante la necesidad indicada.

### Qué vas a conseguir
Corregir únicamente fallos del motor que aparezcan en la versión final.

### Empieza por aquí
Activar solo si se registra un defecto reproducible del motor después de A33.

### Base que ya tienes
Regresión A33 y defecto confirmado.

[docs/base-tecnica.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/base-tecnica.md) · [docs/contratos-api.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/contratos-api.md) · [docs/flujo-pantallas.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/flujo-pantallas.md)

### Dónde trabajar
Módulo afectado, PR de arreglo y caso de regresión.

### Pasos concretos
1. Registrar reproducción y resultado esperado.
2. Corregir el caso afectado y repetir su comprobación.
3. Adjuntar evidencia sin ampliar funciones.

### Entrega y conexión con el equipo
PR del arreglo y prueba del defecto.

Reserva: no comenzar si no existe defecto confirmado.

### Ejemplo del resultado
Si un empate altera el orden entre ejecuciones, corregirlo y repetir ese caso.

### Cómo comprobarlo
Reproducir antes, corregir y comprobar el mismo caso después.

### Se acepta cuando
- [ ] Atender solo defectos de la versión de entrega; repetir los casos afectados.

### Evidencia para revisar
Issue y prueba del arreglo.

### Qué practicarás
Roberto: corrección localizada y regresión.

**Cierre:** enlazar entrega/PR y esperado/observado. El revisor explica qué comprobó. Código: integrado tras revisión; documentación: guardada y revisada. Las rutas de aplicación indicadas son propuestas y se crean durante la implementación. La base, mapa y fixtures enlazados sí están preparados. Los ejemplos sintéticos no acreditan integración real. Reparto aceptado por Roberto el 13 de octubre; informar disponibilidad/acceso si bloquean el compromiso.

[Empieza aquí · Guía del equipo](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f)

## B02 · Ajustar presentación y experiencia si se solicita

**Responsable:** Luis Enrique Almaguer Castillo · **Revisor:** David Alonso Torres Guerrero

**Semana:** S6 · **Entrega interna:** 2026-11-20 · **Prioridad:** P1

**Requisitos:** RF01–RF12 · **Dependencias para cerrar:** [A36](https://github.com/Santana-R/adaptive-rl-coach/issues/36)

**Reserva condicional:** activar solo ante la necesidad indicada.

### Qué vas a conseguir
Aplicar ajustes de presentación o uso solicitados para la entrega.

### Empieza por aquí
Activar solo ante una observación concreta del ensayo o profesor.

### Base que ya tienes
Guion A36 y observación concreta del ensayo/profesor.

[docs/base-tecnica.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/base-tecnica.md) · [docs/contratos-api.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/contratos-api.md) · [docs/flujo-pantallas.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/flujo-pantallas.md)

### Dónde trabajar
Vista/guion afectado y captura final.

### Pasos concretos
1. Registrar el ajuste solicitado.
2. Modificar mensaje, vista o guion dentro del alcance.
3. Comprobarlo y guardar captura.

### Entrega y conexión con el equipo
Captura o guion actualizado y evidencia del ajuste.

Reserva: no comenzar si no existe ajuste solicitado.

### Ejemplo del resultado
Aclarar el texto de una gráfica sin añadir otra función.

### Cómo comprobarlo
La observación se resuelve y queda evidencia; conservar alcance.

### Se acepta cuando
- [ ] Aplicar correcciones del ensayo o profesor sin ampliar el alcance.

### Evidencia para revisar
Capturas o guion actualizado.

### Qué practicarás
Luis: iteración de interfaz a partir de feedback.

**Cierre:** enlazar entrega/PR y esperado/observado. El revisor explica qué comprobó. Código: integrado tras revisión; documentación: guardada y revisada. Las rutas de aplicación indicadas son propuestas y se crean durante la implementación. La base, mapa y fixtures enlazados sí están preparados. Los ejemplos sintéticos no acreditan integración real. Reparto aceptado por Roberto el 13 de octubre; informar disponibilidad/acceso si bloquean el compromiso.

[Empieza aquí · Guía del equipo](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f)

## B03 · Verificar entorno antes de entregar

**Responsable:** Omar Tadeo Gasca Deciga · **Revisor:** Roberto Santana Trujillo

**Semana:** S6 · **Entrega interna:** 2026-11-20 · **Prioridad:** P1

**Requisitos:** RF01–RF12 · **Dependencias para cerrar:** [A38](https://github.com/Santana-R/adaptive-rl-coach/issues/38)

**Reserva condicional:** activar solo ante la necesidad indicada.

### Qué vas a conseguir
Comprobar el entorno en la fecha real de entrega.

### Empieza por aquí
Activar al conocer la fecha real y ejecutar la versión de A38.

### Base que ya tienes
Ejecución A38 y fecha confirmada.

[docs/base-tecnica.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/base-tecnica.md) · [docs/contratos-api.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/contratos-api.md) · [docs/flujo-pantallas.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/flujo-pantallas.md)

### Dónde trabajar
Registro de verificación y respaldo local.

### Pasos concretos
1. Ejecutar el recorrido principal con la versión elegida.
2. Comprobar conexión y respaldo local.
3. Registrar resultado y atender únicamente bloqueos de entrega.

### Entrega y conexión con el equipo
Registro de comprobación rápida de la versión final.

Reserva operativa condicionada a la entrega confirmada.

### Ejemplo del resultado
Abrir la app y verificar login, carga y consulta antes de presentarla.

### Cómo comprobarlo
Login, carga y consulta funcionan en la versión que se presentará.

### Se acepta cuando
- [ ] Repetir recorrido principal y respaldo local en la fecha confirmada.

### Evidencia para revisar
Smoke test de la versión de entrega.

### Qué practicarás
Tadeo: verificación operativa de entrega.

**Cierre:** enlazar entrega/PR y esperado/observado. El revisor explica qué comprobó. Código: integrado tras revisión; documentación: guardada y revisada. Las rutas de aplicación indicadas son propuestas y se crean durante la implementación. La base, mapa y fixtures enlazados sí están preparados. Los ejemplos sintéticos no acreditan integración real. Reparto aceptado por Roberto el 13 de octubre; informar disponibilidad/acceso si bloquean el compromiso.

[Empieza aquí · Guía del equipo](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f)

## B04 · Revisar paquete y confirmar recepción

**Responsable:** David Alonso Torres Guerrero · **Revisor:** Luis Enrique Almaguer Castillo

**Semana:** S6 · **Entrega interna:** 2026-11-20 · **Prioridad:** P1

**Requisitos:** RF01–RF12 · **Dependencias para cerrar:** [A40](https://github.com/Santana-R/adaptive-rl-coach/issues/40)

**Reserva condicional:** activar solo ante la necesidad indicada.

### Qué vas a conseguir
Comprobar el paquete final y registrar la entrega cuando ocurra.

### Empieza por aquí
Activar al cerrar el paquete y conocer el mecanismo de entrega.

### Base que ya tienes
Checklist A40 y formato/fecha confirmados.

[docs/base-tecnica.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/base-tecnica.md) · [docs/contratos-api.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/contratos-api.md) · [docs/flujo-pantallas.md](https://github.com/Santana-R/adaptive-rl-coach/blob/main/docs/flujo-pantallas.md)

### Dónde trabajar
Checklist final y comprobante de recepción cuando exista.

### Pasos concretos
1. Revisar nombres, enlaces, evidencias y formatos por materia.
2. Comprobar la copia estable y el acceso del destinatario cuando esté autorizado.
3. Guardar comprobante de recepción si existe.

### Entrega y conexión con el equipo
Checklist final y comprobante cuando se entregue.

Reserva documental; un paquete preparado no equivale a enviado.

### Ejemplo del resultado
Un enlace de evidencia abre la versión utilizada en la presentación.

### Cómo comprobarlo
Nombres/enlaces/versiones coinciden y el comprobante corresponde a la entrega real.

### Se acepta cuando
- [ ] Comprobar nombres, evidencias y formatos por materia; registrar la fecha real de entrega.

### Evidencia para revisar
Checklist y comprobante de entrega cuando exista.

### Qué practicarás
David: cierre documental comprobable.

**Cierre:** enlazar entrega/PR y esperado/observado. El revisor explica qué comprobó. Código: integrado tras revisión; documentación: guardada y revisada. Las rutas de aplicación indicadas son propuestas y se crean durante la implementación. La base, mapa y fixtures enlazados sí están preparados. Los ejemplos sintéticos no acreditan integración real. Reparto aceptado por Roberto el 13 de octubre; informar disponibilidad/acceso si bloquean el compromiso.

[Empieza aquí · Guía del equipo](https://app.notion.com/p/3f7dd7559dd881bfbbceeff2d19b9d5f)
