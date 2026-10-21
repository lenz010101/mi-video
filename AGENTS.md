# Instrucciones del proyecto

## Estado del repo (cierre 2026-10-20)

- **Pieza nueva: `compositions/inmobiliaria-mx-30s.html` — "ARCO", reel de
  inmobiliaria para México, 30 s en 9:16, desde cero.** Storyboard completo en
  `compositions/inmobiliaria-mx-30s.md`. Motor visual propio ("LUZ": marfil
  `#F4F1E9` + tinta + **un solo acento terracota** `#A8643C`), Instrument Serif
  + Montserrat + JetBrains Mono, **dip a blanco** en cada corte, rejilla de
  compás de **2,0 s exactos** (la música se estira con `atempo` a 120 BPM para
  que el corte caiga en el golpe, sin tocar el pitch), y todo el copy local en
  variables de render-time (`DESDE $2.9 MDP`, `3 RECÁMARAS`, `+52 55…`,
  `ESQUIRE EN SITIO`). Material 100 % nuevo (Mixkit) montado en la nube.
- **Pieza nueva: `compositions/humo-reel-30s.html` — "HUMO", reel de estudio
  30 s en 9:16, hecho desde cero.** Material 100 % nuevo (8 clips de humo de
  Mixkit + fugas de luz + música nueva), montado en la nube. Render medido:
  **2 m 22 s**, 30,00 s, 0 fotogramas congelados, 11 cambios de plano, audio sí.
  Entregado: `humo-reel-30s.mp4` (73,8 MB).
  - **El repo solo guarda el manifiesto** (`assets/nuevo/fuentes.json`); los
    clips y la música se descargan y se montan **en el runner**
    (`demo2/preparar-nuevo.mjs`: recorte 9:16, grado de color, H.264
    baseline 3.1) y se cachean. El PC del usuario no toca vídeo.
  - Dirección de arte: negro cálido `#0B0A08` + **un solo acento ámbar**
    `#E3A44B` (nada de cyan-neón), Anton (condensada) + Instrument Serif
    (editorial) + JetBrains Mono (datos), halo radial en vez de `filter:blur`,
    grano local, foco doble por escena, rótulos anclados a los bordes.
  - Se parametriza en render-time: `marca`, `claim`, `sub`, `pie`, `cta`,
    `musica` (`data-composition-variables`).

- Rama de trabajo: **`demo-premium`** (la `main` no se toca; el render se dispara
  a mano con `workflow_dispatch` sobre `demo-premium`).
- **Último MP4 entregado:** `C:\Users\Admin\Desktop\veluxe-promo.mp4`
  (12,7 s · 1080×1920 · 22,5 MB). Verificado: **0 de 380 fotogramas
  congelados**, 17 cambios de plano justo donde dice la timeline, audio AAC.
- El **pase de dirección de arte** (encuadres variados en los 10 cortes,
  barrido de luz sobre el cartel, cierre con halo y filete) está **en el código
  pero sin renderizar** (commit `983a728`). Para verlo:
  `node demo2/ciclo.mjs` → render + MP4 y hoja de contactos en el Escritorio.
- **Reglas de velocidad** (el usuario se quejó del tiempo empleado; van en pie):
  1. **NO tocar `assets/nuevo/fuentes.json` ni `assets/nuevo/inmo/fuentes.json`**
     si solo cambia el copy o los colores: la clave de caché del material es el
     hash del manifiesto, así que tocarlo **vuelve a graduar los 14 clips**
     (+4 min). El copy va en **variables de render-time**.
  2. **Borrador antes que final**: `fps=15` + `quality=draft` para revisar (la
     mitad de tiempo) y el render bueno solo cuando el usuario aprueba.
  3. **Piezas en paralelo**: cada dispatch es un runner distinto y en un repo
     público son gratis → 2 vídeos = el tiempo de 1.
  4. **No descargar el MP4 salvo que lo pida**: pesa 55-90 MB y su conexión es
     el cuello de botella real. Para revisar, bastan los fotogramas clave
     (200 KB) o la hoja de contactos.
  5. **Validar en local antes de subir**: `node demo2/audit-rules.mjs` (ya caza
     los errores de sintaxis) y `node demo2/audit-perf.mjs`. Un render fallido
     cuesta 3-8 min.
  6. El render nunca es lo lento: son los renders **muertos** por bugs, el
     material re-gradado y las descargas.
  7. **El lint de HyperFrames ya está instalado en LOCAL**:
     `npx hyperframes@0.8.162 lint . --json` (1 min de instalación la primera
     vez). Valida ANTES de subir. En local son esperables los errores de
     material ausente (`assets/nuevo/**/procesado/*`, `assets/mezcla/*`),
     porque el material se monta en la nube.
