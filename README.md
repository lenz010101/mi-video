# WOKIROLL — Escárcega, Campeche

Vídeo promocional vertical (9:16) hecho con **HTML + CSS + GSAP** y renderizado
**100% en GitHub**. No hace falta instalar Node.js, FFmpeg ni Chrome en tu
ordenador: el render corre en la nube de GitHub Actions y el MP4 aparece como
*artifact* descargable.

<https://github.com/lenz010101/mi-video>

---

## El vídeo

| Dato        | Valor                            |
| ----------- | -------------------------------- |
| Formato     | 1080 × 1920 (9:16 vertical)      |
| Duración    | 17,5 s                           |
| FPS         | 30                               |
| Audio       | Sí (música de fondo con fundidos)|
| Escenas     | 5                                |

**Guion:**

| # | Escena        | Qué se ve                                                        |
| - | ------------- | ---------------------------------------------------------------- |
| 1 | Logo          | Aparición letra a letra de **WOKIROLL**, "EST. 1995", brillo y sello |
| 2 | Carta         | Tipografía cinética: ROLLS · KIMBAP · WOK · RAMEN · SUSHI · ONIGIRI |
| 3 | Fotos         | 4 fotografías a pantalla completa con *Ken Burns* y rótulos       |
| 4 | Diferencias   | Wok 300 °C · Preparado en vivo · Para llevar                      |
| 5 | Invitación    | "ESCÁRCEGA, CAMPECHE" + **TE ESPERAMOS**                          |

---

## Qué hay en este repositorio

```
.
├── index.html                       # La composición (el "guion" del vídeo)
├── assets/
│   ├── fonts/                       # Bebas Neue + Inter (empaquetadas)
│   ├── img/                         # Fotografías de la escena 3
│   └── audio/
│       └── music-source.mp3         # Pista original (el workflow la recorta)
├── .github/workflows/
│   ├── render.yml                   # Render en la nube de GitHub (sin cuentas)
│   └── render-cloud.yml             # Render en la nube de HeyGen (opcional)
└── README.md
```

`index.html` contiene una *timeline* de GSAP **en pausa** que HyperFrames
recorre fotograma a fotograma. El resultado es siempre idéntico y reproducible.

---

## Cómo funciona

```
push a GitHub  ─►  GitHub Actions  ─►  Node 22 + FFmpeg  ─►  hyperframes render
                                                                     │
                                          artifact "hyperframes-video" ◄┘
```

1. Subes los cambios al repositorio.
2. GitHub Actions arranca una máquina virtual Ubuntu, instala Node 22 y FFmpeg.
3. Recorta la música: `ffmpeg` la corta a 17,5 s y le aplica fundido de
   entrada y de salida generando `assets/audio/music.mp3`.
4. Ejecuta `hyperframes lint` (si falla, **no** renderiza) y después
   `hyperframes render`.
5. Captura fotogramas de revisión y comprueba que el MP4 tenga audio.
6. Publica dos *artifacts*: el vídeo y los fotogramas de control.

---

## Renderizar

### Automático

Cada `push` que toque `index.html`, `assets/**` o los workflows lanza un render.

### Manual, con opciones

1. En GitHub ve a la pestaña **Actions**.
2. Elige **Render video** en la barra lateral izquierda.
3. Pulsa **Run workflow** y ajusta:
   - `quality`: `draft` | `standard` | `high`
   - `fps`: fotogramas por segundo (1–240)
   - `format`: `mp4` | `webm` | `mov` | `gif`
   - `filename`: nombre del archivo dentro de `renders/`
4. Pulsa el botón verde **Run workflow**.

### Descargar el vídeo

Cuando el workflow termina en verde, entra en esa ejecución, baja hasta
**Artifacts** y descarga:

- **hyperframes-video** — un `.zip` con el MP4 final.
- **hyperframes-frames** — fotogramas sueltos + una hoja de contactos para
  revisar el resultado de un vistazo.

---

## Editar el vídeo

| Quiero cambiar…          | Dónde                                                       |
| ------------------------ | ----------------------------------------------------------- |
| Los textos               | Los `<h1>`, `<p>` y `<div>` dentro de `#stage`               |
| **Los platillos**        | Las líneas `<div class="word">` de la escena `#s2`           |
| **Las fotos**            | Sustituye los archivos de `assets/img/` (mismo nombre) o edita los `src` de `#s3` |
| **Los rótulos de foto**  | Los `<span class="k">`, `<b>` e `<i>` dentro de `#s3 .shotCap` |
| Los colores              | `#bg`, `#glowA`, `#glowB` y las variables de cada escena      |
| La duración              | `data-duration` en `#stage` **y** `-t` del paso de música     |
| El ritmo de las escenas  | Los números de tiempo de la *timeline* de GSAP                |
| La resolución / fps      | `data-width`, `data-height` y `data-fps` en `#stage`          |
| **La música**            | Reemplaza `assets/audio/music-source.mp3`                     |

### Reglas rápidas de HyperFrames

- La animación va en una timeline **en pausa** registrada en
  `window.__timelines["<data-composition-id>"]`. HyperFrames la "busca" en cada
  fotograma, así que el resultado es reproducible.
- Nada de `setTimeout` ni animaciones dependientes del reloj real.
- **Ojo con GSAP + CSS:** si un elemento ya tiene `transform` en CSS, GSAP mide
  ese valor en píxeles y los `to { xPercent/yPercent }` se vuelven inútiles.
  Por eso los valores iniciales se fijan siempre con `fromTo`.
- El `lint` bloquea el render. Los avisos más comunes son
  `overlapping_gsap_tweens` (dos tweens solapados sobre lo mismo),
  `gsap_css_transform_conflict` y `gsap_non_transform_motion`.

---

## Créditos y licencias

### Música

> **"Late Nights In Osaka"** — *YellowTree*
> Fuente: [Freesound](https://freesound.org/s/595751/)
> Licencia: [Creative Commons BY 4.0](https://creativecommons.org/licenses/by/4.0/)
> (uso comercial permitido **con atribución**)

### Fotografías

Imágenes de [Unsplash](https://unsplash.com), bajo la
[Unsplash License](https://unsplash.com/license): uso comercial permitido y
gratuito, sin necesidad de atribución.

> ⚠️ Las fotos son de archivo: **no son del local de Escárcega**. Si quieres
> sustituirlas por fotos reales del restaurante, reemplaza los archivos de
> `assets/img/` manteniendo el mismo nombre y vuelve a lanzar el render.

### Tipografías

- **Bebas Neue** — SIL Open Font License 1.1
- **Inter** — SIL Open Font License 1.1

### Motor de render

HyperFrames — Apache 2.0 · <https://github.com/heygen-com/hyperframes>

---

## Opcional: renderizar en la nube de HeyGen

`render.yml` usa la máquina de GitHub, que es gratis para repositorios públicos.
Si prefieres el render gestionado de **HyperFrames Cloud** (HeyGen):

1. Crea una API key en <https://app.heygen.com> (`HEYGEN_API_KEY`).
2. En el repositorio: **Settings → Secrets and variables → Actions →
   New repository secret**, nombre `HEYGEN_API_KEY`.
3. Ve a **Actions → Render on HeyGen Cloud → Run workflow**.

---

## Enlaces

- Documentación: <https://hyperframes.heygen.com/introduction>
- Repositorio del motor: <https://github.com/heygen-com/hyperframes>
