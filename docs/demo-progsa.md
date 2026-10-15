# Cascarón HTML para PROGSA

Tres pantallas navegables del mismo proyecto: **Carga → Análisis → Plan**. Esta entrega ofrece una interfaz ejecutable con datos sintéticos. Sirve como punto de partida para conectar servidor, métricas y persistencia después.

## Abrir la demostración

La forma más sencilla, también sin internet:

1. Descargar el ZIP de la rama del PR con **Code → Download ZIP**, o cambiar a `feat/progsa-cascaron-html` en GitHub Desktop.
2. Extraer el ZIP si corresponde. Mantener juntas las carpetas `public/css`, `public/js` y `public/vendor`.
3. Abrir `public/carga.html` con Chrome, Edge o Firefox. No requiere npm, instalación de dependencias, claves ni cuentas.
4. Pulsar **Usar cinco replays de ejemplo** y después **Ver análisis de ejemplo**.

También se puede servir localmente desde la raíz del repositorio:

```bash
python -m http.server 8000 --directory public
```

En Windows, si el comando disponible es `py`, usar `py -m http.server 8000 --directory public`. Abrir `http://localhost:8000/carga.html`. Para detener el servidor, Ctrl+C.

## Guion de presentación de 3–4 minutos

| Paso | Qué hacer | Qué explicar |
| --- | --- | --- |
| 1 · Entrada | Abrir Carga y pulsar «Usar cinco replays de ejemplo». | El sistema agrupa cinco partidas del mismo jugador y modalidad. El contexto y objetivo aparecen a la derecha. |
| 2 · Línea base | Pulsar «Ver análisis de ejemplo». | El primer bloque establece el punto de partida: no muestra una comparación inexistente. Aparecen boost y precisión como prioridades. |
| 3 · Primera respuesta | Abrir «Ver mi plan de entrenamiento». | El plan distribuye 40 minutos entre calentamiento, rutas de boost y tiros; cada ejercicio tiene finalidad e instrucciones. |
| 4 · Retroalimentación | Cambiar Escenario a «Bloque posterior» y abrir Análisis. | La precisión pasa de 25 % a 30 %: son +5 puntos porcentuales. El tiempo con boost bajo pasa de 39 % a 24 %. Se conservan contexto y modalidad. |
| 5 · Adaptación | Abrir Plan. | La referencia ilustrativa deja boost en mantenimiento y concentra más tiempo en precisión. Se explica qué cambió. |
| 6 · Contexto | Elegir 20 minutos. Consultar después una versión anterior con el selector. | La rutina se reorganiza para caber en 20 minutos. La versión de 40 minutos conserva su contenido. |

Cerrar explicando: «Esta es la interfaz y una demostración con datos de ejemplo. En la aplicación final Ballchasing aportará las estadísticas y las reglas deberán validarse. Las sesiones registran entrenamiento; los nuevos bloques permiten medir el rendimiento».

Si quieren repetir el recorrido, **Restablecer** vuelve a primer bloque, 40 minutos y una única versión de ejemplo.

## Qué funciona en esta entrega

- Navegación entre las tres vistas con escenario, minutos y versiones conservados en la URL. Funciona incluso con apertura directa de archivos.
- Selector local de archivos y arrastrar/soltar: valida exactamente cinco, extensión `.replay` y duplicados por nombre/tamaño; permite quitar un archivo.
- Carga de cinco nombres ficticios para recorrer la demo sin disponer de replays.
- Dos conjuntos sintéticos de cinco partidas, cálculos de precisión por totales y media de boost ponderada por duración.
- Línea base frente a comparación posterior, gráfico con selector de métrica, tabla accesible y prioridades con evidencia desplegable.
- Planes de 20/40 minutos, instrucciones desplegables y consulta de versiones de ejemplo anteriores durante el recorrido.
- Estilos adaptables a móvil, navegación por teclado, etiquetas y mensajes que no dependen solo del color.
- Bootstrap, jQuery y Chart.js guardados localmente con versiones fijadas y sus licencias.

## Qué permanece para la implementación

La selección local no lee ni analiza el contenido de los replays, no comprueba identidad real y no los envía. La muestra no llama a Ballchasing, no autentica ni guarda en base de datos. Las versiones se reconstruyen con los datos de ejemplo y la URL, no son historial persistido del usuario. Una URL directa sin el contexto del recorrido abre su escenario inicial; un enlace copiado con los parámetros conserva ese recorrido.

