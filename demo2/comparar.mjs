/* Comparativa lado a lado: el original y la replica, en los mismos instantes.
   Uso:  node demo2/comparar.mjs [t1 t2 t3 ...] */
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const REF = 'C:/Users/Admin/Downloads/¿Toyota, Honda, BMW, Mercedes… cuál compraría yo 👀No existe una marca perfecta. Todo depende de.mp4';
const MIO = 'C:/Users/Admin/Desktop/coches-20s.mp4';
const TIMES = process.argv.slice(2).map(Number).filter(n => !isNaN(n));
const TS = TIMES.length ? TIMES : [0.5, 3, 6, 9, 12, 16];
const OUT = 'demo2/qc9';
fs.mkdirSync(OUT, { recursive: true });

const inputs = [];   // rutas, en orden: ref0, mio0, ref1, mio1...
for (const t of TS) {
  const a = `${OUT}/cmp_ref_${t}.png`;
  const b = `${OUT}/cmp_mio_${t}.png`;
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-ss', String(t), '-i', REF, '-frames:v', '1', '-vf', 'scale=300:533', a]);
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-ss', String(t), '-i', MIO, '-frames:v', '1', '-vf', 'scale=300:533', b]);
  inputs.push(a, b);
}

const args = ['-y', '-v', 'error'];
for (const p of inputs) args.push('-i', p);
const chains = [];
for (let i = 0; i < TS.length; i++) {
  chains.push(`[${i * 2}][${i * 2 + 1}]vstack=inputs=2[p${i}]`);
}
const cols = Math.min(3, TS.length);
const rows = Math.ceil(TS.length / cols);
const layout = [];
for (let i = 0; i < TS.length; i++) layout.push(`${(i % cols) * 300}_${Math.floor(i / cols) * 1066}`);
const filter = `${chains.join(';')};${TS.map((_, i) => `[p${i}]`).join('')}xstack=inputs=${TS.length}:layout=${layout.join('|')}`;
args.push('-filter_complex', filter, '-frames:v', '1', `${OUT}/comparativa.png`);
execFileSync('ffmpeg', args);
console.log('comparativa: ' + OUT + '/comparativa.png  (' + TS.map(t => t + 's').join(', ') + ')');
