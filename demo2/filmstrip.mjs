// Filmstrip: la edicion completa de un video en una sola imagen (un flipbook).
// Es la forma que tengo de "ver" un montage: una fotograma cada X segundos en
// una tira, que se lee como una secuencia. Sirve para revisar el ritmo, los
// cortes y si algo se sale de sitio.
//
//   node demo2/filmstrip.mjs <video.mp4> [salida.png] [cadaCuantosSeg] [columnas]
//   node demo2/filmstrip.mjs v.mp4 out.png 0.5 12
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const entrada = process.argv[2];
if (!entrada) { console.log('uso: node demo2/filmstrip.mjs <video.mp4> [salida.png] [cada] [cols]'); process.exit(1); }
if (!fs.existsSync(entrada)) { console.log('no existe: ' + entrada); process.exit(1); }

const salida = path.resolve(process.argv[3] || 'filmstrip.png');
const cada = parseFloat(process.argv[4] || '0.5');
const cols = parseInt(process.argv[5] || '10', 10);

const ff = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: ['ignore', 'pipe', 'pipe'] });

// duracion
const probe = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration',
  '-of', 'default=nw=1:nk=1', entrada], { encoding: 'utf8' });
const dur = parseFloat(probe.trim());
const total = Math.max(1, Math.round(dur / cada));
const filas = Math.ceil(total / cols);
console.log(`${dur.toFixed(1)} s -> ${total} fotogramas (uno cada ${cada} s) en ${cols}x${filas}`);

// el ancho de cada celda: que quepa en 1600 px
const anchoCelda = Math.floor(1600 / cols);
const altoCelda = Math.round(anchoCelda * 16 / 9);

ff(['-i', entrada, '-vf',
  `fps=1/${cada},scale=${anchoCelda}:${altoCelda},tile=${cols}x${filas}:margin=6:padding=4:color=0x1a1a1a`,
  '-frames:v', '1', salida]);

console.log('filmstrip -> ' + salida + '  (' + Math.round(fs.statSync(salida).size / 1024) + ' KB)');
console.log('leela de izquierda a derecha y de arriba abajo: es el montage entero.');