Las dos reglas son exclusivamente ilustrativas: `boost_low_pct > 30` y `shooting_pct < 35`, versión `demo.rules.v1`. **No se presentan como umbrales calibrados ni como la configuración verificada del prototipo Python.** Su finalidad es mostrar cómo una condición cambia una recomendación. Los números son sintéticos y no describen a Roberto ni a otro jugador real.

La mejora entre bloques no demuestra que el ejercicio la causó. Los porcentajes de boost son una señal para orientar la práctica, no una detección automática de errores de rotación o intención.

## Cómo encaja con el reparto

| Trabajo existente | Qué aporta el cascarón | Qué falta para completar la tarea |
| --- | --- | --- |
| A04 · Luis | Estilos, navegación y componentes compartidos. | Completar las páginas públicas/roles que pide A04 y su revisión. |
| A11 · Luis | Formulario y lista de replays con validaciones de interfaz. | API real de carga, procesamiento, recuperación e historial. |
| A19 · Roberto, revisa Luis | Pantalla de métricas/comparación y separación del origen de datos. | Consulta autorizada, motor real, endpoint y prueba datos → API → pantalla. |
| A27 · Luis | Vista de plan, ejercicios y selector de versiones de ejemplo. | Planes persistidos, sesiones y operaciones reales sobre sus versiones. |

Tadeo mantiene servidor/Ballchasing e integración; David datos/Auth/historial. Esta muestra es avance parcial y no cierra automáticamente A04/A11/A19/A27, no reasigna responsables ni cambia sus fechas. PR relacionado con #4, #11, #19 y #27.

## Archivos y puntos de conexión

| Archivo | Responsabilidad |
| --- | --- |
| `public/carga.html` | Estructura de Carga y contexto precargado. |
| `public/analisis.html` | Estructura de métricas, gráfica, tabla y prioridades. |
| `public/plan.html` | Estructura del plan y sus instrucciones. |
| `public/css/app.css` | Diseño y componentes compartidos. |
| `public/js/demo-data.js` | Datos sintéticos, normalización y reglas ilustrativas como funciones separadas. |
| `public/js/demo-service.js` | Origen de datos de ejemplo; punto para conectar el servicio real después. |
| `public/js/app.js` | Eventos de interfaz, navegación, presentación y estado del recorrido. |
| `public/vendor/README.md` | Versiones, origen, integridad y licencias de dependencias. |

Las funciones `loadAnalysis` y `loadPlan` devuelven un sobre `{ data, meta }` siguiendo la convención del contrato inicial. Este es un modelo de presentación de ejemplo: A19 debe mapear las respuestas reales, gestionar espera/error y probar permisos. Los controladores no contienen claves ni llamadas al proveedor. Sustituir el origen y el mapeo de datos permite conservar HTML/CSS/componentes; las reglas de demo no sustituyen el motor definitivo.

Referencias internas: [contrato inicial](contratos-api.md), [flujo de pantallas](flujo-pantallas.md), [base técnica](base-tecnica.md). Referencias académicas: Fase 1, secciones 6.6/6.7/6.9; Sprint 1, ciclo de comparación y ajuste del entrenamiento.

## Comprobaciones de desarrollo

El uso de la demo no necesita Node. Para repetir los controles de navegador, con Playwright instalado en un entorno de desarrollo:

```bash
python -m http.server 4173 --directory public
node tests/demo-smoke.cjs
```

El script comprueba validación de archivos, navegación, comparación, reparto de minutos, versiones anteriores, apertura directa sin red, ausencia de peticiones externas y anchos de 390 px. Guarda capturas en un directorio temporal o en `DEMO_QA_DIR`. Las pruebas de permisos y API real corresponden a las tareas de implementación.


## Capturas de referencia

### Carga

![Carga de cinco replays de ejemplo](demo-capturas/carga.png)

### Análisis de un bloque posterior

![Comparación, prioridades y evidencia de ejemplo](demo-capturas/analisis.png)

### Plan adaptado a 20 minutos

![Versión de plan con distribución de 20 minutos](demo-capturas/plan.png)
