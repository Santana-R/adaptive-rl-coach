# Revisión de interfaz: recorrido del jugador

Rama de revisión: `ui/recorrido-guiado`. La implementación conserva HTML, Bootstrap/MDB, CSS y JavaScript con jQuery. No incorpora un framework ni modifica las reglas deportivas, la API o la base de datos.

## Correspondencia con las trece pantallas

Se conserva el inventario de [flujo-pantallas.md](flujo-pantallas.md), con estas etiquetas:

| Pantalla acordada | Etiqueta visible | Archivo en public/sitio/html |
| --- | --- | --- |
| Inicio | Inicio | index.html |
| Acerca | Acerca | aboutus.html |
| Ayuda | Ayuda | helpme.html |
| Registro/login | Ingresar / Crear cuenta | login.html |
| Perfil | Mi perfil | perfil.html |
| Carga/historial | Mis partidas | replays.html |
| Análisis | Resultados | analisis.html |
| Objetivos | Mis objetivos | objetivos.html |
| Plan | Mi entrenamiento | plan.html |
| Sesiones | Mi progreso | sesiones.html |
| Panel admin | Panel de administración | admin-resumen.html |
| Usuarios admin | Usuarios | admin-usuarios.html |
| Ejercicios admin | Ejercicios | admin-ejercicios.html |

El registro y el acceso siguen siendo una sola pantalla con dos formularios. Los informes continúan dentro de Resultados, Objetivos y Mi progreso. No se fusionan rutas. El contenido de Acerca y su carrusel se conserva.

## Cambios que se pueden explicar

- El menú destaca cuatro pasos: partidas, resultados, entrenamiento y progreso. En móvil se abre con Menú. Los objetivos y el perfil quedan en Mi cuenta; Ayuda y Acerca siguen disponibles.
- Inicio consulta perfil, último bloque listo y entrenamiento guardado para ofrecer el siguiente paso real. Un fallo de consulta deja una alternativa para volver a intentarlo.
- Mis partidas define bloque como cinco partidas comparables y ofrece una acción explícita para analizarlas.
- Resultados presenta las prioridades antes de las métricas y enlaza al entrenamiento de ese bloque. La explicación completa y sus observaciones se despliegan.
- Mi entrenamiento muestra primero el tiempo y los ejercicios con su propósito. Las instrucciones, razones y límites se despliegan. Guardar habilita el registro sobre la versión exacta, como antes.
- Mi progreso muestra el historial. El formulario aparece cuando se abre un entrenamiento guardado. Los filtros se ocultan cuando no hay sesiones.
- `player-ui.js` traduce nombres de recursos y redondea cifras de las explicaciones solo al mostrarlas; no cambia las métricas, los umbrales ni los datos guardados.

## Cómo revisar localmente

Desde la copia del repositorio que contiene esta rama:

```sh
git switch ui/recorrido-guiado
npm ci --ignore-scripts
PORT=3002 npm start
```

Abrir `http://127.0.0.1:3002/sitio/html/index.html`. Usa la configuración local de `.env`. Una sesión iniciada en otro puerto requiere acceder de nuevo en este origen.

Para probar con el servicio Docker de esta misma copia, reconstruir después de cambiar de rama:

```sh
docker compose up -d --build
```

No se requieren migraciones por estos cambios de interfaz. `main` conserva su interfaz hasta que se decida integrar esta rama.

## Validación

- 566 pruebas de Node y prueba de arranque/rutas A38 correctas.
- Menú móvil comprobado en Safari a 390 px.
- Revisión en Safari del inicio y del recorrido Resultados → Mi entrenamiento → Mi progreso con una previsualización aislada y datos sintéticos identificados. Esta revisión visual no acredita una carga real nueva a Ballchasing ni un guardado en Supabase.
- Las operaciones existentes de autenticación, propiedad y guardado conservan las comprobaciones del servidor. Los ejemplos locales de revisión no se incluyen en la aplicación.
