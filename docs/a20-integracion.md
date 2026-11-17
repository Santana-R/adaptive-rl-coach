# A20 · Objetivos conectados con A16

## Instalar y ejecutar

Este paquete contiene solo siete archivos de A20. Copia las carpetas public, tests y docs
sobre el proyecto manteniendo las rutas. Conserva la configuración actual de Supabase y .env.

Reemplaza public/sitio/html/objetivos.html. Los otros archivos son nuevos respecto al ZIP
adjuntado; si conservas la demo previa de A20 con los mismos nombres, reemplázala también.

Ejecuta npm start desde la raíz y abre:
http://127.0.0.1:3000/sitio/html/objetivos.html

Se necesitan el servidor y las migraciones de A16 ya instaladas (ver docs/a16-objetivos.md).
Live Server por sí solo no sirve la API. No se añaden migraciones ni se modifica el backend.

## Resultado

- Objetivos propios consultados mediante GET /api/v1/goals?status=all, con Bearer token vigente.
- Alta con POST, edición con PATCH y detalle/historial con GET /:id.
- Retirada con DELETE: el servidor decide archived / already_archived / deleted.
- Se conserva la navegación común del ZIP recibido y se aprovecha su cliente de sesión.
- Sin fixtures, localStorage ni memoria local como sustituto de persistencia real.
- Búsqueda y filtros locales de nombre, tipo, estado y modalidad sobre datos del servidor.
- Rendimiento y entrenamiento separados; porcentaje y minutos con período y zona horaria.
- Objetivos de entrenamiento usan training_minutes; no completed_sessions de la demo antigua.
- Los campos de tipo/modalidad no se editan, conforme al contrato de A16.
- No inventa avances ni marca metas como cumplidas: la evaluación sigue perteneciendo a A21/A22.
- Las metas no modifican métricas ni diagnóstico. Las de entrenamiento no se anuncian como
  metas utilizables por el generador de planes de rendimiento.
- Los planes históricos conservan su versión de meta. El detalle muestra las versiones reales;
  el enlace Consultar mis planes lleva a Plan y no inventa una relación a un plan específico.

## Archivos

1. public/sitio/html/objetivos.html: vista MDB, formularios y estados.
2. public/sitio/css/goals.css: colores, foco y legibilidad de campos; sin @media propio.
3. public/sitio/js/goals-validation.js: validación de interfaz alineada con A16.
4. public/sitio/js/goals-service.js: peticiones autenticadas con jQuery AJAX.
5. public/sitio/js/goals.js: listado, formularios, filtros, confirmación y versiones.
6. tests/goals-frontend.test.cjs: contrato de payloads, validaciones y transporte.
7. docs/a20-integracion.md: este documento.

## Retirar una meta

El botón Retirar objetivo pide confirmación y explica ambos efectos antes de enviar DELETE:
- Si alguna versión está vinculada a un plan o evaluación, se archiva y conserva el historial.
- Si no hay vínculos, se eliminan la meta y sus versiones: no se presenta como archivo reversible.

La interfaz muestra el efecto informado por A16. No envía PATCH con status, porque A16 lo rechaza.
Si falla la conexión durante una escritura no se asegura que la operación no ocurrió: se pide
consultar la lista antes de repetirla. Los errores no cierran ni borran el borrador.

## Pruebas ejecutadas en la copia de trabajo

- npm test: 471 aprobadas, 0 fallidas (466 existentes y 5 de contrato frontend).
- node --check de los tres scripts: correcto.
- jsdom con jQuery real, peticiones AJAX reales a Express y Supabase simulado con las reglas
  de A16: lista vacía; creación; edición; no-op sin nueva versión; duplicado; historial intacto;
  retirada vinculada que archiva; retirada libre que elimina; recarga en una ventana nueva;
  filtros; texto tratado como texto y no HTML; error de proveedor conservando el borrador;
  invitado, usuario B y cuenta suspendida.
- Las pruebas existentes de A16 comprueban que un plan guarda la versión exacta y no cambia
  el diagnóstico por la meta. Esta comprobación se hizo con la base simulada de las pruebas.

No se usaron las credenciales del .env ni se escribieron datos en el Supabase del usuario.
El navegador Chromium no pudo iniciarse aquí: no se acredita revisión visual en escritorio
ni a 390 px. Las pruebas de DOM no sustituyen esa revisión ni la prueba con Supabase real.

## Recorrido real para cerrar A20

1. Iniciar sesión y abrir Objetivos. Comprobar lista propia o estado vacío.
2. Crear una meta de rendimiento (por ejemplo precisión >= 35 % en 2v2).
3. Recargar: debe recuperarse la misma meta desde el servidor.
4. Editar a 40 %, consultar detalle: las versiones de 35 y 40 deben seguir visibles.
5. Guardar sin cambios: debe conservar la misma versión.
6. Crear una meta de entrenamiento en minutos y comprobar su unidad y fechas.
7. Probar filtros por tipo, modalidad, estado y búsqueda sin resultados.
8. Retirar una meta sin vínculos y verificar el mensaje de eliminación.
9. Para una meta ya vinculada a un plan/evaluación, retirar y verificar archivo, historial
   y que el plan siga apuntando a la versión original. No usar una meta sin vínculos como
   evidencia de archivo: A16 la elimina.
10. Probar con otro usuario: no debe ver ni modificar las metas del primero.
11. Revisar escritorio y 390 px: etiquetas, contraste, foco, teclado y formularios sin
    desbordamiento. El historial tiene desplazamiento horizontal dentro de su tabla.
12. Guardar capturas y resultados reales antes de marcar A20 como terminada.

No se ejecutaron git add, commits, pushes ni cambios en GitHub.
