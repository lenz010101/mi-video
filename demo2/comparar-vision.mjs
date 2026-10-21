// Compara dos videos con la vision de Google (Gemini): extrae los mismos
// fotogramas de los dos y le pide a la IA las diferencias concretas de la
// EDICION (capas, posiciones, tiempos, tipografia, ritmo).
//
//   node demo2/comparar-vision.mjs <videoA> <videoB> <apiKey> <salida.md> [segundos]
//
// Los fotogramas se envian inline (base64) al endpoint generateContent.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const [a, b, key, salida] = process.argv.slice(2);
if (!a || !b || !key) {
  console.log('uso: node demo2/comparar-vision.mjs <A.mp4> <B.mp4> <APIKEY> <salida.md> [seg]');
  process.exit(1);
}
const tiempos = (process.argv[6] || '0,6,12,18,24,28').split(',').map(Number);

const ff = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: ['ignore', 'pipe', 'pipe'] });

// 1) fotogramas de cada video (720 de ancho: suficiente y ligero)
function frames(video) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cmp-'));
  const out = [];
  for (const t of tiempos) {
    const f = path.join(dir, `f${t}.jpg`);
    try {
      ff(['-ss', String(t), '-i', video, '-frames:v', '1', '-vf', 'scale=720:-1', '-q:v', '4', f]);
      if (fs.existsSync(f)) out.push({ t, data: fs.readFileSync(f).toString('base64') });
    } catch (e) { /* frame que no existe */ }
  }
  return out;
}

const fa = frames(a);
const fb = frames(b);
console.log(`fotogramas: A=${fa.length} B=${fb.length}`);

const partes = [];
for (const f of fa) partes.push({ inline_data: { mime_type: 'image/jpeg', data: f.data } });
for (const f of fb) partes.push({ inline_data: { mime_type: 'image/jpeg', data: f.data } });

const pregunta = `Tienes dos videos de 30 segundos, 9:16, el mismo estilo. Las primeras ${fa.length} imagenes son del VIDEO A (el original de referencia) en los segundos ${tiempos.join(', ')}. Las siguientes ${fa.length} imagenes son del VIDEO B (mi version) en los mismos segundos.

Compara la EDICION de los dos y dame una lista CONCRETA y ACCIONABLE de las diferencias, separando:
1) CAPAS Y POSICIONES (donde esta cada elemento en el cuadro: barra, logos, nombres de marca, palabras, pie de foto, CTA), con las coordenadas en % de la altura.
2) ORDEN Y TIEMPOS (cuando entra y sale cada cosa: nombres de marca, palabras, destellos, cambios de plano).
3) TIPOGRAFIA (familia, tamano relativo, color, contorno/sombra, efecto).
4) COLOR Y LUZ (niveles, temperatura, contraste, viñeta).
5) MOVIMIENTO (como entran y salen los elementos: entradas, salidas, inercia, loops).

No comentes el contenido ni los actores: solo el montaje. Se especifico y numerado, como una lista de cambios que pueda aplicar a un editor de video.`;

const cuerpo = {
  contents: [{ role: 'user', parts: [{ text: pregunta }, ...partes] }],
  generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
};

const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const res = await fetch(url + '?key=' + encodeURIComponent(key), {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(cuerpo),
});
const json = await res.json();
let texto = '';
if (json.candidates && json.candidates[0] && json.candidates[0].content) {
  texto = json.candidates[0].content.parts.map(p => p.text || '').join('\n');
} else {
  texto = 'ERROR de la API: ' + JSON.stringify(json).slice(0, 600);
}
console.log(texto.slice(0, 400) + (texto.length > 400 ? '...' : ''));
if (salida) { fs.writeFileSync(salida, texto, 'utf8'); console.log('escrito en ' + salida); }