- Herramientas del repo (**la guía completa está en `demo2/GUIA.md`**):
  | Script | Para qué |
  |---|---|
  | `demo2/ciclo.ps1` | **EL comando único**: valida en local → sube → render en
    la nube → baja el MP4 al Escritorio. `.\demo2\ciclo.ps1 -Composition
    compositions/x.html -Filename x.mp4 -Workflow render-mix.yml -Paths
    compositions/x.html` (`-SinLint` ahorra 1 min, `-SinQc` ahorra 40 s) |
  | `demo2/audit-rules.mjs` | reglas 9.9 (0 problemas), 2 s, sin Chrome |
  | `demo2/audit-bash.mjs` | sintaxis de los scripts de los workflows (2 s) |
  | `demo2/check-css-integrity.mjs` | el CSS solo cambia en `will-change` |
  | `demo2/verify-render.mjs` | MP4 entregado: frames congelados + cortes |
  | `demo2/contact-sheet.mjs` | hoja de contactos con timecodes (revisión) |
  | `demo2/ciclo.mjs` | render nube + entrega + verificación (piezas HyperFrames) |
  | `demo2/dispatch.ps1` | lanza el render final en la nube y espera (30 fps +
    `high`; `-SinQc` sin verificación) |
  | `demo2/descargar.ps1` | baja **solo el MP4** de un run al Escritorio
    (`-QC` para ver la hoja de contactos) |
  | `demo2/commit-api.ps1` | sube ficheros por la API de GitHub, sin `git` |
  | `demo2/gh.ps1` | API de GitHub sin `git` instalado (lee el token del
    Administrador de Credenciales de Windows, en memoria) |
- **Librerías de edición instaladas en la nube** (paso `Install the editing
  libraries` de `render.yml` y `compare.yml`): se instalan en
  `$HOME/editing-tools`, **fuera** del repo (un `node_modules` dentro del
  proyecto se colaría en el escaneo de assets y en el tamaño que se sube a la
  nube), y se cachean con la clave `editing-tools-node22-v1`:
  `hyperframes@0.8.162` (la misma versión fijada que el lint), `gsap@3.15.0`,
  `sharp@0.35.5`, `fluent-ffmpeg@2.1.3`, `ffmpeg-static@5.3.0`,
  `ffprobe-static@3.1.0`, `animejs@4.5.0`, `lottie-web@5.12.2`,
  `three@0.181.2`, `d3@7.9.0`, `leaflet@1.9.4`, `maplibre-gl@6.15.0`,
  `mapbox-gl@3.33.0` y `typegpu@0.12.8`. Además sigue el `ffmpeg` estático de
  johnvansickle (7.0.2). El paso `Verify the editing libraries` comprueba que
  todo lo vendorizado en `assets/vendor/` es **idéntico** a lo que instala npm
  (`node demo2/verify-vendor.mjs`).
  Los pasos usan el wrapper `hf` (prepara la CLI instalada y cae a `npx` si
  no está sana), así que el render nunca se queda sin HyperFrames.
- **Workflow `validate.yml`**: valida el repo **sin renderizar vídeo**
  (`hf check .` = lint estático del proyecto + muestras en runtime + contraste
  WCAG, más `hf lint .`, el auditor de reglas, la comparación vendor/npm y 7
  fotogramas). Sirve para probar cambios en `assets/vendor` o en las librerías
  sin gastar un render completo. Tarda ~2 min. `node demo2/ciclo.mjs` sigue
  siendo el ciclo completo con MP4.
  Ojo: `hf check` y `hf snapshot` solo aceptan **proyectos** (directorios con
  `index.html`), no ficheros sueltos; en `render` sí vale `--composition
  compositions/x.html`, pero en `snapshot` es el `data-composition-id`.
- **Workflow `render-mix.yml`** (Remotion + ffmpeg + HyperFrames): el orden es
  `Remotion (gráficos) → ffmpeg (HORNEADO del comp) → HyperFrames (montaje)`.
  El **horneado** es la clave de la velocidad: se compone *una vez* por plano
  (presentador + foto + capa de orbes en `screen`, como en After Effects) y la
  composición de HyperFrames solo reproduce ese plano → el navegador no
  compone dos vídeos a pantalla completa en cada uno de los 900 fotogramas
  (de ~0,22 s/frame a ~0,15-0,17 s/frame). El aspecto es idéntico.
  - Al cambiar la composición, **no toques los planos horneados**: se rehacen
    en la nube en cada run (30 s) a partir de `assets/clips/talker-slow.mp4`,
    `assets/coches/*.jpg` y `assets/mezcla/orbes.mp4`.
  - La voz del presentador va suelta (`assets/mezcla/voz.m4a`, generado en el
    mismo paso) porque los planos horneados van mudos.
  - **Modo `frames`** (`mode: frames`): el mismo job pero en vez del MP4 saca
    6 PNG en los tiempos de `at`. Es el **bucle de revisión barato** (~1 min
    de nube, 1 MB de descarga): revisa la dirección de arte ANTES de gastar un
    render de 4 min. Úsalo siempre antes de un render final.
  - La columna de orbes va cacheada (`orbes-v2-...`): si no cambian los
    sources de Remotion, no se vuelve a renderizar (ahorra 49 s).
