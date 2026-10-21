# Guía rápida: crear y editar vídeos sin perder horas

Todo el trabajo pesado ocurre **en la nube** (GitHub Actions). El PC solo
valida (2 s) y descarga el MP4 final.

---

## 1. El comando único (el ciclo entero)

```powershell
.\demo2\ciclo.ps1 -Composition compositions/ranking-ref-30s.html `
                    -Filename ranking-ref-30s.mp4 `
                    -Workflow render-mix.yml `
                    -Paths compositions/ranking-ref-30s.html
```

Hace las cuatro cosas, en este orden:

| paso | qué hace | coste |
|---|---|---|
| 1 | `node demo2/audit-rules.mjs` (reglas del repo) | 2 s |
| 2 | `npx hyperframes@0.8.162 lint . --json` (lint real) | 1 min |
| 3 | sube los ficheros por la API de GitHub (sin `git`) | 5 s |
| 4 | render en la nube + descarga del MP4 al Escritorio | 4-6 min |

**Si el auditor o el lint encuentran un error real, el ciclo se para** (no
gasta runner). Los errores "esperables" (material que se monta en la nube:
`assets/nuevo/**/procesado/*`, `assets/mezcla/plato-*`, `assets/mezcla/voz.m4a`)
se toleran solos.

Opciones: `-SinLint` (te ahorra el minuto del lint), `-SinQc` (no hace la
verificación del MP4 en la nube: −40 s).

---

## 2. Los comandos sueltos

| comando | para qué |
|---|---|
| `node demo2/audit-rules.mjs [fichero]` | reglas del repo (2 s, sin Chrome) |
| `npx --yes hyperframes@0.8.162 lint . --json` | lint de HyperFrames (1 min) |
| `.\demo2\commit-api.ps1 -Branch demo-premium -Message "..." -Paths a.html` | subir cambios sin `git` |
| `.\demo2\dispatch.ps1 -Workflow render-mix.yml -Composition ... -Filename ...` | render en la nube (espera) |
| `.\demo2\descargar.ps1 -RunId <id> -Filename x.mp4` | bajar el MP4 al Escritorio (solo el vídeo) |
| `node demo2/verify-render.mjs <mp4> <dir>` | fotogramas congelados + cortes |
| `node demo2/contact-sheet.mjs <mp4> <png>` | hoja de contactos para revisar |
| `node demo2/preparar-nuevo.mjs assets/nuevo/fuentes.json` | material nuevo (se ejecuta en la nube) |

---

## 3. Los tres workflows

| workflow | motor | para qué |
|---|---|---|
| `render.yml` | HyperFrames | piezas puras (HUMO, ARCO) |
| `render-mix.yml` | **Remotion + HyperFrames + ffmpeg** | piezas con gráficos generados (el ranking) |
| `validate.yml` | ninguno | valida el repo **sin renderizar** (~2 min) |

En `render-mix.yml` el orden es:

```
Remotion (columna de orbes)  →  ffmpeg (HORNEADO del comp)  →  HyperFrames (montaje final)
```

**El horneado** (paso 2) es lo que hace el render rápido: se compone *una vez*
por puesto el presentador enmarcado + la foto del coche + la capa de orbes
(en modo `screen`, como en After Effects) y la composición de HyperFrames solo
reproduce ese plano. El navegador deja de componer dos vídeos a pantalla
completa en cada uno de los 900 fotogramas → la captura va de ~0,22 s/frame a
~0,15-0,17 s/frame. El resultado visual es idéntico.

---

## 4. Tiempos medidos (no repetirlos)

| fase | tiempo |
|---|---|
| material nuevo (con caché) | 0 s |
| skills + librerías (con caché) | 15-30 s |
| Remotion (columna de orbes, 30 s) | ~49 s |
| horneado de los 5 planos | ~30 s |
| captura + encode (900 frames) | 150-210 s |
| QC (verificación) | 40 s |
| subir el artifact | 10-40 s |
| bajar el MP4 (~35 MB) | 1-2 min (tu conexión) |

**Suelo físico:** el runner `ubuntu-latest` son 4 vCPU sin GPU (0,15-0,23 s por
fotograma medidos). Los runners de 8/16 vCPU **se cobran** aunque el repo sea
público. A 24 fps serían ~3,2 min, pero el entregable va a 30 fps.

---

## 5. Reglas para no perder tiempo

1. **No tocar `assets/nuevo/fuentes.json` ni `assets/nuevo/inmo/fuentes.json`**
   si solo cambian el copy o los colores: la clave de caché es el hash del
   manifiesto → tocarlo vuelve a graduar los clips (+4 min). El copy va en
   **variables de render-time** (`data-composition-variables`).
2. **Validar en local antes de subir**: el auditor (2 s) + el lint (1 min)
   cazan el 95 % de los bugs. Un render fallido cuesta 4-6 min.
3. **El copy y los colores son variables**, no HTML: `data-var-text`,
   `data-var-src` y custom properties CSS.
4. **No renderizar en local** (ni `hf render`, ni `hf snapshot`): son 11 min y
   el resultado no aporta nada. Para revisar, fotogramas del MP4 descargado.
5. **Piezas en paralelo**: cada dispatch es un runner distinto y en un repo
   público son gratis → 2 vídeos = el tiempo de 1.
6. **No descargar el MP4 salvo que lo pidas** (pesa; la conexión es el cuello
   de botella).
7. **1 worker** en el render: con 4 workers se pierde el "streaming encode"
   (+55 s). El workflow ya usa `--workers 1 --low-memory-mode`.
8. **Nada de `transition:` en CSS, ni `requestAnimationFrame`/`setTimeout`** en
   el JS de la composición: el render no puede calcular el tiempo por frame.
