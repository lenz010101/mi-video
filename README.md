# Hola desde GitHub — HyperFrames

Vídeo hecho con **HTML + CSS + GSAP** y renderizado **100% en GitHub**.
No hace falta instalar Node.js, FFmpeg ni Chrome en tu ordenador: el render corre
en la nube de GitHub Actions y el MP4 aparece como *artifact* descargable.

---

## Qué hay en este repositorio

```
.
├── index.html                          # La composición (el "guion" del vídeo)
├── .github/
│   └── workflows/
│       ├── render.yml                  # Render en la nube de GitHub (sin cuentas)
│       └── render-cloud.yml            # Render en la nube de HeyGen (opcional)
├── .gitignore
└── README.md
```

`index.html` es un vídeo de 6 segundos a 1920×1080 y 30 fps: una insignia, una
barra de acento, un titular y un subtítulo, todos animados con una *timeline* de
GSAP en pausa que HyperFrames recorre fotograma a fotograma.

---

## Cómo funciona

```
push a GitHub  ─►  GitHub Actions  ─►  Node 22 + FFmpeg  ─►  hyperframes render
                                                                     │
                                          artifact "hyperframes-video" ◄┘
```

1. Subes los cambios al repositorio.
2. GitHub Actions arranca una máquina virtual Ubuntu, instala Node 22 y FFmpeg.
3. Ejecuta `hyperframes lint` y después `hyperframes render`.
4. Guarda el MP4 como *artifact* del workflow para que lo descargues.

---

## Puesta en marcha (una sola vez)

Como en tu equipo no hay `git` instalado, lo más rápido es usar la web de GitHub:

1. Entra en <https://github.com/new> y crea un repositorio (por ejemplo
   `hyperframes-github`) **público** o **privado**, sin README ni .gitignore.
2. En el repositorio recién creado, pulsa **Add file → Upload files**.
3. Arrastra **todo el contenido de esta carpeta**, incluida la carpeta oculta
   `.github` (activa "ver archivos ocultos" en el explorador de Windows:
   *Vista → Mostrar → Elementos ocultos*).
   - `index.html`
   - `README.md`
   - `.gitignore`
   - `.github/workflows/render.yml`
   - `.github/workflows/render-cloud.yml`
4. Escribe un mensaje de commit y pulsa **Commit changes**.

> ¿Prefieres hacerlo desde la terminal? Instala las herramientas con:
> `winget install --id Git.Git -e` y `winget install --id GitHub.cli -e`,
> y luego `gh auth login`, `git init`, `git add .`, `git commit -m "first"`,
> `git push`.

---

## Renderizar

### Automático

Cada `push` que toque `index.html` (o los workflows) lanza un render.

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

Cuando el workflow termina en verde, entra en esa ejecución y baja hasta
**Artifacts** → descarga **hyperframes-video** (un `.zip` con el vídeo dentro).

---

## Editar el vídeo

Todo se controla desde `index.html`:

| Quiero cambiar…        | Dónde                                                            |
| ---------------------- | ---------------------------------------------------------------- |
| El texto               | Los `<h1>`, `<p>` y `<div>` dentro de `#stage`                    |
| Los colores            | El `background` de `#stage` y el gradiente de `#accent`           |
| La duración            | `data-duration="6"` en `#stage` **y** en cada `.clip`             |
| La animación           | La *timeline* de GSAP del final del archivo                       |
| La resolución / fps    | `data-width`, `data-height` y `data-fps` en `#stage`              |

Reglas rápidas de HyperFrames:

- Cada elemento que aparece en el tiempo lleva `class="clip"`, `data-start`,
  `data-duration` y `data-track-index` (las pistas no deben solaparse).
- La animación va en una timeline **en pausa** registrada en
  `window.__timelines["<data-composition-id>"]`. HyperFrames la "busca" en cada
  fotograma, así que el resultado es reproducible.
- Nada de `setTimeout` ni animaciones dependientes del reloj real: se desincronizan.

---

## Opcional: renderizar en la nube de HeyGen

`render.yml` usa la máquina de GitHub, que es gratis para repositorios públicos.
Si prefieres el render gestionado de **HyperFrames Cloud** (HeyGen):

1. Crea una API key en <https://app.heygen.com> (`HEYGEN_API_KEY`).
2. En el repositorio: **Settings → Secrets and variables → Actions →
   New repository secret**, nombre `HEYGEN_API_KEY`.
3. Ve a **Actions → Render on HeyGen Cloud → Run workflow**.

Ese workflow hace `hyperframes auth login --api-key` y luego
`hyperframes cloud render`, que empaqueta, sube, espera el render y descarga el
vídeo final.

---

## Opcional: un diseño, muchos vídeos (variables)

Puedes convertir partes del `index.html` en plantillas y renderizar variantes
sin duplicar el diseño. Añade la declaración a la composición y enlaza el texto:

```html
<div
  id="stage"
  data-composition-id="hello-github"
  data-composition-variables='[
    {"id":"title","type":"string","label":"Titular","default":"Hola desde GitHub"}
  ]'
>
  <h1 id="title" class="clip" data-start="0" data-duration="6" data-track-index="3"
      data-var-text="title">Hola desde GitHub</h1>
</div>
```

Después, en `render.yml`, pasa los valores:

```yaml
--variables '{"title":"Q4 Recap"}'
# o, para muchas filas:
--variables-file rows.json --batch --output "renders/{name}.mp4"
```

---

## Enlaces

- Documentación: <https://hyperframes.heygen.com/introduction>
- Render en la nube: <https://hyperframes.heygen.com/deploy/cloud>
- Repositorio: <https://github.com/heygen-com/hyperframes>
- Licencia: Apache 2.0
