/* Integridad del CSS: compara el <style> actual con el original (899ac3a) y
   comprueba que lo unico que ha cambiado es la adicion de will-change. */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const BASE = '899ac3a';
const files = ['index.html', ...fs.readdirSync(path.join(ROOT, 'compositions'))
  .filter(f => f.endsWith('.html')).map(f => path.join('compositions', f))];

const styleOf = t => (t.match(/<style[^>]*>[\s\S]*?<\/style>/) || [''])[0];

function rules(css) {
  const out = [];
  const noComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of noComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const sel = m[1].trim().replace(/\s+/g, ' ');
    const decls = m[2].split(';').map(d => d.trim()).filter(Boolean)
      .filter(d => !/^will-change\s*:/i.test(d));
    out.push({ sel, decls });
  }
  return out;
}

let problems = 0;
for (const file of files) {
  const orig = execFileSync('git', ['show', `${BASE}:${file.replace(/\\/g, '/')}`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const o = rules(styleOf(orig));
  const c = rules(styleOf(fs.readFileSync(file, 'utf8')));

  /* cada regla original debe seguir existiendo con las mismas declaraciones */
  const cMap = new Map(c.map(r => [r.sel + '|' + r.decls.join(';'), r]));
  const oMap = new Map(o.map(r => [r.sel + '|' + r.decls.join(';'), r]));
  const lost = [...oMap.keys()].filter(k => !cMap.has(k));
  const added = [...cMap.keys()].filter(k => !oMap.has(k));

  const status = lost.length ? 'MAL' : 'OK ';
  if (lost.length) problems++;
  console.log(`${status} ${file.padEnd(34)} reglas originales: ${o.length}  actuales: ${c.length}  perdidas: ${lost.length}  nuevas: ${added.length}`);
  for (const k of lost) console.log(`      PERDIDA: ${k.slice(0, 110)}`);
  /* las nuevas deben ser solo will-change */
  for (const k of added) {
    const r = cMap.get(k);
    const onlyWillChange = r.decls.length === 0 || r.decls.every(d => /will-change/i.test(d));
    if (!onlyWillChange) { console.log(`      NUEVA CON CONTENIDO: ${k.slice(0, 110)}`); problems++; }
  }
}
console.log(`\n${problems} problema(s) de integridad.`);
