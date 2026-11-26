# Sitio web de NexusAI

Landing pública del plugin: qué es, qué hace y cómo instalarlo.
Se publica en **https://nexusai-ucc.github.io/nexusAI/** (español) y `/en/` (inglés).

## Cómo está armado

Es HTML y CSS a mano, sin framework ni build.

| Archivo | Qué es |
|---|---|
| `index.html` | Página en español (la principal) |
| `en/index.html` | La misma página en inglés |
| `styles.css` | Estilos compartidos. Colores y tipografías = los de la presentación de la defensa; modo claro y oscuro según el sistema |
| `media/` | Clips `.mp4` y sus imágenes fijas `.png` (grabados con Playwright en el entorno de `deploy/demo/`), `logo.png` (= `pix/icon.png` del plugin) y `og.png` (imagen al compartir el link) |
| `robots.txt`, `sitemap.xml` | Para buscadores |

## Editar

- **Un cambio de texto va en las dos páginas** (`index.html` y `en/index.html`).
- Los links internos son relativos (`media/…` en español, `../media/…` en inglés) para que funcione bajo `/nexusAI/` y con un dominio propio.
- No poner números que no estén en el informe (`informe-ipi`).

Para verlo en local:

```bash
cd NexusAI/site && python3 -m http.server 8765
# abrir http://localhost:8765/
```

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
