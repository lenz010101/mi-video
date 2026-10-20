/* Auditor de reglas HyperFrames (determinismo + parametrizacion).
   Comprueba, sin arrancar Chrome:
     1. Prohibido: propiedad `transition` en CSS.
     2. Prohibido: requestAnimationFrame / setTimeout / setInterval en el JS de la composicion.
     3. Obligatorio: todo elemento animado por GSAP tiene `will-change` con la propiedad que muta.
     4. Obligatorio: cada contenedor de escena con tiempos lleva `data-duration` explicito.
     5. Obligatorio: cada `data-var-*` apunta a una variable declarada en `data-composition-variables`.
     6. Prohibido: imágenes/vídeos embebidos en base64 (data: URI).
   Uso:  node demo2/audit-rules.mjs [archivo.html ...]
*/
import fs from 'node:fs';
import path from 'node:path';
import { PROPS, esc, hit, parseHtml, matchChain, animatedTargets } from './hf-audit-lib.mjs';

const ROOT = process.cwd();
const args = process.argv.slice(2);
const files = args.length
  ? args
  : ['index.html', ...fs.readdirSync(path.join(ROOT, 'compositions'))
      .filter(f => f.endsWith('.html'))
      .map(f => path.join('compositions', f))];

function audit(file) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const problems = [];
  const notes = [];
  const htmlOnlyAll = src.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

  /* ── 1. transition ── */
  const cssBlocks = [...src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]);
  const css = cssBlocks.join('\n').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of css.matchAll(/(^|[;{\s])transition\s*:/g)) {
    const line = css.slice(0, m.index).split('\n').length;
    problems.push(`CSS  transition: prohibido (linea CSS ~${line})`);
  }

  /* ── 2. rAF / setTimeout / setInterval en scripts inline ── */
  const inlineJsRaw = [...src.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]).join('\n');
  /* sin comentarios: las palabras prohibidas solo cuentan en codigo real */
  const inlineJs = inlineJsRaw
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  for (const kw of ['requestAnimationFrame', 'setTimeout', 'setInterval']) {
    if (inlineJs.includes(kw)) problems.push(`JS   ${kw}: prohibido en el JS de la composicion`);
  }

  /* ── 3. will-change en los elementos animados por GSAP ── */
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m => ({
    sel: m[1].trim().replace(/\s+/g, ' '),
    body: m[2],
  }));
  const els = parseHtml(htmlOnlyAll);
  const animated = animatedTargets(inlineJs);
  for (const [sel, props] of animated) {
    const need = [...props].map(p => PROPS[p] || p).sort();
    const matched = matchChain(els, sel);
    const ids = matched.map(e => e.id).filter(Boolean);
    const clsOfMatched = [...new Set(matched.flatMap(e => e.cls))];
    const own = [...ids.map(i => '#' + i), ...clsOfMatched.map(c => '.' + c)];
    /* elementos sin id ni clase (p.ej. <i> dentro de .mask): se busca por su
       clase de contenedor + etiqueta, p.ej. ".mask i" */
    const ctx = [];
    for (const e of matched) {
      if (e.id || e.cls.length) continue;
      const parent = e.ancestors[e.ancestors.length - 1];
      if (parent && parent.cls.length) ctx.push('.' + parent.cls[0] + ' ' + e.tag);
    }
    const have = [];
    for (const r of rules) {
      const sels = r.sel.split(',').map(s => s.trim());
      const applies = sels.some(s => own.some(t => hit(s, t))) ||
        sels.some(s => s.replace(/\s+/g, ' ') === sel.replace(/\s+/g, ' ')) ||
        sels.some(s => ctx.some(c => s === c || s.endsWith(' ' + c)));
      if (!applies) continue;
      const m = r.body.match(/will-change\s*:\s*([^;]+)/);
      if (m) have.push(...m[1].split(/[\s,]+/).map(x => x.trim()));
    }
    const haveU = [...new Set(have)];
    const missing = need.filter(p => !haveU.includes(p));
    if (!haveU.length) {
      problems.push(`CSS   will-change ausente en "${sel}" (muta: ${need.join(', ')})`);
    } else if (missing.length) {
      problems.push(`CSS   will-change incompleto en "${sel}": "${haveU.join(', ')}" (falta ${missing.join(', ')})`);
    }
  }

  /* ── 4. contenedores de escena con data-start/data-duration ── */
  for (const m of src.matchAll(/<(div|section|img|video)\b[^>]*\bdata-start\s*=[^>]*>/gi)) {
    const tag = m[0];
    if (!/data-duration\s*=/.test(tag)) {
      problems.push(`HTML  contenedor con data-start pero sin data-duration: ${tag.slice(0, 110)}`);
    }
  }

  /* ── 5. bindings de variables (solo HTML, no el JS inline) ── */
  const htmlOnly = htmlOnlyAll;
  const declMatch = src.match(/data-composition-variables\s*=\s*'([\s\S]*?)'/i) || src.match(/data-composition-variables\s*=\s*"([\s\S]*?)"/i);
  let declared = new Set();
  if (declMatch) {
    try {
      const parsed = JSON.parse(declMatch[1]);
      if (!Array.isArray(parsed)) {
        problems.push('VAR  data-composition-variables debe ser un ARRAY JSON de declaraciones');
      } else {
        parsed.forEach(d => declared.add(d.id));
      }
    } catch (e) {
      problems.push(`VAR  data-composition-variables no es JSON valido: ${e.message}`);
    }
  } else {
    notes.push('VAR  no declara data-composition-variables (sin parametrizacion en render-time)');
  }
  for (const m of htmlOnly.matchAll(/\bdata-var-(text|src)\s*=\s*"([^"]+)"/gi)) {
    if (!declared.has(m[2])) problems.push(`VAR  data-var-${m[1]}="${m[2]}" no declarado en data-composition-variables`);
  }
  for (const m of htmlOnly.matchAll(/\bdata-(variable|variable-src|variable-style-background)\s*=/gi)) {
    problems.push(`VAR  atributo obsoleto ${m[0]} (no existe en HyperFrames 0.8.x; usa data-var-text / data-var-src)`);
  }

  /* ── 6. base64 embebido ── */
  for (const m of src.matchAll(/data:[a-z/+-]+;base64,[A-Za-z0-9+/=]{200,}/gi)) {
    problems.push('HTML  recurso embebido en base64 (prohibido): ' + m[0].slice(0, 40) + '...');
  }

  return { file, problems, notes };
}

let bad = 0;
for (const f of files) {
  const { problems, notes } = audit(f);
  const head = `\n── ${f} ──`;
  console.log(head);
  notes.forEach(n => console.log('  ' + n));
  if (!problems.length) console.log('  OK: cumple las reglas');
  problems.forEach(p => { console.log('  [!] ' + p); bad++; });
}
console.log(`\n${bad} problema(s) en ${files.length} archivo(s).`);
