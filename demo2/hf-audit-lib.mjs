/* Utilidades compartidas por audit-rules.mjs y fix-willchange.mjs
   (resolucion de selectores GSAP -> elementos reales del HTML). */

export const PROPS = {
  opacity: 'opacity', x: 'transform', y: 'transform', xPercent: 'transform',
  yPercent: 'transform', scale: 'transform',
  scaleX: 'transform', scaleY: 'transform', rotation: 'transform',
  width: 'width', height: 'height', visibility: 'visibility',
};

export const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const hit = (selector, token) =>
  new RegExp(`(^|[\\s>+~,])(${esc(token)})(?![A-Za-z0-9_-])`).test(selector);

const VOID = /^(img|br|hr|meta|link|input|source|path|circle|rect|line|polygon|polyline|ellipse|use|stop)$/;

/* Mini-parser HTML: id, clases y cadena de ancestros con id. */
export function parseHtml(html) {
  const els = [];
  const stack = [];
  const tagRe = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>])*?)(\/?)>/g;
  let m;
  while ((m = tagRe.exec(html))) {
    const [, closing, tag, attrs, selfClose] = m;
    const id = (attrs.match(/\bid="([^"]+)"/) || [])[1];
    const cls = ((attrs.match(/\bclass="([^"]+)"/) || [])[1] || '').trim().split(/\s+/).filter(Boolean);
    if (closing) {
      while (stack.length && stack[stack.length - 1].tag !== tag.toLowerCase()) stack.pop();
      stack.pop();
      continue;
    }
    const el = { tag: tag.toLowerCase(), id, cls, ancestors: stack.slice() };
    els.push(el);
    if (!selfClose && !VOID.test(el.tag)) stack.push(el);
  }
  return els;
}

/* Cadena descendiente "#a .b .c" -> elementos que la cumplen. */
export function matchChain(els, sel) {
  const parts = sel.trim().split(/\s+/);
  const last = parts.pop();
  const toks = [...last.matchAll(/([#.][A-Za-z0-9_-]+)/g)].map(x => x[1]);
  const idTok = toks.find(t => t.startsWith('#'));
  const clsToks = toks.filter(t => t.startsWith('.'));
  return els.filter(el => {
    if (idTok && el.id !== idTok.slice(1)) return false;
    if (!clsToks.every(c => el.cls.includes(c.slice(1)))) return false;
    if (!parts.length) return true;
    return parts.every(p => {
      const pt = [...p.matchAll(/([#.][A-Za-z0-9_-]+)/g)].map(x => x[1]);
      const pid = pt.find(t => t.startsWith('#'));
      const pcls = pt.filter(t => t.startsWith('.'));
      return el.ancestors.some(anc => {
        if (pid && anc.id !== pid.slice(1)) return false;
        return pcls.every(c => anc.cls.includes(c.slice(1)));
      });
    });
  });
}

/* Selectores que anima GSAP y las propiedades que mutan. */
export function animatedTargets(inlineJs) {
  const map = new Map();
  const KEYS = Object.keys(PROPS);
  for (const m of inlineJs.matchAll(/\.(?:fromTo|to|set)\(\s*['"`]([^'"`]+)['"`]\s*,\s*\{([^}]*)\}/g)) {
    const sel = m[1].trim();
    /* el objeto de props va partido por comas de nivel superior */
    const parts = [];
    let depth = 0, cur = '';
    for (const ch of m[2]) {
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if (ch === ',' && depth === 0) { parts.push(cur); cur = ''; } else cur += ch;
    }
    if (cur.trim()) parts.push(cur);
    const props = [];
    for (const p of parts) {
      const key = p.trim().split(':')[0].trim();
      if (KEYS.includes(key)) props.push(PROPS[key]);
    }
    if (!props.length) continue;
    if (!map.has(sel)) map.set(sel, new Set());
    props.forEach(p => map.get(sel).add(p));
  }
  return map;
}
