/* Prepara el material NUEVO del reel en la nube (nunca en el PC del usuario).
   Lee assets/nuevo/fuentes.json, descarga los clips, las fugas de luz, la
   musica y los efectos de Mixkit, y deja el material con un GRADO DE
   COLORISTA sobre el material en bruto:
     - recorte 9:16 con encuadre propio por plano
     - fuga de luz compuesta en modo screen (el artefacto de lente real)
     - curva filmica (S) + split tone (sombras frias / luces calidas)
     - halation: las altas luces sangran hacia el rojo y el ambar
     - vineta, grano de pelicula y micro-contraste
     - H.264 Constrained Baseline 3.1 (Chrome headless solo decodifica eso)
   Idempotente: si el fichero ya esta, no lo vuelve a hacer.

   Uso:  node demo2/preparar-nuevo.mjs [manifiesto]
*/
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const MAN = process.argv[2] || 'assets/nuevo/fuentes.json';
const man = JSON.parse(fs.readFileSync(path.join(ROOT, MAN), 'utf8'));
const OUT = path.join(ROOT, man.salida || 'assets/nuevo/procesado');
fs.mkdirSync(OUT, { recursive: true });

const P = man.perfil || {};
const FPS = man.fps || 24;
const W = P.ancho || 1080, H = P.alto || 1920;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const H2 = { 'User-Agent': UA, Referer: 'https://mixkit.co/' };

const ff = (args) => {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: ['ignore', 'ignore', 'pipe'] });
  if (r.status !== 0) {
    const err = (r.stderr || '').toString();
    /* ffmpeg pone el motivo al principio: se muestran los dos extremos. */
    throw new Error('ffmpeg: ' + err.slice(0, 420).replace(/\s+/g, ' ') + (err.length > 420 ? ' ... ' + err.slice(-260).replace(/\s+/g, ' ') : ''));
  }
};

async function baja(url, dest) {
  const r = await fetch(url, { headers: H2 });
  if (!r.ok) throw new Error('http ' + r.status);
  fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
}

const listo = (f) => fs.existsSync(f) && fs.statSync(f).size > 20000;
let fallos = 0;

/* â”€â”€ Clips: base + fuga de luz + grado â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
async function montar(c) {
  const out = path.join(OUT, `${c.nombre}.mp4`);
  if (listo(out)) { console.log(`  cache  ${c.nombre}.mp4`); return; }
  const g = man.grados[c.grado] || man.grados.neutro;
  const enc = c.encuadre || 'centro';
  const cx = enc === 'izquierda' ? '(iw-1080)/2*0.12' : enc === 'derecha' ? '(iw-1080)/2*0.88' : '(iw-1080)/2';
  /* Los filtros vacios del grado (p.ej. el polvo no lleva vineta) se omiten. */
  const grado = [g.curves, g.tono, g.eq].filter(Boolean).join(',');
  /* El grano NO se mete aqui: el ruido en el video dispara el bitrate
     (74 MB en 30 s) y la escena ya lleva su capa de grano en CSS, que es
     gratis. Con el video limpio el MP4 baja a un tercio y se descarga
     mucho antes. */
  const post = [g.vineta, g.grano].filter(Boolean).join(',');

  const base = path.join(OUT, `_b_${c.nombre}.mp4`);
  await baja(`https://assets.mixkit.co/videos/${c.base}/${c.base}-720.mp4`, base);

  const ov = c.overlay ? path.join(OUT, `_o_${c.nombre}.mp4`) : null;
  if (ov) {
    try { await baja(`https://assets.mixkit.co/videos/${c.overlay.id}/${c.overlay.id}-720.mp4`, ov); }
    catch (e) { console.log(`  [warning] overlay ${c.overlay.id}: ${e.message}`); }
  }

  /* base y overlay deben entrar al blend con el MISMO frame rate y timebase
     (si no, ffmpeg aborta con "Error binding filtergraph inputs/outputs"). */
  const norm = `fps=${FPS},settb=AVTB,format=yuv420p`;
  const trim = `[0:v]trim=start=${c.inicio || 0}:duration=${c.duracion},setpts=PTS-STARTPTS,scale=-2:${H}:flags=lanczos,crop=${W}:${H}:${cx}:0,setsar=1,${norm},unsharp=5:5:0.5:5:5:0.0[base]`;
  const chains = [trim];
  let last = 'base';

  if (ov && fs.existsSync(ov)) {
    chains.push(`[1:v]trim=start=${c.overlay.inicio || 0}:duration=${c.duracion},setpts=PTS-STARTPTS,scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1,${norm}[ov]`);
    chains.push(`[${last}][ov]blend=all_mode=screen:all_opacity=${c.overlay.opacidad}[b1]`);
    last = 'b1';
  }

  chains.push(`[${last}]${grado}[gr]`);
  /* Halation: las altas luces se difuminan y se vuelven a sumar en screen.
     Si el grado no lleva halation, la cadena se queda en un solo plano. */
  if (g.halation) {
    chains.push(`[gr]split=2[keep][hl]`);
    chains.push(`[hl]lutrgb=r='if(gt(val,205),val,0)':g='if(gt(val,210),val,0)':b='if(gt(val,215),val,0)',gblur=sigma=14[hlb]`);
    chains.push(`[keep][hlb]blend=all_mode=screen:all_opacity=${g.halation}${post ? ',' + post : ''},fps=${FPS}[out]`);
  } else {
    chains.push(`[gr]${post ? post + ',' : ''}fps=${FPS}[out]`);
  }

  /* Los ficheros de entrada van ANTES del grafo: [0:v] es la base y
     [1:v] la fuga de luz. Sin esto el grafo no tiene entradas ("Invalid
     file index 0") y no sale ningun plano. */
  const inputs = [];
  /* El polvo es una capa continua: el fuente es corto, se hace loop. */
  if (c.continuo) inputs.push('-stream_loop', '-1');
  inputs.push('-i', base);
  if (ov && fs.existsSync(ov)) inputs.push('-i', ov);

  ff([...inputs,
    '-filter_complex', chains.join(';'), '-map', '[out]',
    '-c:v', 'libx264', '-profile:v', P.perfil_h264 || 'baseline', '-level', P.nivel_h264 || '3.1',
    '-preset', P.preset || 'veryfast', '-crf', String(P.crf ?? 21),
    '-pix_fmt', P.pix_fmt || 'yuv420p', '-movflags', '+faststart', '-an', '-r', String(FPS), out]);

  fs.rmSync(base, { force: true });
  if (ov) fs.rmSync(ov, { force: true });
  console.log(`  listo  ${c.nombre}.mp4  ${(fs.statSync(out).size / 1048576).toFixed(1)}MB  ${c.duracion}s`);
}