- **Las reglas son globales**, no solo de este repo:
  `~/.config/opencode/AGENTS.md` + skill `hyperframes-composition`
  (con el auditor y el fixer en `~/.config/opencode/skills/.../scripts/`).

## Preferencias del usuario

- **REGLA PERMANENTE (el usuario la ha repetido): el trabajo completo debe
  caber en 30 MINUTOS, o menos si es posible.** Ni una hora ni "casi una
  hora": 30 minutos es el techo. El usuario no puede estar recordán-
  dormelo en cada momento, así que el agente tiene que: (a) arrancar pronto,
  (b) no encadenar análisis largos, (c) tener siempre un entregable a punto
  (aunque sea el MP4 sin revisar), y (d) avisar de los tiempos **antes** de
  lanzar algo largo. Si una tarea se alarga, se entrega lo que haya y se dice
  qué falta. **Nunca dejar el trabajo a medias esperando.**
  - **Lecciones de la pieza "millonario" (se pasó de 30 min):**
    1. Antes de lanzar un run, **comprobar los flags exactos en local**
       (`hf snapshot --help`): 3 runs muertos por flags inventados =
       ~15 min tirados.
    2. El lint de la nube tiene que **tolerar los assets que monta el propio
       runner** (`demo2/lint-ci.mjs`), o el render se cae antes de empezar.
    3. Un render por cada tanda de cambios del usuario: no encadenar más de
       uno con la misma observación.
    4. Si la dirección de arte está en duda, **revisar con 6 PNG del propio
       MP4** (ffmpeg local, segundos) antes de pedir otro render.
- **Cada pieza nueva nace con el pipeline rápido** (no se monta desde cero):
  material en la nube → comp **horneado** con ffmpeg (un plano por bloque,
  sin blends por frame) → **`mode: frames`** para revisar la dirección de arte
  en ~1 min → `demo2/ciclo.ps1` para entregar. Los pasos y sus tiempos están
  en `demo2/GUIA.md`.
- **El PC del usuario es malo (i3, 2 núcleos, 16 GB): solo valida y descarga.**
  En local: auditor (2 s), lint (1 min) y descargar el MP4 final. **Nunca**
  renders, snapshots, `ffmpeg` pesado ni análisis de vídeo frame a frame: todo
  eso va en la nube. Las descargas de paquetes pesados también: las librerías
  y los skills se instalan en el runner, no en su máquina.
- **Nunca una hora de trabajo (regla permanente):** ni editando el vídeo ni
  creándolo. El usuario no se queda esperando y no quiere cadenas de
  experimentos ni investigaciones largas. Si algo no se puede comprobar en
  minutos, **se para y se avisa**, no se sigue. Un vídeo corto se entrega en
  una sola pasada.
