/* Genera los assets del promo VELUXE con los nombres exactos pedidos:
     assets/flyer.png · entrance.jpg · people.png · char1..char4.png
     assets/crowd.jpg · logo.png
   Rasterizado propio (sin SVG ni CSS): encoder PNG minimo + primitivas.
   SonMaterial de relleno: se sustituyen 1:1 por el material real.
*/
import zlib from "node:zlib";
import fs from "node:fs";

/* ───────────── encoder PNG ───────────── */
const CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return (buf) => {
    let c = -1;
    for (let i = 0; i < buf.length; i++) c = t[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return (c ^ -1) >>> 0;
  };
})();

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(CRC(td));
  return Buffer.concat([len, td, crc]);
}

function writePNG(path, w, h, buf) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    Buffer.from(buf.buffer, y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  fs.writeFileSync(path, Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]));
  console.log("  " + path + "  " + w + "x" + h);
}

/* ───────────── primitivas ───────────── */
const hex = (s) => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

function Canvas(w, h, bg) {
  const buf = new Uint8ClampedArray(w * h * 4);
  if (bg) {
    const c = hex(bg);
    for (let i = 0; i < w * h; i++) { buf[i * 4] = c[0]; buf[i * 4 + 1] = c[1]; buf[i * 4 + 2] = c[2]; buf[i * 4 + 3] = 255; }
  }
  const put = (x, y, col, a) => {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = (y * w + x) * 4;
    const al = a === undefined ? 1 : a;
    if (al >= 1) { buf[i] = col[0]; buf[i + 1] = col[1]; buf[i + 2] = col[2]; buf[i + 3] = 255; return; }
    if (al <= 0) return;
    buf[i] = buf[i] * (1 - al) + col[0] * al;
    buf[i + 1] = buf[i + 1] * (1 - al) + col[1] * al;
    buf[i + 2] = buf[i + 2] * (1 - al) + col[2] * al;
    buf[i + 3] = Math.max(buf[i + 3], 255 * al);
  };
  const api = {
    w, h, buf,
    px: put,
    rect(x, y, ww, hh, col, a) { for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) put(x + i, y + j, col, a); },
    ellipse(cx, cy, rx, ry, col, a) {
      const x0 = Math.max(0, Math.floor(cx - rx)), x1 = Math.min(w - 1, Math.ceil(cx + rx));
      const y0 = Math.max(0, Math.floor(cy - ry)), y1 = Math.min(h - 1, Math.ceil(cy + ry));
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const dx = (x - cx) / rx, dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1) put(x, y, col, a);
      }
    },
    ring(cx, cy, r, thick, col, a) {
      const x0 = Math.max(0, Math.floor(cx - r - thick)), x1 = Math.min(w - 1, Math.ceil(cx + r + thick));
      const y0 = Math.max(0, Math.floor(cy - r - thick)), y1 = Math.min(h - 1, Math.ceil(cy + r + thick));
      const ro = r + thick / 2, ri = r - thick / 2;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const d = Math.hypot(x - cx, y - cy);
        if (d <= ro && d >= ri) put(x, y, col, a);
      }
    },
    poly(pts, col, a) {
      let minY = 1e9, maxY = -1e9;
      for (const p of pts) { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); }
      for (let y = Math.max(0, Math.floor(minY)); y <= Math.min(h - 1, Math.ceil(maxY)); y++) {
        const xs = [];
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const y1 = pts[i][1], y2 = pts[j][1];
          if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) {
            xs.push(pts[i][0] + ((y - y1) / (y2 - y1)) * (pts[j][0] - pts[i][0]));
          }
        }
        xs.sort((p, q) => p - q);
        for (let k = 0; k + 1 < xs.length; k += 2) {
          for (let x = Math.max(0, Math.ceil(xs[k])); x <= Math.min(w - 1, Math.floor(xs[k + 1])); x++) put(x, y, col, a);
        }
      }
    },
    curve(p0, p1, p2, col, thick, a, steps = 90) {
      for (let s = 0; s <= steps; s++) {
        const t = s / steps, it = 1 - t;
        const x = it * it * p0[0] + 2 * it * t * p1[0] + t * t * p2[0];
        const y = it * it * p0[1] + 2 * it * t * p1[1] + t * t * p2[1];
        api.ellipse(x, y, thick, thick, col, a);
      }
    },
    vgrad(y0, y1, cTop, cBot) {
      const A = hex(cTop), B = hex(cBot);
      for (let y = y0; y < y1; y++) {
        const c = mix(A, B, (y - y0) / (y1 - y0));
        for (let x = 0; x < w; x++) put(x, y, c, 1);
      }
    },
    radial(cx, cy, r, cIn, cOut, alpha) {
      const A = hex(cIn), B = hex(cOut);
      for (let y = Math.max(0, cy - r | 0); y < Math.min(h, cy + r); y++) {
        for (let x = Math.max(0, cx - r | 0); x < Math.min(w, cx + r); x++) {
          const d = Math.hypot(x - cx, y - cy) / r;
          if (d > 1) continue;
          const c = mix(A, B, d);
          put(x, y, c, (alpha === undefined ? 1 : alpha) * (1 - d * 0.75));
        }
      }
    },
  };
  return api;
}

