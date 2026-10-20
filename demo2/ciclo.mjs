/* CICLO COMPLETO en un comando (para quien no programa):
     1) render en la nube (GitHub Actions) de la composicion indicada
     2) descarga del artifact -> MP4 en el Escritorio
     3) verificacion: fotogramas congelados + cambios de plano
     4) hoja de contactos con timecodes -> Escritorio
   Uso:  node demo2/ciclo.mjs [composicion] [nombre.mp4] [calidad] */
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const REPO = 'lenz010101/mi-video';
const BRANCH = 'demo-premium';
const COMPOSITION = process.argv[2] || 'compositions/veluxe-promo.html';
const FILENAME = process.argv[3] || 'veluxe-promo.mp4';
const QUALITY = process.argv[4] || 'standard';
const DESKTOP = 'C:/Users/Admin/Desktop';

const cred = execFileSync('git', ['credential', 'fill'], { input: 'protocol=https\r\nhost=github.com\r\n' }).toString();
const token = cred.split('\n').find(l => l.startsWith('password=')).slice(9).trim();
const $H = { 'User-Agent': 'opencode-ciclo', Authorization: `token ${token}`, Accept: 'application/vnd.github+json' };

async function gh(url, opts = {}) {
  const res = await fetch(url.includes('http') ? url : `https://api.github.com${url}`, { ...opts, headers: { ...$H, ...(opts.headers || {}) } });
  if (!res.ok && res.status !== 404) throw new Error(`${res.status} ${await res.text()}`);
  return res;
}

console.log(`1) dispatch: ${COMPOSITION} (${QUALITY})`);
await gh(`/repos/${REPO}/actions/workflows/render.yml/dispatches`, {
  method: 'POST',
  body: JSON.stringify({ ref: BRANCH, inputs: { quality: QUALITY, fps: '30', filename: FILENAME, format: 'mp4', workers: '1', frames: 'no', composition: COMPOSITION } }),
});

let run = null;
for (let i = 0; i < 15; i++) {
  await new Promise(r => setTimeout(r, 6000));
  const list = await (await gh(`/repos/${REPO}/actions/runs?per_page=3`)).json();
  run = list.workflow_runs.find(r => r.head_branch === BRANCH && r.status !== 'completed' && r.name.includes('Render'));
  if (run) break;
}
if (!run) throw new Error('no se creo el run');
console.log(`   run ${run.id} en marcha`);

const t0 = Date.now();
while (run.status !== 'completed') {
  await new Promise(r => setTimeout(r, 15000));
  const r = await (await gh(`/repos/${REPO}/actions/runs/${run.id}`)).json();
  run = { ...run, status: r.status, conclusion: r.conclusion };
  process.stdout.write(`   ${((Date.now() - t0) / 1000).toFixed(0)}s - ${run.status}\n`);
  if (run.conclusion === 'failure') {
    console.error('   RUN FALLIDO (revisa los logs del job en GitHub)');
    process.exit(1);
  }
}
console.log(`2) run ${run.conclusion} en ${((Date.now() - t0) / 1000).toFixed(0)} s`);

const arts = await (await gh(`/repos/${REPO}/actions/runs/${run.id}/artifacts`)).json();
const want = arts.artifacts.filter(a => /hyperframes/.test(a.name));
if (!want.length) throw new Error('sin artifacts');
/* Se descargan el MP4 y el informe de QC (la verificacion se hace en la nube,
   asi que el PC del usuario no ejecuta ffmpeg ni analisis). */
for (const art of want) {
  const buf = Buffer.from(await (await gh(art.archive_download_url)).arrayBuffer());
  const zipPath = path.join(DESKTOP, '_hf.zip');
  fs.writeFileSync(zipPath, buf);
  execFileSync('powershell', ['-Command', `Expand-Archive -Force -LiteralPath "${zipPath}" -DestinationPath "${DESKTOP}"`]);
  fs.rmSync(zipPath, { force: true });
  console.log(`   artifact ${art.name} (${(art.size_in_bytes / 1e6).toFixed(1)} MB) descargado`);
}
const mp4 = path.join(DESKTOP, FILENAME);
if (!fs.existsSync(mp4)) throw new Error('MP4 no encontrado tras expandir');
console.log(`3) MP4: ${mp4} (${(fs.statSync(mp4).size / 1e6).toFixed(1)} MB)`);

/* En el Escritorio solo queda lo que sirve: el MP4 y las hojas.
   Los fotogramas clave (40 KB cada uno) van a una subcarpeta. */
function findAll(root, re, depth) {
  depth = depth || 0;
  if (depth > 4 || !fs.existsSync(root)) return [];
  const out = [];
  for (const e of fs.readdirSync(root, { withFileTypes: true })) {
    const p = path.join(root, e.name);
    if (e.isDirectory()) out.push(...findAll(p, re, depth + 1));
    else if (re.test(e.name)) out.push(p);
  }
  return out;
}
const sheets = findAll(DESKTOP, /^hoja-de-contactos.*\.png$/i);
const frames = findAll(DESKTOP, /^f_[\d.]+\.(jpg|png)$/i);
const strip = findAll(DESKTOP, /^filmstrip\.png$/i);
/* Todo lo que no sea el MP4 va a Desktop/qc: el Escritorio queda limpio. */
const qcDir = path.join(DESKTOP, 'qc');
fs.mkdirSync(qcDir, { recursive: true });
for (const s of [...sheets, ...strip]) {
  fs.copyFileSync(s, path.join(qcDir, path.basename(s)));
  console.log('   qc/' + path.basename(s));
}
if (frames.length) {
  const dst = path.join(qcDir, 'frames');
  fs.mkdirSync(dst, { recursive: true });
  for (const f of frames) {
    if (path.resolve(f) === path.resolve(path.join(dst, path.basename(f)))) continue;
    fs.copyFileSync(f, path.join(dst, path.basename(f)));
  }
  console.log('   qc/frames: ' + frames.length + ' fotogramas clave');
}
/* se borra la carpeta intermedia que deja la descompresion del artifact */
fs.rmSync(path.join(DESKTOP, 'renders'), { recursive: true, force: true });
console.log('\nLISTO. Todo el trabajo pesado se ha hecho en la nube.');
