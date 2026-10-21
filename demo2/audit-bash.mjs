// Comprueba la SINTAXIS de todos los scripts de bash de los workflows y de las
// acciones compuestas, sin ejecutarlos. Caza el error tipico que tumba un
// render entero (un `done` de mas, una comilla sin cerrar, un `if` sin `fi`).
//
//   node demo2/audit-bash.mjs
//
// Usa el js-yaml que hay en la cache de npx y el bash de Git (si existe).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ficheros = [
  '.github/workflows/render-mix.yml',
  '.github/workflows/render.yml',
  '.github/workflows/validate.yml',
  '.github/actions/remotion-tools/action.yml',
  '.github/actions/hf-skills/action.yml',
];

// js-yaml: esta en la cache de npx (no hay node_modules en el repo)
function jsYaml() {
  const base = path.join(process.env.LOCALAPPDATA || '', 'npm-cache', '_npx');
  if (!fs.existsSync(base)) return null;
  for (const d of fs.readdirSync(base)) {
    const p = path.join(base, d, 'node_modules', 'js-yaml');
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// bash de Git para Windows
function bash() {
  const cands = [
    'C:\\Program Files\\Git\\bin\\bash.exe',
    'C:\\Program Files\\Git\\usr\\bin\\bash.exe',
    'C:\\Windows\\System32\\bash.exe',
  ];
  for (const c of cands) if (fs.existsSync(c)) return c;
  return null;
}

const yamlPath = jsYaml();
const bashPath = bash();
if (!yamlPath) { console.log('no encuentro js-yaml (cache de npx): me salto la comprobacion'); process.exit(0); }
if (!bashPath) { console.log('no encuentro bash: me salto la comprobacion'); process.exit(0); }

const { createRequire } = await import('node:module');
const require = createRequire(import.meta.url);
const yaml = require(yamlPath);

let total = 0, fallos = 0;
for (const f of ficheros) {
  const p = path.join(raiz, f);
  if (!fs.existsSync(p)) continue;
  const doc = yaml.load(fs.readFileSync(p, 'utf8'));
  const bloques = [];
  (function walk(o) {
    if (!o || typeof o !== 'object') return;
    for (const k of Object.keys(o)) {
      const v = o[k];
      if (k === 'run' && typeof v === 'string') bloques.push(v);
      else walk(v);
    }
  })(doc);
  bloques.forEach((s, i) => {
    const tmp = path.join(os.tmpdir(), `hf-audit-${process.pid}-${total}.sh`);
    fs.writeFileSync(tmp, s.replace(/\r/g, ''));
    const r = spawnSync(bashPath, ['-n', tmp], { encoding: 'utf8' });
    fs.unlinkSync(tmp);
    total++;
    if (r.status !== 0) {
      fallos++;
      console.log(`\nSYNTAX ERROR en ${f} (bloque ${i}):\n${r.stderr}`);
    }
  });
  console.log(`${f}: ${bloques.length} bloques`);
}
console.log(fallos === 0
  ? `OK: ${total} scripts bash sin errores de sintaxis`
  : `${fallos} scripts con errores de sintaxis`);
process.exit(fallos === 0 ? 0 : 1);
