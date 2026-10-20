/* Lista (sin descargar) los clips de las paginas de categoria donde hay
   gente hablando a camara, para elegir a la persona antes de bajar peso.
   Uso:  node demo2/list-person.mjs
*/
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const H = { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,*/*;q=0.8', 'Accept-Language': 'en-US,en;q=0.9' };

const pages = [
  'https://mixkit.co/free-stock-video/talking-to-camera/',
  'https://mixkit.co/free-stock-video/presenting/',
  'https://mixkit.co/free-stock-video/business-woman/',
  'https://mixkit.co/free-stock-video/woman-talking/',
  'https://mixkit.co/free-stock-video/portrait-of-a-woman/',
];

const seen = new Map();
for (const p of pages) {
  try {
    const html = await (await fetch(p, { headers: H })).text();
    for (const m of html.matchAll(/href="\/free-stock-video\/([a-z0-9-]+)-(\d+)\/[^"]*"[^>]*>\s*(?:<[^>]+>\s*)*([^<]{6,90})/gi)) {
      if (!seen.has(m[2])) seen.set(m[2], { id: m[2], slug: m[1], title: m[3].trim() });
    }
  } catch (e) { console.log(`- ${p}: ${e.message}`); }
}
console.log(`items: ${seen.size}\n`);
for (const c of seen.values()) console.log(`${c.id}\t${c.title}`);
