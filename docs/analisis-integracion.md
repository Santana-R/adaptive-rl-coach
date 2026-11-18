# Análisis: del dato a la pantalla · A19

**Actualización del 18 de noviembre de 2026:** para el estado vigente, consultar [estado actual](estado-actual.md) y [persistencia de medidas](persistencia-mediciones.md). Este documento conserva evidencia y decisiones de su fecha; las limitaciones anteriores de almacenamiento de boost/defensa se corrigieron para las nuevas cargas. Los registros históricos mantienen sus faltantes.

La pantalla oficial de Luis (`public/sitio/html/analisis.html`, integrada en PR #63) recibe ahora el análisis calculado por el motor. Se conserva su distribución, navegación, colores y componentes; Roberto añade servicio/API y conexión HTTP con asistencia de IA bajo su Release. Esta entrega no acredita consultas de bloques persistidos ni un análisis guardado.

## Qué hace cada archivo

| Archivo | Responsabilidad |
| --- | --- |
| `src/services/analysis.js` | Normaliza el bloque con A14/A09, resuelve la comparación A10 y evalúa las reglas A17. No accede a base de datos. |
| `src/routes/analysis.js` | Comprueba sesión/propiedad, obtiene los bloques desde un repositorio y devuelve el resultado HTTP. También contiene la demo local separada. |
| `public/js/analysis.js` | Pide el JSON y presenta métricas, gráfica, tabla, faltantes y evidencia en la vista de Luis. No decide los umbrales deportivos. |
| `planning/fixtures/analysis-demo.json` | Entradas sintéticas de goles/tiros por partida. Son datos para calcular, no respuestas fijas por escenario. |
| `src/services/analysis-demo.js` | Prepara cinco respuestas sintéticas por bloque para pasarlas al mismo servicio de análisis. |

Al seleccionar «Bloque posterior», el navegador solicita `/api/v1/demo/analysis?case=followup`. El servicio suma seis goles y veinte tiros, calcula 30 %, compara con 25 % y devuelve +5 puntos porcentuales. A17 aplica el mínimo de 15 tiros para 2v2 y eficiencia ≤ 30 %. El navegador presenta ese resultado; cambiar los conteos cambia el análisis, sin editar la interfaz.

## Probar en local

Con Node.js 22 o posterior y las dependencias instaladas:

```sh
npm ci
# macOS / Linux
ANALYSIS_DEMO_ENABLED=true npm start
```

En PowerShell: `$env:ANALYSIS_DEMO_ENABLED="true"; npm start`. Abrir `http://127.0.0.1:3000/sitio/html/analisis.html`.

| Selector | Resultado comprobado |
| --- | --- |
| Primer bloque | 5 goles / 20 tiros = 25 %; línea base, sin cambio inventado. |
| Bloque posterior | 6 / 20 = 30 %; +5 pp respecto a 25 %; una prioridad con regla/evidencia. |
| Modalidad incompatible | Actual 3v3 contra anterior 2v2: comparación rechazada; conserva la evaluación propia del bloque actual. |
| Datos faltantes | Tiros ausentes en una de cinco partidas: eficiencia `null`, cobertura 4/5, sin prioridad de finalización concluyente. Goles y duración siguen disponibles. |

La demo requiere habilitación explícita y conexión local; por defecto devuelve 404. No utiliza Supabase, archivos `.replay` cargados ni información privada. El origen sintético se indica en la respuesta y en la pantalla. La página depende de Express: abrirla como archivo o sin habilitar la demo muestra el error, sin sustituirlo por resultados fijos.

## Conectar los bloques propios

`createApp({supabase, analysisRepository})` acepta este repositorio asíncrono:

```js
const analysisRepository = {
  async getBlockForUser(blockId, userId) { /* bloque propio o null */ },
  async listBlocksForUser(userId) { /* lista de bloques propios */ },
};
```

Las pruebas pueden inyectar bloques crudos con `owner_id`, `block_id` como cadena, `status`, `source`, perfil del jugador y las cinco respuestas verificadas del proveedor (forma `blockInput` de A10). El adaptador debe preparar esa forma usando los campos comprobados por A05/A14. La ruta verifica de nuevo `owner_id`; un resultado ajeno y uno inexistente devuelven el mismo 404. El historial se filtra por propietario antes de resolver el bloque anterior. No aceptar el propietario enviado por el navegador.

La sesión usa A08: Bearer validado con Supabase y rol/estado actuales de `usuarios`. La ruta responde 401 sin sesión, 403 si está suspendido, 409 si el bloque no está listo, 422 si es inválido y 503 si falta la consulta o falla el proveedor. `baseline_id` permite elegir un anterior propio; omitirlo resuelve el compatible más reciente. Una incompatibilidad devuelve análisis propio y motivos, sin deltas ficticios.

La interfaz privada se abre con `?block_id=<id>` y opcional `&baseline_id=<id>`. El controlador espera `window.CoachAuth.getAccessToken()` o permite configurar `CoachAnalysis.configure({getAccessToken})` desde el módulo de sesión. El puente ahora reutiliza `CoachProfileApi.getClient()` de Luis y obtiene su sesión vigente en cada petición. El gate de Perfil valida el perfil antes de llamar al análisis privado; sin sesión dirige al login. La demo local identificada usa su ruta separada sin consultar el perfil. No guarda tokens en almacenamiento adicional ni usa una clave de servicio en el navegador.

El servidor conecta por defecto el adaptador de A15 descrito en la guía de propuestas; una solicitud autenticada consulta los bloques propios guardados. La base debe estar configurada y contener los cinco registros válidos. A13 recibe nombres/metadatos en memoria y deja las cargas `pending`; no proporciona las estadísticas verificadas necesarias para este análisis. A15 ya aporta repositorios comprobados, pero aún debe adaptarse su salida SQL a la entrada normalizada de A19. A13 debe completar el procesamiento; A37 comprueba permisos/RLS con usuarios reales. Las pruebas con dobles no acreditan esas integraciones.

## Evidencia y límites

Con Node.js v22.19.0, `npm test` aprobó **253 pruebas, cero fallidas**: métricas, comparación, reglas, planes, sesión existente y nuevos casos de servicio/HTTP. Incluyen identidad A/B, bloques ajenos, historial filtrado, suspendidos, fallos del repositorio, faltantes y cambio de entradas. Autenticación y repositorio de los casos HTTP se simulan; el motor se ejecuta realmente.

Se comprobó en navegador la ruta HTTP hacia la vista oficial: los cuatro casos, las cuatro métricas de gráfica, apertura de evidencia, pantalla privada sin sesión y tamaño 390 × 844. En ese tamaño, el ancho de página y viewport fue 390 px; la tabla conserva desplazamiento horizontal dentro de su región. No se observaron errores de consola durante ese recorrido. La revisión visual de Luis y las pruebas con datos/sesiones persistidos siguen pendientes.

| Captura | Vista |
| --- | --- |
| [Comparación en escritorio](evidencias/a19/comparacion-escritorio.jpg) | 30 %, +5 pp y evidencia de la regla. |
| [Comparación en móvil](evidencias/a19/comparacion-movil.jpg) | 390 px, selector separado del título y tabla desplazable. |
| [Primer bloque](evidencias/a19/primer-bloque.jpg) | Línea base. |
| [Modalidad incompatible](evidencias/a19/modalidad-incompatible.jpg) | Motivo y prioridad propia del bloque actual. |
| [Datos faltantes](evidencias/a19/datos-faltantes.jpg) | Ausencia y cobertura; sin diagnóstico fabricado. |

El [ejemplo HTTP](../planning/examples/analysis-service.json) se obtuvo ejecutando el servicio con la entrada `followup`; no es una fila SQL. Las capturas de los otros tres casos se tomaron antes de los ajustes finales de espaciado/tabla, con el mismo cálculo y datos. Las capturas de comparación muestran la interfaz final.

Análisis ya no carga `demo-data.js`, `demo-service.js` ni `app.js`: no vuelve a respuestas fijas cuando falla la API. Plan conserva su demo separada; el enlace de propuesta del bloque queda inactivo hasta integrar generación/catálogo. No se cambian las pantallas de Plan/Replays ni su autoría.

A18 entrega propuesta y ruta de generación con catálogo operativo; A24 conserva después IDs, secuencia y snapshots en las tablas existentes. **A24 no es una dependencia para cerrar A18**. A19 continúa abierta hasta completar la conexión de datos/sesión y comprobación real; este avance permite revisar el recorrido de cálculo sin presentar fixtures como datos de usuarios.

## Actualización con main · 16 de noviembre

Se incorpora `main` hasta `87ac3740f481bb91ef8539bcb84bbc08e604f7a7`: se conservan las consultas/guardado de Perfil, su validación compartida, el catálogo A23 y los repositorios A15 de David, y las vistas/scripts de Luis. Se combinan `src/app.js` y Análisis con el servicio calculado del PR #66. La página carga `profile-gate.js` una sola vez, después de sus dependencias.

`npm test`: **297 aprobadas, cero fallidas**. Cinco casos nuevos comprueban demo sin identidad, sesión vigente compartida con Luis, espera del gate privado, rechazo de perfil incompleto/sesión ausente y ausencia de fallback a demo. La revisión en navegador comprobó 30 %/+5 pp, escritorio, 390 px sin desbordamiento y redirección a login al abrir un bloque privado sin sesión. Las pruebas no usaron una cuenta real ni consultaron datos privados.

Capturas actuales: [escritorio](evidencias/a19/comparacion-integrada.jpg) y [390 px](evidencias/a19/comparacion-integrada-movil.jpg). Las anteriores conservan evidencia de la primera entrega.

A23 ya tiene seed y consulta con los tres recursos comprobados por David (ver [registro técnico](a23-catalogo-tecnico.md)); A15 ya tiene repositorios y evidencia real registrada (ver [persistencia](a15-persistencia.md)). Que esas issues estén cerradas no conecta automáticamente sus salidas a Análisis: el adaptador y la inyección de `analysisRepository` siguen pendientes. Para A18 queda la ruta de propuesta usando perfil/análisis propios y catálogo consultado; A24 conserva sus versiones después.

## Conexión A15 completada en la entrega de propuestas A18

`src/services/stored-block.js` traduce los registros propios de A15 y recalcula las métricas mediante A09. El historial obtiene detalles propios antes de comparar; se comprueba el mismo archivo por hash. La duración de procedencia no acreditada permanece null. La conexión ya se inyecta por defecto en `createApp`; A13 y la comprobación privada real siguen pendientes para cerrar A19. Véanse [alcance y pruebas](integracion-propuestas.md). Las notas fechadas anteriores describen la entrega inicial.

## Verificación privada A19 · siguiente comprobación

A13 y la conexión A15 están integradas. A26 se cerró con criterios provisionales; no reemplaza la prueba privada de Análisis. El [comprobador A19](a19-prueba-privada.md) inicia la aplicación local, pide dos sesiones reales y contrasta permisos, conteos, HTTP y controlador sin guardar credenciales. Su preparación se verifica con simulaciones; ejecución con cuentas reales y revisión visual final de Luis siguen pendientes. Las notas anteriores conservan el estado de sus entregas.

## Estado al corte de entrega

A19 se cierra administrativamente con la implementación y regresión disponibles. **La prueba local A/B y la revisión visual final no se ejecutaron/registraron**; no se sustituyen por pruebas simuladas. [Registro de alcance y pendientes](a19-cierre-entrega.md). Seguridad real sigue en A37, revisión visual en A35 y ciclo completo en A25. Las notas anteriores son antecedentes y no acreditan esas comprobaciones.
