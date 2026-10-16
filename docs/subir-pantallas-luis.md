# Luis: subir tus cuatro pantallas

**Resultado:** tus archivos quedarán en el repositorio del equipo, con un primer commit asociado a tu cuenta y un PR para revisarlos. Como el ZIP no tiene historial, ese commit representa el avance actual. Los cambios que hagas después se registrarán conforme ocurran.

## 1. Comprueba tu acceso

Inicia sesión con **tu cuenta** y abre [https://github.com/Santana-R/adaptive-rl-coach](https://github.com/Santana-R/adaptive-rl-coach). Si no puedes verlo o después Git rechaza el `push` por permisos, pide a Roberto acceso de colaborador y acepta la invitación. No necesitas crear otro repositorio.

## 2. Clona el repositorio y crea tu rama

En Windows, abre **Git Bash** en la carpeta donde guardas tus proyectos. En Mac, usa Terminal. Ejecuta cada línea por separado:

```sh
git clone https://github.com/Santana-R/adaptive-rl-coach.git
cd adaptive-rl-coach
git switch -c feat/A04-pantallas-publicas
```

Al terminar debes estar dentro de la carpeta `adaptive-rl-coach`, en la rama `feat/A04-pantallas-publicas`. Si ya existe una copia local con trabajo tuyo, conserva sus cambios y pide ayuda con el mensaje exacto de Git antes de reemplazar archivos.

## 3. Configura tu autoría antes del primer commit

En GitHub abre **Settings → Emails**: [abrir tus correos](https://github.com/settings/emails). Copia tu correo verificado o el correo `noreply` exacto que GitHub muestra para tu cuenta.

Ejecuta la primera línea. En la segunda, **reemplaza `TU_CORREO_DE_GITHUB` por ese correo** antes de ejecutarla:

```sh
git config --local user.name "Luis Enrique Almaguer Castillo"
git config --local user.email "TU_CORREO_DE_GITHUB"
git config --local --get user.name
git config --local --get user.email
```

Las dos últimas líneas deben mostrar tu nombre y tu correo. Este ajuste solo afecta este repositorio. Iniciar sesión y configurar el autor del commit son pasos distintos.

## 4. Copia estos archivos del ZIP

Extrae `car.zip`. Dentro del repositorio clonado crea `public/sitio/`. Copia los siguientes archivos **conservando las subcarpetas**:

| Desde la carpeta `car` | Destino dentro del repositorio |
| --- | --- |
| Los cuatro archivos de `html/` | `public/sitio/html/` |
| `css/index.css` | `public/sitio/css/index.css` |
| `css/mdb.min.css` | `public/sitio/css/mdb.min.css` |
| `js/mdb.umd.min.js` | `public/sitio/js/mdb.umd.min.js` |
| `img/mdb-favicon.ico` | `public/sitio/img/mdb-favicon.ico` |
| `License.txt` | `public/sitio/License.txt` |

Para esta primera subida basta ese conjunto. `src/`, los archivos `.map`, la variante RTL y el ZIP de MDB dentro del ZIP son material de la biblioteca que las cuatro páginas actuales no utilizan directamente. La licencia se conserva.

`public/sitio/` permite incorporar tu avance sin reemplazar `public/index.html`, `app.css` ni los scripts de la demo existente. La unificación se hará en cambios posteriores.

## 5. Comprueba las páginas

Los HTML actuales usan rutas `/css/` y `/js/`, por lo que necesitan un servidor con `public/sitio` como raíz. Desde la carpeta del repositorio, si tienes Python instalado:

Windows:

```sh
py -m http.server 8000 --directory public/sitio
```

Mac:

```sh
python3 -m http.server 8000 --directory public/sitio
```

Abre **http://localhost:8000/html/index.html**. Recorre Inicio, Acerca, Ayuda e Ingresar. Detén el servidor con **Ctrl+C** antes de continuar en esa terminal. Si Python no está instalado, puedes subir el avance; deja esa comprobación pendiente para realizarla con el servidor de Tadeo. No afirmes haberla ejecutado.

Pendientes ya identificados: varios botones sin destino, registro todavía sin autenticación, textos por corregir, favicon con ruta incorrecta y diseño móvil del carrusel/formulario. Forman parte de las mejoras siguientes; esta primera entrega registra el punto de partida.

## 6. Guarda y sube el primer commit

```sh
git status
git add public/sitio
git diff --cached --stat
git commit -m "feat: incorporar primeras cuatro pantallas publicas (A04)"
git log -1 --format=fuller
git push -u origin feat/A04-pantallas-publicas
```

Antes del commit, la lista debe contener solo los archivos de `public/sitio`. Después, el `Author` debe ser tu nombre y correo. Si Git abre una autenticación, complétala con tu cuenta de GitHub. Una cuenta o contraseña escrita en `user.name`/`user.email` no inicia sesión.

## 7. Abre el PR

Abre el [repositorio](https://github.com/Santana-R/adaptive-rl-coach) y pulsa **Compare & pull request**. Si no aparece, entra a **Pull requests → New pull request**.

- **base:** `main`
- **compare:** `feat/A04-pantallas-publicas`
- **Título:** `feat: incorporar pantallas públicas de Luis (A04)`

Usa esta descripción, ajustando la comprobación a lo que realmente ejecutaste:

```text
Tarea relacionada: #4. Avance parcial.

Incluye Inicio, Acerca, Ayuda y formulario de registro a partir de mi ZIP actual. MDB se incluye como dependencia con su licencia.

Cómo comprobar: servir public/sitio y abrir /html/index.html. Indicar aquí qué probé y qué observé.

Pendientes: enlaces de botones, correcciones de texto/rutas y adaptación a móvil. Autenticación real pendiente de A08/A12.
```

Pulsa **Create pull request** y comparte su enlace con Roberto. Conserva A04 abierta: esta subida es una parte de su alcance. Al integrar se puede usar **Merge pull request → Confirm merge** para conservar los commits de la rama. El nombre de quien integra no sustituye al autor original de los commits.

## 8. Registra los cambios siguientes

Mientras el PR siga abierto, corrige una cosa comprobable, revisa el resultado y repite `git add` con los archivos concretos, `git commit` y `git push`. Ejemplos de cambios futuros: conectar Crear cuenta; corregir el carrusel en móvil; aclarar Registro frente a Iniciar sesión.

El mensaje debe describir el cambio que hiciste. No hace falta reconstruir fechas ni inventar commits del trabajo anterior. Después de integrar, vuelve a `main`, actualiza y crea una rama para la siguiente entrega:

```sh
git switch main
git pull --ff-only origin main
git switch -c fix/A04-navegacion-publica
```

**Está entregado cuando:** el PR puede verse en GitHub, los archivos están dentro de `public/sitio/` y los commits aparecen asociados a tu cuenta. Un botón dibujado todavía no acredita una función conectada.

Referencias oficiales: [correo del commit](https://docs.github.com/en/account-and-profile/how-tos/email-preferences/setting-your-commit-email-address) · [crear un PR](https://docs.github.com/en/pull-requests/how-tos/create-pull-requests/creating-a-pull-request).
