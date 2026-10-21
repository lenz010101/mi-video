# Inmobiliaria para México — 30 s vertical (9:16) · desde cero

Motor visual propio (el de una inmobiliaria: **luz, aire y marfil**), con la
misma herramienta en la nube que HUMO: 30 fps, rejilla de compás, material
descargado y gradeado en el runner, verificación automática y entrega en el
Escritorio.

Composición: **`compositions/inmobiliaria-mx-30s.html`** (a crear)
Render en la nube: `node demo2/ciclo.mjs compositions/inmobiliaria-mx-30s.html inmobiliaria-mx-30s.mp4`
Salida: `C:\Users\Admin\Desktop\inmobiliaria-mx-30s.mp4`

## Qué es

Reel de venta de un **desarrollo habitacional** (no un tour de casa): el
argumento completo en 30 s — la promesa, el proceso, la prueba, la ficha, la
ubicación y la visita. Todo el texto, los precios, los datos y el logo son
**variables de render-time**: se cambia de desarrollo sin tocar el HTML.

**Todo el material es nuevo**: se descarga y se gradea en la nube
(`demo2/preparar-nuevo.mjs`), nada reciclado del repo.

## El motor: "LUZ" (propio de esta pieza)

| | |
|---|---|
| Formato | 1080×1920 (9:16), **30 fps**, 30,0 s = 900 fotogramas |
| Rejilla | **120 BPM → compás de 2,0 s = 60 fotogramas exactos** (los cortes caen en frame redondo). La música se recorta en la nube con `demo2/bpm.mjs` para que el primer golpe caiga en el frame 0 |
| Paleta | marfil `#F4F1E9` · tinta `#14120E` · acento **terracota** `#A8643C` (un solo acento) · salvia `#3E5A4C` solo en el mapa |
| Tipografía | **Instrument Serif** (display, lujo editorial) + **Montserrat** 300/400/600 (texto) + **JetBrains Mono** (datos y rótulos) |
| Ambiente | luz: velo cálido en vez de halo oscuro, grano fino, mucho aire (márgenes de 96 px) |
| Capas | fotos/vídeo a sangre + una **tarjeta tinta** con el precio (el único elemento oscuro: ahí va el ojo) |
| Transiciones | **dip a blanco** (no flash a negro), disolvencias con empuje lento, barrido de luz cálido |
| Datos | contadores animados, ficha en columnas, plano SVG que se dibuja línea a línea |
| Ubicación | **MapLibre + OpenFreeMap** (sin API key) con vuelo de cámara y pin |
| Audio | música del repo cortada al compás + whooshes/impactos del pack de Mixkit sobre los golpes |

## Estructura (15 compases de 2,0 s)

| t (s) | compás | Qué pasa | Material | Técnica |
|---|---|---|---|---|
| 0,0 | 0 | **GANCHO**: `DESDE $2.9 MDP` (a sangre) + `DESARROLLO HABITACIONAL EN COLONIA ROMA NORTE` | clip nuevo: edificio moderno al atardecer | dip a blanco desde negro + tipografía display que entra con máscara |
| 2,0 | 1 | **PROMESA**: `ENTREGA INMEDIATA` + `2 Y 3 RECÁMARAS` | clip nuevo: interior luminoso | empuje lento + rótulo mono que se dibuja |
| 4,0 | 2 | **PROCESO 1**: `01 OBRA` | clip nuevo: obra | corte + rótulo + barra de progreso |
| 6,0 | 3 | **PROCESO 2**: `02 ACABADOS` | clip nuevo: acabados | corte + rótulo |
| 8,0 | 4 | **PROCESO 3**: `03 ENTREGA` | clip nuevo: entrega/llaves | corte + rótulo |
| 10,0 | 5 | **LA CASA**: 3 cortes a sangre (cocina / salón / terraza) con empuje lento | clips nuevos de interior | cortes al compás + escala + polvo |
| 14,0 | 7 | **FICHA**: `99 M²` · `3 RECÁMARAS` · `2 BAÑOS` · `1 ESTACIONAMIENTO` + amenidades + el plano que se dibuja | SVG original de la planta | contadores + trazado línea a línea |
| 18,0 | 9 | **UBICACIÓN**: vuelo de mapa (MapLibre + OpenFreeMap) con el pin cayendo + `A 8 MIN DE POLANCO` | mapa en vivo | cámara + pin + rótulo |
| 22,0 | 11 | **LA OFERTA**: presentador a cámara + `VISITAS CON CITA` + teléfono | clip nuevo: presentador | panel + zoom lento + serif |
| 24,0 | 12 | **PRECIO**: tarjeta tinta con `DESDE $2.9 MDP` + `$11,500 MXN/MES` | — | tarjeta que entra + contadores |
| 26,0 | 13 | **CIERRE**: marca + `+52 55 1234 5678` + `arcodev.mx` + `ESQUIRE EN SITIO` | logo (variable) | marca con halo + barrido de luz |
| 28,0 | 14 | **COLGADA**: `¿QUIERES TU ESPACIO?` sobre el plano | plano SVG | fundido a marfil |

