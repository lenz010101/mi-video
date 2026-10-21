// Lint de HyperFrames para la nube: tolera los assets que se montan en el
// propio runner (platos horneados, voz, presentador graduado, material nuevo)
// y FALLA ante cualquier otro error. Sin esto, render.yml se caia porque la
// composicion del ranking pide unos planos que solo genera render-mix.yml.
//
//   node demo2/lint-ci.mjs
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const PERMITIDOS = [
  'assets/nuevo/procesado/',
  'assets/nuevo/inmo/procesado/',
  'assets/mezcla/plato-',
  'assets/mezcla/voz.m4a',
  'assets/mezcla/presentador-',
  'assets/mezcla/orbes.mp4',
];

let salida = '';
try {
  salida = execSync('hf lint . --json', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
} catch (e) {
  salida = String(e.stdout || '') + String(e.stderr || '');
}

let o = null;
try {
  const i = salida.indexOf('{');
  o = JSON.parse(salida.slice(i));
} catch (e) {
  console.log('::warning::no se pudo leer el JSON del lint');
  console.log(salida.slice(-800));
  process.exit(1);
}

const errores = (o.findings || []).filter(f => f.severity === 'error');
const fatales = errores.filter(f => {
  const m = `${f.message || ''} ${f.file || ''}`;
  return !PERMITIDOS.some(p => m.includes(p));
});

console.log(`lint: ${errores.length} error(es) tolerados, ${o.warningCount || 0} aviso(s), ${fatales.length} real(es)`);
for (const f of fatales) console.log(`  FATAL [${f.code}] ${f.message} (${f.file || ''})`);
if (fatales.length === 0) console.log('lint OK (los errores tolerados son assets que se montan en la nube)');
process.exit(fatales.length ? 1 : 0);
