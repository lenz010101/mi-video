/* Lista el texto visible y los recursos de media de una composicion
   (para decidir que parametrizar). */
import fs from 'node:fs';

for (const file of process.argv.slice(2)) {
  const src = fs.readFileSync(file, 'utf8');
  const body = src.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<script[\s\S]*?<\/script>/gi, '');
  console.log(`\n══ ${file}`);
  const media = [...body.matchAll(/<(img|video|audio|source)\b[^>]*>/gi)];
  media.forEach(m => {
    const s = (m[0].match(/\bsrc="([^"]*)"/) || [])[1];
    const id = (m[0].match(/\bid="([^"]*)"/) || [])[1];
    console.log(`  [media] <${m[1]}> id=${id || '-'} src=${s || '-'}`);
  });
  const texts = [...body.matchAll(/>([^<>{}]{2,120})</g)]
    .map(m => m[1].trim())
    .filter(t => t && !/^[\d\s.,%()·:\/\-–—]+$/.test(t));
  console.log('  [texto] ' + JSON.stringify([...new Set(texts)], null, 0));
}
