// PREFLIGHT: la barrera que impide gastar un render en la nube por un error
// tonto. Se ejecuta ANTES de cada dispatch y si falla, no se renderiza.
//
// Comprueba:
//  1. las reglas del repo (demo2/audit-rules.mjs)
//  2. el lint real de HyperFrames (CSS/JS/render-time), ignorando solo los
//     assets que monta el propio runner
//  3. que TODOS los elementos que anima la timeline existen en el HTML
//     (esto habria pillado los nombres de marca que un parche borro)
//  4. que no queda basura UTF-8 (los caracteres de control rompen el parser CSS)
//  5. que la composicion se puede parsear (contadores de div balanceados)
//
//   node demo2/preflight.mjs [composicion.html ...]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(raiz);
const compositions = process.argv.slice(2);
if (!compositions.length) {
  const dir = 'compositions';
  compositions = fs.readdirSync(dir).filter(f => f.endsWith('.html'))
    .map(f => path.join(dir, f));
}

let fallos = 0;
const error = (m) => { fallos++; console.log('  FALLO: ' + m); };

// ── 1) reglas del repo ───────────────────────────────────────────────
console.log('1) reglas del repo...');
const a = spawnSync(process.execPath, ['demo2/audit-rules.mjs', ...compositions], { encoding: 'utf8' });
const lineas = (a.stdout || '').split('\n').filter(l => /problema|OK:/.test(l));
const problemas = (a.stdout || '').match(/(\d+) problema\(s\)/);
if (a.status !== 0) {
  console.log((a.stdout || '').split('\n').filter(l => l.includes('[!]')).join('\n'));
  error('el auditor de reglas finds problemas');
}

// ── 2) lint real de HyperFrames ───────────────────────────────────────
console.log('2) lint de HyperFrames...');
let lint = null;
try {
  const r = spawnSync('npx', ['--yes', 'hyperframes@0.8.162', 'lint', '.', '--json'],
    { encoding: 'utf8', maxBuffer: 1 << 26, shell: true });
  const out = String(r.stdout || '');
  const i = out.indexOf('{');
  if (i >= 0) lint = JSON.parse(out.slice(i));
  else console.log('   (el lint no devolvio salida legible)');
} catch (e) { lint = null; }
if (!lint) {
  error('el lint no devolvio JSON (no se puede validar)');
} else {
  const permitidos = ['assets/nuevo/procesado/', 'assets/nuevo/inmo/procesado/',
    'assets/mezcla/plato-', 'assets/mezcla/voz.m4a', 'assets/mezcla/presentador-', 'assets/mezcla/orbes.mp4'];
  const reales = (lint.findings || []).filter(f => {
    if (f.severity !== 'error') return false;
    const m = `${f.message || ''} ${f.file || ''}`;
    return !permitidos.some(p => m.includes(p));
  });
  for (const f of reales) error(`[${f.code}] ${(f.message || '').slice(0, 160)}`);
  console.log(`   (avisos: ${lint.warningCount || 0}, errores tolerados: ${(lint.findings || []).filter(f => f.severity === 'error').length - reales.length})`);
}

// ── 3-5) cada composicion ────────────────────────────────────────────
for (const comp of compositions) {
  console.log(`3-5) ${comp}`);
  const html = fs.readFileSync(comp, 'utf8');
  const css = (html.match(/<style>([\s\S]*?)<\/style>/) || [, ''])[1];
  const js = (html.match(/<script>([\s\S]*?)<\/script>/g) || []).join('\n');

  // 4) basura UTF-8 (caracteres de control C1 o U+FFFD)
  const raros = html.match(/[\u0080-\u009F\uFFFD]/g) || [];
  if (raros.length) error(`${raros.length} caracteres UTF-8 rotos (rompen el parser CSS). Repara antes.`);

  // 3) los ids que anima la timeline tienen que existir
  const ids = new Set();
  for (const m of js.matchAll(/tl\.(?:to|fromTo|set)\(\s*['"]#([A-Za-z][\w-]*)['"](?!\s*\+)/g)) ids.add(m[1]);
  for (const m of js.matchAll(/document\.getElementById\(\s*['"]([A-Za-z][\w-]*)['"]\s*\)/g)) ids.add(m[1]);
  const faltan = [...ids].filter(id => !new RegExp(`id=["']${id}["']`).test(html));
  if (faltan.length) error(`la timeline anima elementos que NO existen en el HTML: ${faltan.join(', ')}`);

  // las clases que anima la timeline tambien
  const clases = new Set();
  for (const m of js.matchAll(/tl\.(?:to|fromTo|set)\(['"]\.([\w-]+)/g)) clases.add(m[1]);
  for (const c of clases) {
    if (!new RegExp(`class=["'][^"']*\\b${c}\\b`).test(html) && !css.includes('.' + c)) {
      error(`la timeline anima la clase .${c} y no existe`);
    }
  }

  // 5) divs balanceados
  const abiertos = (html.match(/<div\b/g) || []).length;
  const cerrados = (html.match(/<\/div>/g) || []).length;
  if (abiertos !== cerrados) error(`divs desbalanceados: ${abiertos} abiertos / ${cerrados} cerrados`);

  // el timeline tiene que estar registrado
  const compId = (html.match(/data-composition-id="([^"]+)"/) || [])[1];
  if (!compId) error('falta data-composition-id');
  else if (!js.includes(`__timelines["${compId}"]`)) error(`el timeline no se registra como window.__timelines["${compId}"]`);
  else if (js.includes('document.fonts.ready') || /setTimeout|setInterval|requestAnimationFrame/.test(js)) {
    error('el build no puede ser asincrono (fonts.ready / setTimeout / rAF)');
  }
  if (/transition\s*:\s*(all|none|[0-9])/.test(css)) error('CSS transition prohibida en las composiciones');
}

console.log(fallos === 0 ? '\nPREFLIGHT OK: se puede renderizar.' : `\nPREFLIGHT FALLIDO: ${fallos} problema(s). NO se renderiza.`);
process.exit(fallos ? 1 : 0);
