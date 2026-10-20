# Proyecto nuevo (plantilla HyperFrames)

Composición vertical **1080×1920 · 30 fps · 14 s** con tres escenas: gancho,
contenido y cierre. Es un proyecto **autocontenido**: fuentes, GSAP y música
viven dentro de `assets/`, así que no depende de nada de fuera de esta carpeta.

```
proyecto-nuevo/
├─ index.html            composición + timeline GSAP
└─ assets/
   ├─ fonts/             Inter 400/600/800 (local, nada de Google Fonts)
   ├─ vendor/gsap.min.js GSAP 3.12.5 vendorizado (nada de CDN)
   └─ audio/             música de referencia
```

## Cambiar el contenido

Todo se parametriza en el array `data-composition-variables` de `<html>` y se
pinta en tiempo de render:

| variable | qué es | tipo |
|---|---|---|
| `kicker` | antetítulo pequeño en mayúsculas | string |
| `title` | titular grande, se revela palabra a palabra | string |
| `b1` `b2` `b3` | las tres líneas de la escena 2 | string |
| `cta` | texto del botón del cierre | string |
| `handle` | usuario junto al check | string |
| `accent` | color de acento (botón, línea, halos) | color |
| `bg` | color de fondo | color |
| `musicSrc` | ruta de la música | image |

Los valores por defecto están en el propio `index.html`. Para cambiar solo los
textos, edita esos `default` (o pasa `--variables` en el render).

Estructura de tiempos (en **segundos**, `data-duration`):

| escena | inicio | dura | qué entra |
|---|---|---|---|
| 1 · gancho | 0 | 5 | antetítulo, titular palabra a palabra, línea de acento |
| 2 · contenido | 4,9 | 5,3 | tres líneas escalonadas al beat |
| 3 · cierre | 10,2 | 3,8 | botón con el check y el usuario |

Todo el metraje lleva un zoom de cámara lento (1 → 1,03) y orbes de luz en
movimiento: **ningún fotograma se queda quieto**.

## Renderizar

Solo en la nube (GitHub Actions). Nunca en local:

```bash
node demo2/ciclo.mjs proyecto-nuevo/index.html proyecto-nuevo.mp4
```

Hace el render, comprueba fotogramas congelados y cortes, y deja el MP4 en
`C:\Users\Admin\Desktop\`. Tarda 3,5–4,6 min.

## Reglas que ya cumple (no romper al editar)

- Sin `transition` en CSS (ni `transition: none`).
- Sin `requestAnimationFrame` / `setTimeout` / `setInterval`.
- **Build síncrono**: `build()` se llama directo, sin `fonts.ready` ni promesas.
- `gsap.ticker.fps(30)` sincronizado con `data-fps="30"`.
- Timeline registrada como `window.__timelines["proyecto-nuevo"]`, creada con
  `{ paused: true }`.
- `will-change` con la propiedad que muta en cada elemento animado.
- Cada escena con `data-start` **y** `data-duration` en segundos.
- Toda `data-var-*` apunta a una variable declarada en el array de variables.

Comprobación antes de renderizar:

```bash
node demo2/audit-rules.mjs proyecto-nuevo      # 0 problemas
npx --yes hyperframes@0.8.162 lint proyecto-nuevo   # 0 errores
```
