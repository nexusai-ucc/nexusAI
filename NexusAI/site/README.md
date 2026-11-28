# Sitio web de NexusAI

Landing pública del plugin: qué es, qué hace y cómo instalarlo.
Se publica en **https://nexusai-ucc.github.io/nexusAI/** (español) y `/en/` (inglés).

## Cómo está armado

Es HTML y CSS a mano, sin framework ni build.

| Archivo | Qué es |
|---|---|
| `index.html` | Página en español (la principal) |
| `en/index.html` | La misma página en inglés |
| `instalacion/index.html`, `en/install/index.html` | Guía de instalación completa (servidor, plugin, conexión, activar cursos, problemas comunes) |
| `tutorial/index.html`, `en/tutorial/index.html` | Tutorial para docentes y alumnos, con los clips de `media/` |
| `guide.js` | Botón «Copiar» en los bloques de código de las guías y clips quietos con «reducir movimiento» |
| `styles.css` | Estilos compartidos. Colores y tipografías = los de la presentación de la defensa; modo claro y oscuro según el sistema |
| `media/` | Clips `.mp4` y sus imágenes fijas `.png` (grabados con Playwright en el entorno de `deploy/demo/`), `logo.png` (= `pix/icon.png` del plugin) y `og.png` (imagen al compartir el link) |
| `robots.txt`, `sitemap.xml` | Para buscadores |

## Editar

- **Un cambio de texto va en las dos versiones** de cada página (español e inglés).
- Los links internos son relativos (`media/…` en español, `../media/…` en inglés) para que funcione bajo `/nexusAI/` y con un dominio propio.
- No poner números que no estén en el informe (`informe-ipi`).

Para verlo en local:

```bash
cd NexusAI/site && python3 -m http.server 8765
# abrir http://localhost:8765/
```

## Comentarios

Hay dos lugares para comentar:

- **La landing** (`#comentarios` en español, `#feedback` en inglés): un formulario que llega por mail a los tres, sin cuenta de GitHub. Es el que enlaza la ficha del Marketplace.
- **Las guías** (instalación y tutorial): comentarios públicos con giscus.

### Formulario de la landing (FormSubmit)

El sitio no tiene servidor, así que el formulario lo entrega [FormSubmit](https://formsubmit.co): gratis, sin cuenta y sin límite de envíos. Guarda los envíos 30 días.

- Destinatario principal: el `action` del `<form>`. Copias: el campo oculto `_cc`, separadas por coma. Cambiarlos **en las dos páginas** (`index.html` y `en/index.html`).
- Las copias quedan visibles en el código de la página. El principal se puede ocultar (ver abajo).
- Antispam: el reCAPTCHA de FormSubmit (no apagarlo) y el campo trampa `_honey`.
- Al terminar, FormSubmit vuelve a la misma página con `?enviado=1` y se muestra el «¡Gracias!». El `_next` lo arma el script del final de la página a partir de la URL, así anda en local, bajo `/nexusAI/` y con dominio propio.
- Campos: tipo de mensaje (incluye «Quiero instalarlo en mi institución»), institución opcional, si quiere que lo contactemos y el mensaje. Si elige «anónimo», el nombre y el mail se ocultan y no se envían; si elige que lo contactemos, el mail es obligatorio. Sin JavaScript se ven todos los campos y ninguno es obligatorio salvo el mensaje.
- El formulario en inglés manda los mismos nombres de campo y valores en español, así los mails llegan siempre iguales; el campo `Idioma` dice en qué idioma responder.

Requisito, una sola vez:

1. Enviar el formulario una vez desde el sitio publicado. Al destinatario principal le llega un mail de FormSubmit para activar el formulario: tocar el botón de activación.
2. FormSubmit manda una cadena aleatoria que reemplaza al mail. Poner `https://formsubmit.co/<cadena>` en el `action` de las dos páginas, así el mail principal no queda en el código.

### Guías (giscus)

Las guías usan [giscus](https://giscus.app/es), que guarda los comentarios en las Discussions del repo (categoría *Announcements*). Hay un hilo por guía, compartido entre español e inglés (`data-term`). Para comentar hace falta cuenta de GitHub.

Requisito, una sola vez: un admin de la organización instala la app [giscus](https://github.com/apps/giscus) en `nexusai-ucc/nexusAI`.

## Publicación

`.github/workflows/pages.yml` publica esta carpeta cada vez que cambia en `main` (o a mano, con *Run workflow*).
Requisito, una sola vez: **Settings → Pages → Source: GitHub Actions**.

## Dominio propio (cuando se compre)

Ejemplo con `nexusai.com.ar`, que se registra en [nic.ar](https://nic.ar) con CUIT/CUIL:

1. Crear `NexusAI/site/CNAME` con una sola línea: `nexusai.com.ar`.
2. En el DNS del dominio:
   - registros `A` de `nexusai.com.ar` a `185.199.108.153`, `185.199.109.153`, `185.199.110.153` y `185.199.111.153`;
   - `CNAME` de `www` a `nexusai-ucc.github.io`.
3. Settings → Pages → Custom domain: `nexusai.com.ar`, y tildar **Enforce HTTPS** cuando GitHub emita el certificado.
4. Cambiar las URLs absolutas (`canonical`, `hreflang`, `og:*`) en las dos páginas, `robots.txt` y `sitemap.xml`.