/* Si un plano falla, se borra el fichero roto: un MP4 a medias hace fallar el
   render entero con "moov atom not found". */
async function montarSeguro(c) {
  try {
    await montar(c);
  } catch (e) {
    fallos++;
    const out = path.join(OUT, `${c.nombre}.mp4`);
    if (fs.existsSync(out)) { fs.rmSync(out, { force: true }); console.log(`  [warning] ${c.nombre}: roto, se borra`); }
    console.log(`  [warning] ${c.nombre}: ${e.message}`);
  }
}

for (const c of man.clips || []) { if (!process.env.SOLO || c.nombre === process.env.SOLO) await montarSeguro(c); }
for (const c of man.capas || []) { if (!process.env.SOLO || c.nombre === process.env.SOLO) await montarSeguro(c); }

/* â”€â”€ Musica â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
for (const m of man.musica || []) {
  const out = path.join(OUT, m.archivo || `music-${m.id}.mp3`);
  if (listo(out)) { console.log(`  cache  ${m.archivo}`); continue; }
  try {
    const tmp = path.join(OUT, `_m_${m.id}.mp3`);
    await baja(`https://assets.mixkit.co/music/${m.id}/${m.id}.mp3`, tmp);
    const d = m.duracion || 30;
    ff(['-ss', String(m.inicio || 0), '-i', tmp, '-t', String(d),
      '-af', `afade=t=in:st=0:d=1.2,afade=t=out:st=${(d - 1.8).toFixed(2)}:d=1.8,volume=0.9`,
      '-c:a', 'libmp3lame', '-q:a', '2', '-ar', '44100', '-ac', '2', out]);
    fs.rmSync(tmp, { force: true });
    console.log(`  listo  ${m.archivo}  ${(fs.statSync(out).size / 1048576).toFixed(1)}MB`);
  } catch (e) { fallos++; console.log(`  [warning] musica ${m.id}: ${e.message}`); }
}

/* â”€â”€ Efectos de sonido (whooshes e impactos) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
for (const s of man.sfx || []) {
  const out = path.join(OUT, s.archivo || `sfx-${s.id}.mp3`);
  if (listo(out)) { console.log(`  cache  ${s.archivo}`); continue; }
  try {
    const tmp = path.join(OUT, `_s_${s.id}.mp3`);
    await baja(`https://assets.mixkit.co/active_storage/sfx/${s.id}/${s.id}-preview.mp3`, tmp);
    ff(['-i', tmp, '-af', `afade=t=in:st=0:d=0.02,afade=t=out:st=0.35:d=0.5,volume=${s.ganancia ?? 0.3}`,
      '-c:a', 'libmp3lame', '-q:a', '2', '-ar', '44100', '-ac', '2', out]);
    fs.rmSync(tmp, { force: true });
    console.log(`  listo  ${s.archivo}  ${(fs.statSync(out).size / 1024).toFixed(0)}KB`);
  } catch (e) { fallos++; console.log(`  [warning] sfx ${s.id}: ${e.message}`); }
}

/* Comprobacion final: si falta un solo plano, el CI para aqui. Es preferible
   fallar en 2 minutos que renderizar 3 minutos con material roto. */
const faltan = [];
for (const c of [...(man.clips || []), ...(man.capas || [])]) {
  const f = path.join(OUT, `${c.nombre}.mp4`);
  if (!fs.existsSync(f) || fs.statSync(f).size < 20000) faltan.push(c.nombre);
}
for (const m of man.musica || []) {
  const f = path.join(OUT, m.archivo);
  if (!fs.existsSync(f)) faltan.push(m.archivo);
}
for (const s of man.sfx || []) {
  const f = path.join(OUT, s.archivo);
  if (!fs.existsSync(f)) faltan.push(s.archivo);
}
if (faltan.length) {
  console.error(`\nFALTA MATERIAL: ${faltan.join(', ')}`);
  process.exit(1);
}

console.log(`\n${man.clips?.length || 0} clips + ${man.capas?.length || 0} capas + ${man.musica?.length || 0} pistas + ${man.sfx?.length || 0} sfx listos en ${man.salida} (${fallos} fallo(s))`);