/* ═══════════ 1 · FLYER (cartel de papel) ═══════════ */
{
  const W = 760, H = 950, c = Canvas(W, H, null);
  const paper = hex("#efe9dc"), paper2 = hex("#d8d0bd");
  /* hoja con borde rasgado abajo */
  const edge = [[30, 40], [730, 34], [730, 858]];
  for (let i = 0; i < 22; i++) edge.push([730 - (i + 1) * 32, 858 + (i % 2 ? 44 : 0)]);
  edge.push([30, 40]);
  c.poly(edge, paper, 1);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const t = j / H;
    if (t > 0.55) c.px(i, j, paper2, (t - 0.55) * 0.55);
  }
  /* manchas de humedad */
  c.ellipse(180, 700, 78, 26, hex("#8a8172"), 0.2);
  c.ellipse(600, 380, 92, 22, hex("#8a8172"), 0.14);
  c.ellipse(330, 800, 130, 18, hex("#8a8172"), 0.12);
  /* cinta adhesiva */
  c.rect(270, 8, 220, 54, hex("#d9d2c2"), 0.72);
  c.rect(276, 14, 208, 42, hex("#e6e0d2"), 0.35);
  c.rect(250, 760, 260, 52, hex("#d9d2c2"), 0.66);
  writePNG("assets/flyer_base.png", W, H, c.buf);
}

/* ═══════════ 2 · ENTRANCE DEL CLUB ═══════════ */
{
  const W = 1080, H = 1520, c = Canvas(W, H, "#0b0809");
  c.vgrad(0, H, "#2a1d1a", "#080607");
  /* juntas del muro */
  for (let y = 0; y < 980; y += 180) c.rect(0, y, W, 8, hex("#3a3330"), 0.4);
  for (let x = 140; x < W; x += 380) c.rect(x, 0, 8, 980, hex("#3a3330"), 0.35);
  /* placa oscura arriba (ahí va el neon en vivo) */
  c.rect(230, 150, 620, 190, hex("#0a0808"), 0.95);
  c.rect(230, 150, 620, 6, hex("#3a1518"), 0.85);
  c.rect(230, 334, 620, 6, hex("#3a1518"), 0.85);
  /* escaleras */
  for (let i = 0; i < 5; i++) {
    const y = 1000 + i * 92, x = 150 + i * 50, ww = 780 - i * 100;
    c.vgrad(y, y + 92, "#3a3330", "#15110f");
    c.rect(x, y, ww, 5, hex("#4a423d"), 0.7);
  }
  /* terciopelo */
  c.curve([120, 1500], [190, 1210], [300, 1180], hex("#7a1018"), 9, 1);
  c.curve([300, 1180], [410, 1250], [520, 1500], hex("#7a1018"), 9, 1);
  c.curve([560, 1500], [650, 1200], [780, 1170], hex("#7a1018"), 9, 1);
  c.curve([780, 1170], [890, 1240], [960, 1500], hex("#7a1018"), 9, 1);
  c.rect(86, 1190, 36, 330, hex("#6d131b"), 1);
  c.rect(958, 1180, 36, 340, hex("#6d131b"), 1);
  /* suelo */
  c.rect(0, 1430, W, 90, hex("#2a0e12"), 0.55);
  writePNG("assets/entrance_base.png", W, H, c.buf);
}

