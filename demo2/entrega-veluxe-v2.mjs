/* Entrega del video "abogada 80 s":
   1) dispatch del workflow render.yml con inputs del render standard (workers=1)
   2) espera del run (poll cada 20 s, imprime estado)
   3) descarga del artifact y copia del MP4 al Escritorio
   Uso:  node demo2/entrega.mjs
*/
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const REPO = 'lenz010101/mi-video';
const BRANCH = 'demo-premium';
const FILENAME = 'veluxe.mp4';
const DESKTOP = 'C:/Users/Admin/Desktop';

const cred = execFileSync('git', ['credential', 'fill'], {
  input: 'protocol=https\r\nhost=github.com\r\n',
}).toString();
const token = cred.split('\n').find(l => l.startsWith('password=')).slice(9).trim();
const $H = { 'User-Agent': 'opencode-deliver', Authorization: `token ${token}`, Accept: 'application/vnd.github+json' };

async function gh(url, opts = {}) {
  const res = await fetch(url.includes('http') ? url : `https://api.github.com${url}`, {
    ...opts, headers: { ...$H, ...(opts.headers || {}) },
  });
  if (!res.ok && res.status !== 404) throw new Error(`${res.status} ${await res.text()}`);
  return res;
}

console.log('1) dispatch del workflow…');
await gh(`/repos/${REPO}/actions/workflows/render.yml/dispatches`, {
  method: 'POST',
  body: JSON.stringify({
    ref: BRANCH,
    inputs: {
      quality: 'standard', fps: '30', filename: 'veluxe2.mp4', format: 'mp4',
      workers: '1', frames: 'no', composition: 'compositions/veluxe-v2.html',
    },
  }),
});
console.log('   enviado ✓');

let run = null;
for (let i = 0; i < 10; i++) {
  await new Promise(r => setTimeout(r, 6000));
  const list = await (await gh(`/repos/${REPO}/actions/runs?per_page=3`)).json();
  run = list.workflow_runs.find(r => r.head_branch === BRANCH && r.status !== 'completed');
  if (run) break;
}
if (!run) throw new Error('no se creó el run');
console.log(`   run ${run.id} en marcha (${run.created_at})`);

const t0 = Date.now();
while (run.status !== 'completed') {
  await new Promise(r => setTimeout(r, 20000));
  const r = await (await gh(`/repos/${REPO}/actions/runs/${run.id}`)).json();
  run = { ...run, status: r.status, conclusion: r.conclusion, jobs: r.id };
  console.log(`   ${(new Date(Date.now() - t0) / 1000).toFixed(0)}s · ${run.status}`);
  if (run.conclusion === 'failure') throw new Error('run FAILED — revisar logs');
}
console.log(`2) run terminado: ${run.conclusion} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);

const arts = await (await gh(`/repos/${REPO}/actions/runs/${run.id}/artifacts`)).json();
const art = arts.artifacts.find(a => a.name.includes('veluxe2')) || arts.artifacts[0];
if (!art) throw new Error('sin artifacts');
console.log(`3) artifact: ${art.name} (${(art.size_in_bytes / 1e6).toFixed(1)} MB)`);

const zipPath = path.join(DESKTOP, `${art.name}.zip`);
const buf = Buffer.from(await (await gh(art.archive_download_url)).arrayBuffer());
fs.writeFileSync(zipPath, buf);

/* descomprimir (PowerShell nativo) en el Escritorio */
execFileSync('powershell', ['-Command',
  `Expand-Archive -Force -LiteralPath "${zipPath}" -DestinationPath "${DESKTOP}"`]);
const mp4 = path.join(DESKTOP, FILENAME);
if (!fs.existsSync(mp4)) throw new Error('MP4 no encontrado tras expandir');
fs.rmSync(zipPath, { force: true });
const dur = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]).toString().trim();
console.log(`4) ENTREGADO: ${mp4} (${(fs.statSync(mp4).size / 1e6).toFixed(1)} MB, ${dur} s)`);

