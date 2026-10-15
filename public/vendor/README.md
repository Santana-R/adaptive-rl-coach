# Dependencias locales de la demostración

Los archivos se distribuyen sin modificaciones, con versiones fijadas. La interfaz no depende de una CDN durante su uso y no envía peticiones externas.

| Dependencia | Versión | Archivo | Origen |
| --- | --- | --- | --- |
| Bootstrap CSS | 5.3.8 | bootstrap-5.3.8.min.css | https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css |
| jQuery | 3.7.1 | jquery-3.7.1.min.js | https://code.jquery.com/jquery-3.7.1.min.js |
| Chart.js UMD | 4.5.1 | chart-4.5.1.umd.min.js | https://cdn.jsdelivr.net/npm/chart.js@4.5.1/dist/chart.umd.min.js |

Cada proyecto conserva su aviso de copyright y licencia MIT en el archivo de licencia adjunto. Chart.js UMD se utiliza en Análisis; Bootstrap CSS aporta la base y utilidades; jQuery gestiona eventos y selección DOM. No se necesita el bundle JavaScript de Bootstrap: los desplegables de ejercicios usan elementos HTML `details`/`summary`.

Documentación oficial: [Bootstrap](https://getbootstrap.com/docs/5.3/getting-started/introduction/), [jQuery](https://releases.jquery.com/jquery/), [Chart.js](https://www.chartjs.org/docs/latest/getting-started/).

## Integridad de los archivos distribuidos (SHA-256)

- `bootstrap-5.3.8.min.css`: `d85327d99c7a3ee1f9b5d0500d1370acea3ad2db39c163c2f51f232baedbdede`
- `chart-4.5.1.umd.min.js`: `48444a82d4edcb5bec0f1965faacdde18d9c17db3063d042abada2f705c9f54a`
- `jquery-3.7.1.min.js`: `fc9a93dd241f6b045cbff0481cf4e1901becd0e12fb45166a8f17f95823f0b1a`