## Copy (variables de render-time, registro mexicano)

| id | valor por defecto | para qué |
|---|---|---|
| `marca` | ARCO DESARROLLOS | nombre de la inmobiliaria |
| `desarrollo` | DESARROLLO HABITACIONAL | línea del gancho |
| `zona` | COLONIA ROMA NORTE, CDMX | ubicación |
| `precio` | DESDE $2.9 MDP | precio de venta (MDP = millones de pesos) |
| `precioM2` | $29,300 MXN/M² | precio por metro |
| `mensual` | $11,500 MXN/MES | crédito |
| `m2` | 99 M² | ficha |
| `recamaras` | 3 RECÁMARAS | ficha |
| `banos` | 2 BAÑOS | ficha |
| `estacionamiento` | 1 ESTACIONAMIENTO | ficha |
| `amenidades` | ROOFTOP · GIM · COWORKING · PET FRIENDLY | amenidades del desarrollo |
| `minutos` | A 8 MIN DE POLANCO | acceso |
| `visita` | VISITAS CON CITA | CTA |
| `telefono` | +52 55 1234 5678 | contacto (formato MX) |
| `web` | ARCODEV.MX | contacto |
| `esquire` | ESQUIRE EN SITIO | oferta (voz muy mexicana) |
| `logo` | (imagen) | logo de cierre |
| `musica` | (pista) | música |

## Material nuevo a descargar (nube)

Mixkit (libre, sin clave) + montaje en la nube con `demo2/preparar-nuevo.mjs`
(recorte 9:16, grado: curva fílmica clara, split-tone suave, halation, viñeta,
grano fino; **sin** oscurecer: esta pieza es clara).

| bloque | búsqueda | encuadre |
|---|---|---|
| exterior | "modern apartment building", "contemporary architecture dusk" | 1 clip |
| interiores | "bright modern living room", "modern kitchen apartment", "terrace city view" | 3 clips |
| obra | "building construction site", "apartment interior finishing" | 2 clips |
| entrega | "handing over keys", "new apartment keys" | 1 clip |
| presentador | "real estate agent presenting", "woman talking to camera" | 1 clip vertical |
| amenidades | "rooftop terrace", "gym", "coworking space" | 2-3 clips |
| música | pista de Mixkit (bossa/tropical/cinematic) a ~120 BPM | 1 pista |

El **plano de la planta se dibuja en SVG** (original, no se descarga) y su
trazado se anima línea a línea.

## Por qué esta estructura

1. **El gancho es un dato**: `$2.9 MDP` + "entrega inmediata", en 2 s. Es lo
   que el usuario mexicano filtra primero.
2. **La promesa antes que la evidencia**: precio, recámaras, entrega — y
   después el proceso.
3. **El proceso ocupa 3 compases (6 s)**: es lo que hace thinly
   ("es nuevo, no de segunda") en un mercado de desarrollo.
4. **Una sola tarjeta oscura** (el precio) sobre marfil: el ojo va allí.
5. **Cierre con acción y datos de contacto en formato local** (+52 55…, MDP,
   "esquire en sitio"), no con un "contáctanos" genérico.