- **Entrega de vídeos (regla permanente):** cada vez que se renderice un vídeo
  (local o vía GitHub Actions), copiar el archivo final a
  `C:\Users\Admin\Desktop\` automáticamente. No hace falta que lo pida cada vez.
- **No hacer esperar:** un vídeo corto no puede costar una hora. Si algo va a
  tardar más de ~3 minutos, avisar de cuánto y por qué **antes** de lanzarlo.

## Flujo de vídeo (obligatorio)

**Todo el render va por la nube.** En local solo se mide, nunca se renderiza
para entregar:

1. **Render (final o de revisión): la nube.** GitHub Actions tarda 3,5-4,6 min
   (varía ~50% según la máquina que toque). El render local completo tarda
   ~11,5 min (1 worker y sin GPU) y no aporta nada: no se usa.
2. **Para revisar, mirar el vídeo ya entregado.** Los fotogramas se sacan del
   MP4 descargado con ffmpeg (instantáneo). No hace falta un render aparte.
3. **La entrega se verifica en la misma sesión.** Un trabajo en segundo plano
   **no** es una entrega: hay que confirmar que el run terminó, descargar el
   artifact y comprobar que el MP4 está en el Escritorio, y decirlo. Los
   artifacts exigen autenticación: el token es el de las credenciales de git
   (`git credential fill`, vía API de GitHub).
4. **No hacer esperar:** si algo va a tardar más de ~3 minutos, avisar de cuánto
   y por qué **antes** de lanzarlo.
5. **Al matar procesos por línea de comandos, excluir el propio `$PID`.**

### Lo que ya está medido (no repetir)

- El runner varía ~50% entre ejecuciones: el mismo trabajo tardó 145,7 s y
  215,2 s de captura. Por eso el total baila entre 3,5 y 4,6 min.
- 4 workers sale peor que 1: se pierde el "streaming encode" (los fotogramas
  van a ffmpeg según se capturan) y hay que codificar aparte (+55 s).
- En la nube no hay GPU, y `--experimental-fast-capture` (2x) es solo macOS.
- HyperFrames no renderiza rangos de tiempo, así que el render no se puede
  trocear entre varios runners.
- El coste por fotograma se reparte así (medido en local): captura de pantalla
  base 38%, los 11 vídeos 20%, los gráficos (SVG + glow) 42%.

## Rendimiento: el PC es una porquería y el runner también

- **Tu PC**: i3-4170, **2 núcleos** (4 hilos), 16 GB RAM. El runner de GitHub
  (`ubuntu-latest`, 4 vCPU) es de la misma familia → de ahí la varianza del
  ~50 % entre ejecuciones.
- **Lo que ya está decidido (medido, no inventado)**:
  - `ubuntu-latest` es lo único gratis: los runners grandes (8/16 vCPU) se
    **cobran también en repos públicos** ($0,022/min el de 8 núcleos).
  - **1 worker** gana siempre: con 4, captura y encoding compiten por los 2
    núcleos y se pierde el "streaming encode" (171 s frente a 146 s).
  - `--low-memory-mode` fija 1 worker, captura por pantalla y **se salta la
    calibración de workers** (14-20 s ahorrados). La imagen no cambia.
  - No hay GPU: `--no-browser-gpu` siempre. Por eso **no** se activa
    `--page-side-compositing` (6x más rápido solo con shader transitions, y
    con WebGL por software sale más lento que el blend de Node).
- **Flags que ya usa `render.yml`** para no perder tiempo:
  | Flag | Por qué |
  |---|---|
  | `--browser-timeout 180` | con 11 vídeos + fuentes la página tarda más de 60 s en un runner lento y el render se cae entero |
  | `--frames-cache-dir ~/.cache/hf-frames` | los fotogramas extraídos de los vídeos de origen se cachean entre ejecuciones (un rerender no los vuelve a extraer) |
  | `--resume` (opción `resumable=si`) | captura segmentada: si el render se cae, reutiliza los tramos ya grabados en vez de empezar de cero |
- **El mayor coste no es el vídeo, son los gráficos** (reparto medido: base
  38 % · vídeos 20 % · gráficos 42 %). `node demo2/audit-perf.mjs` dice cuánto
  cuesta cada composición y qué patrones caros tiene (`filter: blur()`,
  `filter: drop-shadow()`, `mix-blend-mode`, `backdrop-filter`…). Correlo
  **antes** de renderizar: quitar un `filter: blur()` suele valer más que
  cualquier ajuste del runner.
- **Renders en paralelo**: en repos públicos los minutos son gratis, así que
  varias piezas = varios dispatches a la vez (GitHub los corre a la vez en
  runners distintos). Parallelizar **dentro** de un render no compensa.
- **Borradores**: `quality=draft` + `fps=15` = la mitad de tiempo, para
  revisar; `quality=delivery` (o `high`) + `fps=30` para entregar.
- **Nunca renderizar en local** (2 núcleos, 11,5 min); el PC solo descarga.

## Skills de HyperFrames en la nube

- La acción compuesta `.github/actions/hf-skills` las instala en el HOME del
  runner (`~/.claude/skills` + el espejo universal `~/.agents/skills`) y las
  cachea (`hf-skills-v2`), así que se descargan una vez.
- **27 skills**: las 21 publicadas (router `hyperframes`, las de dominio
  `hyperframes-core/animation/audio/cli/creative/keyframes/registry/studio`,
  `media-use`, y los flujos de creación opcionales `product-launch-video`,
  `faceless-explainer`, `motion-graphics`, `music-to-video`, `pr-to-video`,
  `talking-head-recut`, `embedded-captions`, `slideshow`, `general-video`,
  `figma`, `remotion-to-hyperframes`) + las 6 internas del repo
  (`captions-overlay`, `changelog-video`, `cut-the-curve`, `motion-doctrine`,
  `oversized-cursor`, `seam-craft`).
- Ojo con la CLI de 0.8.162: el set completo se instala con **`hf skills`**
  a secas. `hf skills update` solo pone el core (10) + lo ya instalado, y
  `hf skills add` **no existe** (es de otro CLI: el de skills.sh).

## Dirección de arte de vídeos (reglas permanentes del usuario)

El usuario quiere los próximos vídeos con nivel "agencia premium" (After
Effects), no con estética de plantilla web. Para cualquier composición nueva
(**no se rediseña la promo Casa Modular existente, esa queda como está**):

1. **Regla de oro de espaciado:** nunca márgenes/paddings por defecto. Layouts
   con aire abundante (generoso, flexbox/grid equilibrados). Los elementos
   nunca rozan los bordes del vídeo.
2. **Tipografía cinematográfica:** sans-serif limpias; contraste masivo de
   escala (títulos muy grandes y delgados vs. subtítulos pequeños y legibles);
   cuidar `line-height` para no amontonar texto.
3. **Paletas de alto nivel:** nada de colores planos saturados. Modos oscuros
   premium (#0B0F19, #121827), acentos de neón con desenfoque (blur CSS),
   gradientes suaves de máx. dos tonos complementarios, transparencias
   elegantes (`backdrop-filter: blur`).
4. **Movimiento fluido (GSAP):** curvas naturales (`power3.out`, `expo.out`).
   Transiciones de texto letra por letra o palabra por palabra, orgánicas, con
   `data-start`/`data-duration` al milímetro.
5. **Minimalismo corporativo:** si algo no es necesario para la composición,
   se elimina. El resultado debe parecer un video premium de agencia.

### Norma de rendimiento premium (decisión del usuario: aplicar)

El look premium no sale del blur: sale del aire, la tipografía y los easings.
El desenfoque decorativo va siempre en su versión barata y visualmente
equivalente, porque el coste escala con los fotogramas:

- **Orbes/luces de ambiente:** gradiente radial transparente (la suavidad la
  da el gradiente) — nunca `filter: blur()`.
- **Glow de texto:** `text-shadow` multicapa — nunca `filter: blur()`.
- **`backdrop-filter` (cristal):** se mantiene REAL cuando hay contenido en
  movimiento detrás (fotos/texto/vídeo); solo se evita donde el fondo detrás
  es casi uniforme, que ahí el real y el falso se ven igual.

Referencia medida: en Casa Modular los gráficos con glow eran el 42% del
coste por fotograma; la variante barata recorta 15-25% del total sin cambio
visual, ~1,5-3 min por render en una pieza de 60 s.

## Reglas de control de HyperFrames (norma permanente del usuario)

Aplica a **toda** composición nueva o modificada de este repo. Objetivo:
render fluido (sin fotogramas congelados) y automatización escalable.

### 1. Prohibido

- `transition: all 0.3s ease` o cualquier transición CSS: HyperFrames no puede
  calcular el tiempo exacto por frame. **Ni `transition: none`**: no se escribe
  la propiedad `transition` en el CSS de las composiciones.
- `requestAnimationFrame`, `setTimeout`, `setInterval` en el JS de la composición.
- Embeber imágenes en Base64 o vídeos locales pesados dentro del HTML: los
  assets van como archivos referenciados por `src` y se commitean al repo
  (el CI falla con `missing_local_asset` si no están).

### 2. Animaciones deterministas

- Sólo **keyframes CSS** con `animation-play-state: paused` (el renderizador
  controla el progreso) **o** timeline **GSAP** registrada en
  `window.__timelines[<composition-id>]`, creada con `{ paused: true }`.
  - En GSAP el 3.er argumento es el **tiempo absoluto** en segundos.
  - Propiedades soportadas por el runtime: `opacity, x, y, scale, scaleX, scaleY,
    rotation, width, height, visibility`. Para cualquier otra propiedad
    (color, text-shadow, filter…) se cambia una **clase CSS** con `tl.set()`
    sobre `className`, o se hace cross-fade entre dos elementos.
- Todo elemento animado lleva `will-change` con la propiedad que va a mutar
  (`transform`, `opacity`).
- Cada escena va en un contenedor con duración explícita:
  `<div class="scene" data-start="0" data-duration="3.6">`.
  - `data-duration` va en **segundos** (3.6 = 3,6 s), no en milisegundos.
- El **build de la timeline es síncrono**: se llama `build()` directamente, sin
  `document.fonts.ready.then(...)` ni promesas. Si la línea de tiempo no está
  registrada cuando el renderizador pide el primer fotograma, el MP4 sale
  congelado. Con `gsap.ticker.fps(30)` sincronizado con `data-fps`.
- **GSAP se carga en local** desde `assets/vendor/gsap.min.js` (vendorizado,
  **3.15.0**). Nada de CDN: si jsdelivr falla, no hay timeline y el vídeo sale
  congelado. Ruta: `assets/vendor/gsap.min.js` (root) o
  `../assets/vendor/gsap.min.js` (dentro de `compositions/`).
- **Los plugins de GSAP están vendorizados** en `assets/vendor/gsap/` (los 24
  ficheros `*.min.js` del paquete npm: SplitText, ScrollTrigger, MotionPath,
  MorphSVG, DrawSVG, Draggable, Flip, Observer, CustomEase, TextPlugin,
  ScrambleText, Inertia, GSDevTools…). Se cargan **por plugin** y se registran:
  ```html
  <script src="../assets/vendor/gsap/SplitText.min.js"></script>
  <script>gsap.registerPlugin(SplitText);</script>
  ```
- **El resto de runtimes que HyperFrames soporta, también vendorizados** en
  `assets/vendor/` (versiones = las que recomienda el propio framework):
  | Runtime | Fichero | Paquete npm |
  |---|---|---|
  | Anime.js | `anime.umd.min.js` | `animejs@4.5.0` (UMD) |
  | Lottie | `lottie.min.js` | `lottie-web@5.12.2` (bodymovin) |
  | Three.js | `three.module.js` | `three@0.181.2` (ESM: necesita `importmap`) |
  | D3 | `d3.min.js` | `d3@7.9.0` |
  | Leaflet | `leaflet/` (js, css, marcadores) | `leaflet@1.9.4` |
  | MapLibre | `maplibre/` (mjs, worker, css) | `maplibre-gl@6.15.0` |
  | Mapbox | `mapbox/` (js, css; necesita token) | `mapbox-gl@3.33.0` |
  | TypeGPU | `typegpu/` (WebGPU; el runner no tiene GPU) | `typegpu@0.12.8` |
  | WAAPI / CSS | nativo del navegador | — |
  Three.js es ESM, así que va con importmap local:
  ```html
  <script type="importmap">
  {"imports":{"three":"../assets/vendor/three.module.js"}}
  </script>
  ```
- `demo2/verify-vendor.mjs` comprueba que **todo** lo vendorizado es byte a
  byte lo mismo que instala npm (lo ejecuta el CI en `render.yml` y en
  `validate.yml`): si cambia un fichero a mano, el repo y la nube renderizan
  distinto.

### 3. Variables en render-time (API real de HyperFrames 0.8.x)

La spec del usuario se implementa con los atributos que **existen** en el
runtime. Verificado en el paquete `hyperframes` (0.8.162/0.8.172):

- `data-composition-variables` va en `<html>` y es un **array JSON** de
  declaraciones, no un objeto:
  ```html
  <html data-composition-variables='[
    {"id":"title","type":"string","label":"Título","default":"Texto Base"},
    {"id":"logoUrl","type":"image","label":"Logo","default":"default.png"},
    {"id":"primaryColor","type":"color","label":"Color","default":"#000"}
  ]'>
  ```
  Tipos válidos: `string, number, color, boolean, enum, font, image`.
- Binding a un elemento: **`data-var-text="id"`** (texto) y
  **`data-var-src="id"`** (imagen). **No existen** `data-variable`,
  `data-variable-src` ni `data-variable-style-background`: no usarlos.
  - Ojo: la spec del usuario en texto plano menciona `data-variable`,
    `data-variable-src` y `data-variable-style-background`; esos nombres
    **no existen** en HyperFrames 0.8.x y el linter los marca como obsoletos.
    Se usan los equivalents reales (`data-var-text`, `data-var-src`).
  - Para **fondos/colores** no hay atributo: se declara una variable de tipo
    `color` y se aplica en JS sobre una custom property CSS
    (`--primary`, `--primary-soft`…) leyendo `getVariables()`.
- Valores por instancia de sub-composición: `data-variable-values='{"title":"Pro"}'`
  en el elemento host.
- En JS: `window.__hyperframes.getVariables()` devuelve el merge
  (defaults → overrides del host → `--variables` de CLI).
- El linter avisa (`unknown_variable_binding`) si un `data-var-*` apunta a un
  id no declarado, y falla si la declaración no es un array JSON válido.
- **Convenciones propias** (el runtime no las inyecta; se aplican en el JS de
  la composición leyendo `getVariables()`):
  - `data-var-lines="id"` para títulos con salto de línea (`\n` → `<br />`),
    porque `data-var-text` reemplaza el contenido y se comería el `<br />`.
  - Los titulares letra a letra (`.mask i`, `.l i`) se **reconstruyen** desde
    la variable en JS: una `<i>` por carácter.
  - Cada composición declara sus variables y las aplica: texto con
    `data-var-text`, imágenes/vídeos/audio con `data-var-src`.

### 4. Verificación antes de renderizar

- **Auditor de reglas (obligatorio, sin arrancar Chrome):**
  `node demo2/audit-rules.mjs` revisa todas las composiciones (`index.html` +
  `compositions/*.html`) y debe dar **0 problemas**:
  - no `transition:` en el CSS, ni `requestAnimationFrame`/`setTimeout`/
    `setInterval` en el JS de la composición,
  - `will-change` con la propiedad correcta en todo elemento animado,
  - `data-duration` en todo contenedor con `data-start`,
  - `data-var-*` siempre apuntando a una variable declarada, sin atributos
    obsoletos, y sin recursos embebidos en base64,
  - `gsap.ticker.fps()` con el mismo valor que `data-fps`, timeline registrada
    con el `data-composition-id` y build **síncrono**.
  - `node demo2/fix-willchange.mjs [--write]` añade el `will-change` que falte
    (reglas por id, para no tocar clases compartidas). **Solo edita la regla
    afectada**: nunca reconstruir el CSS entero desde un parseo ingenuo (una
    versión anterior así descolocó reglas y dejó llaves sin cerrar).
- **Integridad del CSS:** `node demo2/check-css-integrity.mjs` compara el
  `<style>` actual con el original (`git show 899ac3a:<fichero>`) y avisa si
  cambia algo que no sea `will-change`. Ejecutar tras tocar CSS.
- **Lint local con la MISMA versión del CI** (el CI usa 0.8.162):
  `npx --yes hyperframes@0.8.162 lint .` → debe dar **0 errores**. Los warnings
  son admisibles. Este paso es el que bloquea el render si falla.
- `npx hyperframes lint .` en local **y** el CI lintea con 0.8.162: si el
  local (0.8.172) da 0 errores, el CI puede marcar `missing_local_asset` si
  un asset referenciado no está commiteado. `git add` siempre los assets.
- Los MP4 fuente deben ser H.264 **Constrained Baseline** para que Chrome
  headless los decodifique: `-profile:v baseline -level 3.1`.

### 4.1 Verificación del MP4 entregado (el "9.9 visual")

**Todo esto corre en la nube (el PC del usuario solo descarga):**

| Paso | Dónde |
|---|---|
| Descarga de logos/fotos de marca (si faltan) | CI, paso "Prepare the brand assets" |
| Lint de la composición | CI (0.8.162) |
| Render del MP4 | CI |
| Perfil de movimiento + fotogramas congelados | CI, paso "Verify the MP4" |
| Hoja de contactos con timecodes | CI, artifact `hyperframes-qc` |
| Descarga a `C:\Users\Admin\Desktop\` | local, **sin análisis** (solo ficheros) |

En local (solo si hace falta y es barato):

```bash
node demo2/verify-render.mjs "C:/Users/Admin/Desktop/<video>.mp4" demo2/qc9
node demo2/contact-sheet.mjs "C:/Users/Admin/Desktop/<video>.mp4" salida.png
```

- Perfil de movimiento por frame (`tblend=difference` + `signalstats`):
  **0 frames con YAVG = 0** = ningún fotograma congelado.
- Lista de cambios de plano: deben caer donde dice la tabla de tiempos de la
  composición.
- Filmstrip (2 fps) + 8 fotogramas clave (540 px) para la revisión visual.
- Es la única fuente de verdad: se revisa el MP4 entregado, no capturas
  intermedias. Es barato (ffmpeg sobre 12 s = segundos).
- **Ojo**: el ffmpeg estático del CI no trae `drawtext`; para la hoja con
  timecodes el CI instala el ffmpeg de apt. `contact-sheet.mjs` cae a una hoja
  sin timecodes si no lo encuentra.

### 4.2 Reels de marca (barra de logos + fotos)

- Logos: `demo2/get-logos.mjs` (Wikidata P154 → Commons, con validación por
  alfa para que no cuele una foto de edificio). Créditos en
  `assets/logos/CREDITOS.md`.
- Fotos de coches: `demo2/get-fotos-coche.mjs` (imagen principal del artículo
  del modelo, 1600 px). Créditos en `assets/coches/CREDITOS.md`.
- Estructura de la réplica de edición: barra de marcas arriba (logo + nombre en
  su color, paneando), foto del coche a sangre con push lento, nombre de
  marca grande al centro, pies de foto blancos al beat, cierre a negro con CTA.

## Coreografía medida del promo VELUXE (referencia, no repetir la medición)

Medido sobre la **banda limpia del v1** (`demo2/new/master.mp4`, 1080×1520) con
diferencias por frame (`tblend=difference` + `signalstats`) y con detección de
cajas por color. No volver a medir: estos son los tiempos reales.

| t (s) | qué hace el original |
|---|---|
| 0.00–1.02 | travelling **continuo**: el cartel sale por la izquierda mientras entra la puerta. NO hay corte ni flash. |
| 1.02–1.60 | sigue el travelling; el neon VELUXE entra por arriba y **crece** (el bloque de letras pasa de ~250 a ~290 px de ancho) |
| 1.60–2.30 | el neon sigue creciendo; el resto del cuadro, quieto |
| 2.30–3.20 | los stickers del póster entran escalonados (picos de movimiento ~10–12) |
| 3.40–4.60 | **calma total** (movimiento < 1.5): el plano se queda quieto |
| 4.60–5.38 | empuje rápido al primer plano de los dos chicos |
| 5.44 | **corte seco** a la fiesta (movimiento 31–40: es un cambio de plano, no un fundido) |
| 5.50 | fogonazo azul de un frame |
| 5.62–9.37 | fiesta: personaje gigante 5.62, cambio 7.45, cambio 8.15, pop 8.90 |
| 9.00 | fogonazo magenta (último fotograma) |

Consecuencias para cualquier recreación:

- **No inventar flashes blancos** en los cambios de escena: el original sólo
  tiene el fogonazo azul (5.50) y el magenta (9.00).
- **No inventar encendido letra a letra** del neon: crece el bloque entero.
- La escena del póster **no hace drift**: entre 3.40 y 4.60 está quieta.
- El travelling inicial es un movimiento de cámara continuo, no dos planos.

Herramientas de medición (ya escritas, reutilizar):
`demo2/measure-zoom.mjs`, `demo2/measure-band-zoom.mjs`, `demo2/parse-motion.mjs`,
`demo2/peek.mjs` (busca en el bundle minificado de HyperFrames sin volcarlo).

## REGLA ANTI-TARDANZA (máxima prioridad)

El PC del usuario es lento ("una tostadora"). **El tiempo de trabajo se cuenta como coste real.**

- **NUNCA renderizar en local.** Ni `hyperframes render`, ni `snapshot`, ni
  captura de frames para verificar. Todo render va a GitHub Actions.
  Un `snapshot` local = arranque de Chrome = ~40-90 s por tanda. Prohibido.
- **NUNCA analizar vídeo frame a frame en local** (ffmpeg sobre el original,
  scripts de medición). Solo si es imprescindible, y con un presupuesto
  explícito de **2 minutos**; si no cabe, se decide con lo que ya se sabe.
- **NUNCA bucear en el bundle minificado** de HyperFrames para descubrir la
  API: `npx hyperframes docs` y `npx hyperframes lint` dan la spec en segundos.
  Si aun así hay que mirar, `demo2/peek.mjs` con un patrón **puntual**.
- **Una entrega = un ciclo**: medir → construir → render en nube → verificar
  con fotogramas del MP4 **descargado** (ffmpeg, instantáneo) → entregar.
  Máximo **2 renders en nube** por tarea; si el 2º no cuadra, parar, avisar y
  entregar lo mejor.
- **Antes de arrancar cualquier herramienta**: decir en una línea cuánto va a
  tardar y por qué. Si son > 3 min → avisar antes de lanzarlo.
- No encadenar XT (leer bundle + medir + render + render). Cada paso se
  justifica con un dato que falte.
- **No buscar assets externos si ya hay un asset local o del propio material.**
  Hoy se perdieron ~20 min descargando personajes de Wikimedia cuando el
  material del proyecto ya traía lo necesario. Regla: antes de descargar
  nada, listar lo que YA existe en `demo2/new/` y en el repo.
- **Los `snapshot` locales son el mayor coste**: cada uno arranca Chrome
  (~40-90 s). Máximo **1** por tarea, y sólo si hay un bug real que
  verificar. Para revisar un render, extraer fotogramas del MP4 con ffmpeg
  (instantáneo).
- No descargar imágenes para "mejorar" un resultado: si el material ya está,
  se usa.

## Brief del promo VELUXE (leído bien, no al revés)

- **Los primeros ~5,4 s (el póster) se hacen con material NUEVO.**
  La **fiesta (5,44 – 9,37 s) va ORIGINAL**, tal cual (trae su corte, su
  fogonazo azul, sus personajes y el fogonazo magenta ya dentro del clip).
- El material nuevo del póster son fotos nuestras (`e1_wide.jpg` = calle con
  neón, `e2_wide.jpg` = cartel vertical de hotel) + el cartel de papel, el
  neón "VELUXE" y los stickers die-cut en SVG.
- La coreografía del póster es la **medida** (ver tabla arriba): travelling
  0–1,02 · neón que crece 1,05–1,72 · stickers 1,72/2,35/2,80/3,20 · calma
  3,40–4,70 · push-in 4,76–5,38 · corte seco a 5,44.
- La tipografía ("out of the ordinary", lineup, ACCESS, DOBEL) va **recortada
  del original con alfa** (`foot_txt.png` / `date_txt.png`), no reescrita: así
  es idéntica píxel a píxel. Para extraer alfa con ffmpeg, el orden correcto
  es `[mascara][color]alphamerge` (la máscara va primero).
- Marco: la banda del reel es 1080×1520 centrada en 1080×1920 (200 px de
  negro arriba y abajo), igual que el v1. Las tres bandas van apiladas con
  `z-index` 1/2/3 o la última tapa a las demás.

## Cómo clonar el montaje de un vídeo de referencia (método)

1. **Medir, no suponer.** El perfil de movimiento por frame (`tblend=difference`
   + `signalstats` + `metadata=print`) da los cortes reales y los "tiempos de
   aire" (hueco entre cambios). Un `filmstrip` (frames cada 0,3-0,5 s en una
   tira) se lee como secuencia y delata lo que los frames sueltos no Teachen
   (revelados por palabras, entradas escalonadas, cursor, zoom-outs).
2. **Una sola tabla de verdad** para escenas + timeline + cursor. Si los tiempos
   viven en dos sitios, se desincronizan. Hoy estaba en un script aparte y por
   eso el "hook" se quedó con el titular invisible.
3. **El `<video>` de referencia solo se mira, nunca se copia.** El material
   recreado es propio: fotos de stock, mockups reconstruidos en HTML/SVG y
   tipografía compuesta con variables de render-time.
4. **Verificar con fotogramas del MP4 descargado**, no con `snapshot`: el
   snapshot captura antes de que cargue la webfont (se ve serif) y a 145 px no
   se aprecia un título ausente. Un frame a resolución completa del MP4 sí.
5. **Cuidado con la codificación**: leer/escribir el HTML como `latin1` rompe
   los acentos. Siempre UTF-8 explícito, y comprobar con
   `node demo2/chk3.mjs` (busca doble codificación `Ã¡`).

### Lo que hay que mirar en un render (checklist de 30 s)

- ¿Sale el titular? (los `div.title`/`div.badge` llevan `opacity: 0` en CSS:
  si animas los `<span>` hijos en vez del padre, el padre se queda invisible)
- ¿Las tarjetas/mockups llenan el frame como en la referencia?
- ¿Los tiempos de corte coinciden con la tabla medida?

## Contexto

- Proyecto HyperFrames en este directorio: `index.html` es la composición.
- Repositorio remoto: https://github.com/lenz010101/mi-video (público).
- El render se ejecuta en la nube con GitHub Actions
  (`.github/workflows/render.yml`), que publica el MP4 como artifact.
- La salida local de trabajo vive en `renders/`.
