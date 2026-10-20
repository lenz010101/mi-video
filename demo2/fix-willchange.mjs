/* Añade `will-change` SOLO a los elementos concretos animados por GSAP.
   Para cada selector de GSAP resuelve los elementos reales del HTML y crea
   una regla por id (`#id { will-change: ... }`), de modo que no se tocan
   clases compartidas con elementos que no se animan.
   Los cambios son quirurgicos: solo se reescribe la regla afectada y se
   respeta el resto del CSS (comentarios y formato intactos).
   Uso:  node demo2/fix-willchange.mjs           (vista previa)
         node demo2/fix-willchange.mjs --write   (aplica)
*/
import fs from 'node:fs';
import path from 'node:path';
import { hit, parseHtml, matchChain, animatedTargets } from './hf-audit-lib.mjs';

const ROOT = process.cwd();
const write = process.argv.includes('--write');
const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const files = args.length
  ? args
  : ['index.html', ...fs.readdirSync(path.join(ROOT, 'compositions'))
      .filter(f => f.endsWith('.html'))
      .map(f => path.join('compositions', f))];

let total = 0;
for (const file of files) {
  const full = path.join(ROOT, file);
  let src = fs.readFileSync(full, 'utf8');
  const htmlOnlyAll = src.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  const inlineJs = [...src.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]).join('\n');
  const els = parseHtml(htmlOnlyAll);
  const animated = animatedTargets(inlineJs);

  /* bloques <style> con sus reglas y posiciones exactas en el CSS original */
  const blocks = [];
  for (const sb of src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
    const css = sb[1];
    const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m => ({
      sel: m[1].trim().replace(/\s+/g, ' '),
      body: m[2],
      start: m.index,
      end: m.index + m[0].length,
      open: m[0].indexOf('{'),
    }));
    blocks.push({ raw: sb[0], css, rules, edits: [], adds: [] });
  }
  if (!blocks.length) { console.log(`  ?? ${file}: sin <style>`); continue; }

  const log = [];
  for (const [sel, props] of animated) {
    const need = [...props].sort();
    const matched = matchChain(els, sel);
    const ids = matched.map(e => e.id).filter(Boolean);
    const clsOfMatched = [...new Set(matched.flatMap(e => e.cls))];
    const key = ids.length ? ids.map(i => '#' + i).join(', ') : sel;
    const own = [...ids.map(i => '#' + i), ...clsOfMatched.map(c => '.' + c)];

    /* reglas que aplican al elemento */
    const cands = [];
    for (const b of blocks) {
      for (const r of b.rules) {
        const sels = r.sel.split(',').map(s => s.trim());
        const applies = sels.some(s => own.some(t => hit(s, t)) || s.replace(/\s+/g, ' ') === sel.replace(/\s+/g, ' '));
        if (applies) cands.push({ b, r });
      }
    }
    if (!cands.length) {
      /* no hay regla que aplique: se crea una nueva con el selector del elemento */
      blocks[blocks.length - 1].adds.push(`      ${key} { will-change: ${need.join(', ')}; }`);
      log.push(`  + ${file}: ${key} -> will-change: ${need.join(', ')} (regla nueva)`);
      total++;
      continue;
    }

    const haveOf = c => {
      const m = c.r.body.match(/will-change\s*:\s*([^;]+)/);
      return m ? m[1].split(/[\s,]+/).map(s => s.trim()).filter(Boolean) : [];
    };
    if (cands.some(c => need.every(p => haveOf(c).includes(p)))) continue;

    const target = cands.find(c => c.r.sel.includes('#')) || cands[0];
    const have = haveOf(target);
    if (have.length) {
      const merged = [...new Set([...have, ...need.filter(p => !have.includes(p))])].join(', ');
      const r = target.r;
      const newBody = r.body.replace(/will-change\s*:\s*[^;]+/, `will-change: ${merged}`);
      target.b.edits.push({ start: r.start, end: r.end, old: r.body, new: newBody });
      log.push(`  ~ ${file}: ${target.r.sel} -> will-change: ${merged}`);
    } else {
      target.b.adds.push(`      ${key} { will-change: ${need.join(', ')}; }`);
      log.push(`  + ${file}: ${key} -> will-change: ${need.join(', ')}`);
    }
    total++;
  }

  if (!log.length) continue;

  /* aplica los cambios: primero las ediciones puntuales, luego las reglas nuevas */
  let out = src;
  for (const b of blocks) {
    let css = b.css;
    /* ediciones (de derecha a izquierda) */
    for (const e of [...b.edits].sort((x, y) => y.start - x.start)) {
      const chunk = css.slice(e.start, e.end);
      /* guarda: el trozo debe contener el cuerpo esperado. Si el parseo se
         descoloca (llaves dentro de cadenas o comentarios) no se toca nada. */
      if (!chunk.includes(e.old)) {
        console.log(`  ?? ${file}: edicion descartada (offsets no cuadran) en "${e.old.slice(0, 40)}"`);
        continue;
      }
      const newChunk = chunk.replace(e.old, e.new);
      css = css.slice(0, e.start) + newChunk + css.slice(e.end);
    }
    if (b.adds.length) {
      css = css.replace(/\s*$/, '\n\n      /* will-change: elementos animados por GSAP */\n' + b.adds.join('\n') + '\n    ');
    }
    out = out.replace(b.raw, b.raw.replace(b.css, () => css));
  }
  if (write) fs.writeFileSync(full, out, 'utf8');
  log.forEach(l => console.log(l));
  console.log(`  ${file}: ${log.length} accion(es)${write ? ' aplicadas' : ' (vista previa)'}`);
}
console.log(`\n${total} elemento(s) con will-change${write ? ' aplicado(s)' : ' (falta --write)'}.`);
