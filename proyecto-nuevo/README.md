# Proyecto nuevo — reel con presentador (edición de referencia)

Réplica de la edición del reel de referencia (`Sígueme si te gustan los carros`):
**presentador a cámara + columna izquierda de tiras LED con apodos y logos de
marca + texto neón con las palabras de la narración + cierre con botón y check
verificado**.

Vertical **1080×1920 · 30 fps · 20 s**. Proyecto **autocontenido**: fuentes,
GSAP, música, logos y el clip del presentador viven dentro de `assets/`.

```
proyecto-nuevo/
├─ index.html                 composición + timeline GSAP
└─ assets/
   ├─ clips/presenter.mp4     presentador (stock, vertical 720×1280, Constrained Baseline)
   ├─ logos/                  Toyota, Honda, BMW, Mercedes, Porsche, Nissan, Audi, Ford, Lexus, VW
   ├─ fonts/                  Anton, Orbitron, Playfair, Inter (locales)
   ├─ vendor/gsap.min.js      GSAP 3.12.5 vendorizado (nada de CDN)
   ├─ audio/music-source.mp3  música
   └─ grain.png               textura de grano
```

## Estructura de tiempos (segundos)

| t | qué pasa |
|---|---|
| 0 – 0,3 | flash de apertura y entrada de los apodos (POBRE · RICO · MILLONARIO) |
| 0 – 14,4 | presentador en plano medio con push-in lento (1 → 1,06) |
| 1,3 / 2,05 / 2,8 / 3,55 | entran los logos Toyota, Honda, BMW, Mercedes |
| 4,35 – 14,0 | palabras de la narración una detrás de otra (entra con flash, sale en fundido) |
| 11,6 / 13,3 | entran Porsche y Nissan |
| 14,4 | **corte de edición**: punch-in de la misma toma (1,34 → 1,30) + flash |
| 14,1 – 17,6 | segunda tanda de palabras |
| 17,7 | zoom out a negro y entrada del cierre |
| 18,4 / 18,85 / 18,95 | titular de cierre + botón + usuario |

Cada escena lleva `data-start` y `data-duration` explícitos y todo el metraje
tiene movimiento continuo (push-in, deriva de columnas, grano): **ningún
fotograma se queda quieto**.

## Cambiar el contenido

Variables en el array `data-composition-variables` de `<html>`:

| variable | qué es |
|---|---|
| `tier1` `tier2` `tier3` | los tres apodos de las columnas (POBRE / RICO / MILLONARIO) |
| `n1` … `n14` | las palabras de la narración (texto neón) |
| `s1` … `s6` | los stickers de marca |
| `closeTitle` `cta` | titular de cierre y usuario del botón |
| `talkerSrc` `talker2Src` | clip del presentador (los dos planos) |
| `toyotaSrc` … `nissanSrc` | logos |
| `musicSrc` | música |

Los valores por defecto están en el propio `index.html`.

Para cambiar de presentador: sustituye `assets/clips/presenter.mp4` por otro
clip **H.264 Constrained Baseline** (si no, Chrome headless no lo decodifica) de
al menos 8 s y 9:16.

## Renderizar

Solo en la nube (GitHub Actions), nunca en local:

```bash
node demo2/ciclo.mjs proyecto-nuevo/index.html proyecto-nuevo.mp4
```

Renderiza, verifica fotogramas congelados y cortes, y deja el MP4 en
`C:\Users\Admin\Desktop\`.

## Reglas que cumple (no romper al editar)

- Sin `transition` en CSS (ni `transition: none`).
- Sin `requestAnimationFrame` / `setTimeout` / `setInterval`.
- **Build síncrono**: `build()` se llama directo, sin `fonts.ready` ni promesas.
- `gsap.ticker.fps(30)` = `data-fps="30"`.
- Timeline registrada como `window.__timelines["proyecto-nuevo"]`, creada con
  `{ paused: true }`.
- `will-change` con la propiedad que muta en cada elemento animado.
- `data-start` siempre con `data-duration` en segundos.
- Toda `data-var-*` apunta a una variable declarada.

Comprobación antes de renderizar:

```bash
node demo2/audit-rules.mjs proyecto-nuevo             # 0 problemas
npx --yes hyperframes@0.8.162 lint proyecto-nuevo    # 0 errores
```
