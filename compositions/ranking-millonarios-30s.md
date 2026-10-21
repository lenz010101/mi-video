# Ranking "Los coches de los millonarios" — 30 s vertical (9:16)

Composición: **`compositions/ranking-millonarios-30s.html`**
Render en la nube: `node demo2/ciclo.mjs compositions/ranking-millonarios-30s.html ranking-millonarios-30s.mp4`
Salida: `C:\Users\Admin\Desktop\ranking-millonarios-30s.mp4`

## Qué es

Pieza de **motion graphics** en el estilo de la referencia (el vídeo de
"Sígueme si te gustan los carros"): presentador de stock a la derecha, **escalera
de puestos con orbes dorados** a la izquierda, ficha de marca en grande, frase
por marca, veredicto y cierre. Todo el texto y los logos son **variables de
render-time**: se cambian sin tocar el HTML.

## Estructura (30,0 s @ 30 fps = 900 fotogramas)

| t (s) | Qué pasa |
|---|---|
| 0,00 | Entra el presentador (empuje corto) + cabecera "TOP 5 · MILLONARIOS" |
| 0,70 | Titular: "LOS 5 COCHOS" / "DE LOS MILLONARIOS" (entrada por stagger) |
| 2,30 | Entra la escalera con los 5 puestos vacíos (números en orbes dorados) |
| 4,00 | **Puesto 5 · PORSCHE** (ficha + frase + el orbe se enciende) |
| 8,00 | **Puesto 4 · BMW** |
| 12,00 | **Puesto 3 · MERCEDES-BENZ** |
| 16,00 | **Puesto 2 · HONDA** |
| 20,00 | **Puesto 1 · TOYOTA** |
| 23,50 | El presentador se va (fundido lento) |
| 24,00 | **Veredicto**: "Nº 1" + ficha Toyota + banda con el coche + frase |
| 27,00 | **CTA**: "SÍGUEME SI TE GUSTAN LOS CARROS" + tabla final de 5 marcas + @handle |
| 28,10 | Chip del handle + fuente + barrido de luz |

La rejilla de marcas va a **4 s** (el pulso de la música es de 1 s, así que
cada corte cae en un golpe).

## Assets usados (todos commiteados)

| Fichero | Para qué |
|---|---|
| `assets/clips/talker-slow.mp4` | Presentador (el original `talker.mp4` al 0,83×: 20 s → 24 s, para que llegue hasta el final) |
| `assets/audio/music-30s.mp3` | Música: `music-source.mp3` recortado a 30 s con fundidos |
| `assets/logos/*.png` | Logos (van sobre placa blanca: es su habitat natural) |
| `assets/coches/*.jpg` | Fotos de coche para la tabla final y la banda del veredicto |

## Cómo cambiar el copy o las marcas

Todo en `data-composition-variables` (array JSON en `<html>`):

- `kicker`, `hookL1`, `hookL2`, `hookSub` — el arranque.
- `n5Name` … `n1Name` y `n5Line` … `n1Line` — nombre y frase de cada marca.
- `verdictKicker`, `verdictLine` — el veredicto.
- `ctaKicker`, `ctaL1`…`ctaL3`, `handle`, `source` — el cierre.
- `porscheSrc`, `bmwSrc`, `mercedesSrc`, `hondaSrc`, `toyotaSrc` — logos.
- `porschePhoto` … `toyotaPhoto` — fotos.
- `musicSrc`, `presenterSrc` — música y presentador.

Los textos de una línea se inyectan con `data-var-text`; los logos y fotos con
`data-var-src`.

## Notas técnicas

- Sin `transition` CSS, sin `requestAnimationFrame`/`setTimeout`: la timeline
  GSAP va registrada en `window.__timelines["ranking-millonarios"]` y se
  construye **síncrona**.
- `gsap.ticker.fps(30)` = `data-fps`.
- Los orbes y el glow son **gradientes radiales**, nunca `filter: blur()`
  (el desenfoque decorativo es lo más caro por fotograma).
- Las fotos de coche van en `grayscale()` + un tinte dorado con
  `mix-blend-mode: screen`.
- Los bordes de banda y de ficha llevan degradados en vez de desenfoque real.
