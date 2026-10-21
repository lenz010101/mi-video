/* Auditor de COSTE POR FOTOGRAMA.
   No comprueba reglas: mide cuanto le va a costar a HyperFrames renderizar
   cada composicion. El reparto medido en este repo (AGENTS.md) es:
     captura de pantalla base 38% · los 11 videos 20% · los graficos 42%
   O sea: lo que mas cuesta NO es el video, son los efectos de grafico.
   Este script marca los patrones caros para quitarlos antes de renderizar.

   Uso:  node demo2/audit-perf.mjs [archivo.html ...]
   Devuelve 0 siempre (es informativo). Con --strict devuelve 1 si hay
   avisos de coste alto, para usarlo como puerta en el CI.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const args = process.argv.slice(2);
const STRICT = args.includes('--strict');
const targets = args.filter(a => a !== '--strict');

const rel = abs => (path.relative(ROOT, abs) || abs).replace(/\\/g, '/');

function collect(list) {
  const out = [];
  for (const t of list) {
    const abs = path.resolve(ROOT, t);
    if (!fs.existsSync(abs)) { console.log(`  (no existe: ${t})`); continue; }
    if (fs.statSync(abs).isDirectory()) {
      for (const f of fs.readdirSync(abs)) if (f.endsWith('.html')) out.push(rel(path.join(abs, f)));
    } else out.push(rel(abs));
  }
  return out;
}

const files = targets.length
  ? collect(targets)
  : ['index.html', ...collect(['compositions'])];

/* Cada patron: como se detecta, cuanto cuesta y que hacer en su lugar. */
const PATTERNS = [
  {
    id: 'filter-blur',
    re: /filter\s*:\s*[^;]*blur\(/gi,
    cost: 3,
    msg: 'filter: blur() cuesta 3x por fotograma (rasteriza y difumina en CPU)',
    fix: 'usa un gradiente radial (la suavidad la da el gradiente) o text-shadow multicapa',
  },
  {
    id: 'backdrop-filter',
    re: /backdrop-filter\s*:\s*[^;]*;/gi,
    cost: 2,
    msg: 'backdrop-filter: difumina lo que hay detras en cada fotograma',
    fix: 'dejalo solo si hay contenido en movimiento detras; si el fondo es plano, quita el filtro',
  },
  {
    id: 'drop-shadow',
    re: /filter\s*:\s*[^;]*drop-shadow\(/gi,
    cost: 2,
    msg: 'filter: drop-shadow() difumina la silueta en cada fotograma',
    fix: 'sombra de texto/multicapa o una capa con opacidad',
  },
  {
    id: 'blend-mode',
    re: /mix-blend-mode\s*:\s*[^;]+;/gi,
    cost: 2,
    msg: 'mix-blend-mode fuerza composicion extra en cada fotograma',
    fix: 'premultiplica el color en el propio elemento',
  },
  {
    id: 'shadow-big',
    re: /box-shadow\s*:\s*[^;]*?(\d{3,})px[^;]*;/gi,
    cost: 1,
    msg: 'box-shadow con radio grande: difumina una superficie grande cada fotograma',
    fix: 'reduce el radio o usa un halo radial detras',
  },
  {
    id: 'svg-blur',
    re: /<feGaussianBlur[^>]*>/gi,
    cost: 3,
    msg: 'feGaussianBlur en SVG: filtro de rasterizado por fotograma',
    fix: 'usa un degradado o una sombra en lugar del filtro',
  },
  {
    id: 'bg-fixed',
    re: /background-attachment\s*:\s*fixed/gi,
    cost: 1,
    msg: 'background-attachment: fixed obliga a recomponer el fondo cada vez',
    fix: 'fija el fondo con position absolute en su propio contenedor',
  },
];

function analyze(file) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const css = (src.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [])
    .map(b => b.replace(/<\/?style[^>]*>/gi, '')).join('\n');
  const svg = (src.match(/<svg[\s\S]*?<\/svg>/gi) || []).join('\n');
  const inline = (src.match(/<[^>]+style\s*=\s*"([^"]*)"/gi) || []).join('\n');
  const all = `${css}\n${inline}`;

  const hits = [];
  for (const p of PATTERNS) {
    const re = new RegExp(p.re.source, p.re.flags);
    const m = all.match(re);
    if (!m) continue;
    hits.push({ ...p, n: m.length });
  }
  const svgBlur = svg.match(/<feGaussianBlur[^>]*>/gi);
  if (svgBlur) hits.push({ ...PATTERNS.find(p => p.id === 'svg-blur'), n: svgBlur.length });

  const videos = (src.match(/<video\b/gi) || []).length;
  const audios = (src.match(/<audio\b/gi) || []).length;
  const anim = (src.match(/\.(?:to|from|toFrom|fromTo|set)\s*\(/g) || []).length;
  const cssAnim = (css.match(/animation\s*:/gi) || []).length;
  const willChange = (all.match(/will-change\s*:/gi) || []).length;

  /* Coste estimado por fotograma (0-100). Calibrado con el reparto medido:
     los graficos pesan mas que los videos. will-change NO se puntua: es
     obligatorio por regla y no cuesta por fotograma. */
  let cost = 0;
  for (const h of hits) cost += h.n * h.cost;
  cost += videos * 2;      /* cada video se decodifica en cada fotograma */
  cost += anim * 0.15;    /* cada tween es trabajo de layout/composite */
  cost += cssAnim * 1.5;  /* las animaciones CSS rasterizan cada frame */
  cost += audios * 0.5;
  const score = Math.min(100, Math.round(cost));

  return { file, hits, videos, audios, anim, cssAnim, willChange, score };
}

const LEVEL = s => (s >= 40 ? 'ALTO ' : s >= 20 ? 'MEDIO' : 'BAJO ');

const results = files.map(analyze);
results.sort((a, b) => b.score - a.score);

console.log('COSTE ESTIMADO POR FOTOGRAMA (mas caro primero)');
console.log('='.repeat(78));
for (const r of results) {
  console.log(`\n${LEVEL(r.score)} ${String(r.score).padStart(3)}  ${r.file}`);
  console.log(`      ${r.videos} video(s) · ${r.audios} audio(s) · ${r.anim} tween(s) GSAP · ${r.cssAnim} animacion(es) CSS · ${r.willChange} will-change (informativo)`);
  for (const h of r.hits) {
    console.log(`      x${String(h.n).padStart(2)}  ${h.msg}`);
    console.log(`            -> ${h.fix}`);
  }
}
const worst = results[0];
console.log(`\n${'='.repeat(78)}`);
console.log(`Mas caro: ${worst ? worst.file : '-'} (${worst ? worst.score : 0}).`);
console.log('Los graficos pesan mas que los videos: antes de renderizar, quita los');
console.log('patrones marcados arriba; el render va ~2x mas rapido.');

if (STRICT && results.some(r => r.score >= 40)) process.exit(1);