/* ═══════════ 3 · MULTITUD (roja, desenfocada) ═══════════ */
{
  const W = 1080, H = 1520, c = Canvas(W, H, "#0b0409");
  c.radial(540, 480, 1000, "#8a1424", "#0b0409", 1);
  const blobs = [[130, 1130, 165], [330, 1190, 150], [520, 1140, 160], [700, 1200, 150], [900, 1150, 155], [1020, 1210, 135]];
  for (const [bx, by, r] of blobs) { c.ellipse(bx, by, r, r * 1.05, hex("#180910"), 0.85); c.ellipse(bx, by, r * 1.35, r * 1.4, hex("#180910"), 0.35); }
  const lights = [[90, 330, 26, "#ff4b5c"], [980, 290, 30, "#ff4b5c"], [520, 180, 22, "#ff4b5c"], [700, 430, 18, "#ff4b5c"], [250, 470, 16, "#ff4b5c"], [400, 640, 14, "#ffd166"], [820, 700, 12, "#ffd166"], [140, 760, 13, "#ffd166"]];
  for (const [lx, ly, lr, lc] of lights) { c.ellipse(lx, ly, lr, lr, hex(lc), 0.55); c.ellipse(lx, ly, lr * 2.6, lr * 2.6, hex(lc), 0.12); }
  writePNG("assets/crowd_base.png", W, H, c.buf);
}

/* ═══════════ 4 · DOS PERSONAS CON CHAQUETAS AMARILLAS (alfa) ═══════════ */
{
  const W = 640, H = 940, c = Canvas(W, H, null);
  const jacket = hex("#f0c33a"), jacket2 = hex("#ffe07a"), dark = hex("#20242c");
  const people = [
    { cx: 180, cy: 150, skin: "#c98f6a", hair: "#2a1c14" },
    { cx: 450, cy: 160, skin: "#e0ab86", hair: "#3b2a1e" },
  ];
  for (const p of people) {
    c.ellipse(p.cx, p.cy, 62, 68, hex(p.skin), 1);
    c.ellipse(p.cx, p.cy - 44, 62, 40, hex(p.hair), 1);
    c.poly([[p.cx - 86, 300], [p.cx - 60, 250], [p.cx + 60, 250], [p.cx + 86, 300], [p.cx + 104, 600], [p.cx - 104, 600]], jacket, 1);
    c.poly([[p.cx - 86, 300], [p.cx - 60, 250], [p.cx + 60, 250], [p.cx + 86, 300], [p.cx + 90, 340], [p.cx - 90, 340]], jacket2, 0.55);
    c.rect(p.cx - 74, 300, 48, 250, hex("#e8b82f"), 1);
    c.rect(p.cx + 26, 300, 48, 250, hex("#e8b82f"), 1);
    c.rect(p.cx - 30, 600, 60, 340, dark, 1);
  }
  writePNG("assets/people.png", W, H, c.buf);
}

/* ═══════════ 5 · PERSONAJES CARTOON (alfa) ═══════════ */
{
  const variants = [
    { skin: "#f0c9a8", hair: "#2b1a22", eye: 92 },
    { skin: "#e9b892", hair: "#3a2038", eye: 82 },
    { skin: "#f4d3b4", hair: "#1d3a30", eye: 100 },
    { skin: "#f2c79f", hair: "#3d2a12", eye: 88 },
  ];
  variants.forEach((v, idx) => {
    const W = 800, H = 800, c = Canvas(W, H, null);
    const skin = hex(v.skin), hair = hex(v.hair);
    c.ellipse(400, 330, 270, 250, skin, 1);
    c.ellipse(400, 150, 280, 130, hair, 1);
    c.ellipse(300, 320, v.eye, v.eye * 1.08, hex("#ffffff"), 1);
    c.ellipse(500, 320, v.eye, v.eye * 1.08, hex("#ffffff"), 1);
    c.ellipse(306, 338, 34, 40, hex("#101014"), 1);
    c.ellipse(494, 338, 34, 40, hex("#101014"), 1);
    c.ellipse(400, 520, 100, 64, hex("#101014"), 1);
    for (let i = 0; i < 4; i++) {
      const tx = 320 + i * 48;
      c.poly([[tx, 480], [tx + 26, 480], [tx + 13, 536]], hex("#f7f7f7"), 1);
    }
    c.ellipse(190, 210, 26, 34, hex("#101014"), 0.9);
    c.ellipse(610, 210, 26, 34, hex("#101014"), 0.9);
    writePNG(`assets/char${idx + 1}.png`, W, H, c.buf);
  });
}

/* ═══════════ 6 · LOGO (alfa) ═══════════ */
{
  const W = 120, H = 120, c = Canvas(W, H, null);
  c.ring(60, 60, 48, 7, hex("#f2f2f2"), 1);
  c.ellipse(60, 60, 9, 9, hex("#f2f2f2"), 1);
  c.rect(57, 40, 6, 24, hex("#f2f2f2"), 1);
  c.rect(60, 61, 22, 6, hex("#f2f2f2"), 1);
  writePNG("assets/logo.png", W, H, c.buf);
}

console.log("bases generadas");
