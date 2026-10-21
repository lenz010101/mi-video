# Material del promo VELUXE V3 (vertical 9:16)

Estos son los archivos que usa la composición `compositions/veluxe-promo.html`.
Se sustituyen **1:1**, con el mismo nombre y extensión, sin tocar el HTML.

## `vendor/` — librerías de edición (comunes a todas las composiciones)

Todo lo que hay aquí está **vendorizado** (nada de CDN: si la red falla en el
render, no hay timeline y el vídeo sale congelado). Son copias byte a byte de
los paquetes de npm, y `node demo2/verify-vendor.mjs` lo comprueba en el CI.

| Ruta | Qué es | Paquete npm |
|---|---|---|
| `vendor/gsap.min.js` | GSAP (animación) 3.15.0 | `gsap@3.15.0` |
| `vendor/gsap/*.min.js` | los 24 plugins (SplitText, ScrollTrigger, MotionPath, MorphSVG, DrawSVG, Draggable, Flip, Observer, CustomEase, TextPlugin…) | `gsap@3.15.0` |
| `vendor/anime.umd.min.js` | Anime.js 4.5.0 (UMD) | `animejs@4.5.0` |
| `vendor/lottie.min.js` | Lottie / bodymovin 5.12.2 | `lottie-web@5.12.2` |
| `vendor/three.module.js` | Three.js 0.181.2 (ESM → necesita `importmap`) | `three@0.181.2` |
| `vendor/d3.min.js` | D3 7.9.0 (gráficos) | `d3@7.9.0` |
| `vendor/leaflet/` | Leaflet 1.9.4 (js, css, iconos de marcador) | `leaflet@1.9.4` |
| `vendor/maplibre/` | MapLibre GL 6.15.0 (mjs, worker, css) | `maplibre-gl@6.15.0` |
| `vendor/mapbox/` | Mapbox GL 3.33.0 (js, css; necesita token) | `mapbox-gl@3.33.0` |
| `vendor/typegpu/` | TypeGPU 0.12.8 (WebGPU; el runner no tiene GPU) | `typegpu@0.12.8` |

Los plugins de GSAP se cargan **uno a uno** y hay que registrarlos:

```html
<script src="../assets/vendor/gsap.min.js"></script>
<script src="../assets/vendor/gsap/SplitText.min.js"></script>
<script>gsap.registerPlugin(SplitText);</script>
```

Three.js es un módulo ESM, así que necesita un `importmap` **local**:

```html
<script type="importmap">
{"imports":{"three":"../assets/vendor/three.module.js"}}
</script>
```

| Archivo | Escena | Formato | Tamaño de trabajo |
|---|---|---|---|
| `flyer.png` | 1 — cartel de papel | PNG con alfa | 760×950 (portrait) |
| `entrance.jpg` | 2 — entrada del club | JPG | 1080×1520 (9:16) |
| `people.png` | 2 — dos personas con chaquetas amarillas | PNG con alfa | 640×940 |
| `crowd.jpg` | 4 y 5 — multitud de fondo (se desenfoca en la comp) | JPG | 1080×1520 (9:16) |
| `char1.png` … `char4.png` | 4 y 5 — personajes de los cortes | PNG con alfa | 800×800 (1:1) |
| `logo.png` | cierre + mini logo del overlay | PNG con alfa | 120×120 (1:1) |
| `music.mp3` | música | MP3 | ≥ 13 s |
| `grain.png` | grano de película del overlay | PNG | 256×256 (se repite) |

## Reglas al sustituir

- **Los personajes (`char*.png`) y las personas (`people.png`) deben tener fondo
  transparente**: se superponen sobre la multitud y el encuadre los recorta.
- **La multitud (`crowd.jpg`) se desenfoca 7 px en la composición**: no hace
  falta traarla borrosa, pero sí con las siluetas suaves (se lee mejor).
- **El cartel (`flyer.png`)**: si tu foto es un JPG, conviértela a PNG con
  fondo transparente o el rectángulo tapará el muro.
- **El neon "VELUXE" no es una imagen**: es texto en vivo
  (`#neonText` en la composición) para poder parpadear. Si tu `entrance.jpg`
  ya trae la rótulo, borra ese bloque o deja la variable `neonText` vacía.
- **El logo de la tarjeta final** usa el mismo `logo.png` que el mini del
  overlay; si quieres dos versiones, copia el archivo y cambia el `src` de
  `#endLogo`.
- **La música**: el corte del final está clavado al final del tema; si cambias
  la duración, ajusta `data-duration` del `<audio>` y de `#stage`.
