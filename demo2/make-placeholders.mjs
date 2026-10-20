// Genera los placeholders del promo VELUXE V3 como SVG editables (+ grano PNG).
// El cliente sustituye cada archivo por su material manteniendo el nombre.
import fs from "node:fs";
import path from "node:path";

const DIR = "assets/placeholders";
fs.mkdirSync(DIR, { recursive: true });
const w = (name, svg) => {
  fs.writeFileSync(path.join(DIR, name), svg.trim() + "\n", "utf8");
  console.log("  " + name);
};

/* ── cartel de papel (tornado, sucio, con cinta) ── */
w("flyer.svg", `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000">
  <defs>
    <filter id="f1" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" seed="7"/>
      <feDisplacementMap in="SourceGraphic" scale="9"/>
    </filter>
    <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f2ede1"/><stop offset="0.6" stop-color="#e6dfd0"/>
      <stop offset="1" stop-color="#cfc6b4"/>
    </linearGradient>
  </defs>
  <path filter="url(#f1)" fill="url(#paper)" d="M40 20 L760 26 L752 940 L690 968 L640 944 L580 972 L520 946 L452 976 L392 948 L330 972 L262 944 L196 968 L132 940 L44 958 Z"/>
  <g fill="#0f0f10" text-anchor="middle" font-family="Helvetica Neue, Arial, sans-serif" font-weight="700">
    <text x="400" y="250" font-size="42" letter-spacing="9" fill="#7a736a">SAVE THE DATE</text>
    <text x="400" y="330" font-size="54" letter-spacing="4">11/07/2026</text>
    <text x="400" y="520" font-size="150" letter-spacing="4" fill="#c1121f">VELUXE</text>
    <text x="400" y="600" font-size="54" letter-spacing="18" fill="#6f6a62">PARTY</text>
  </g>
  <g opacity="0.16" fill="#6b6152">
    <rect x="60" y="700" width="300" height="12" rx="6"/>
    <rect x="120" y="740" width="520" height="10" rx="5"/>
    <rect x="180" y="776" width="380" height="9" rx="4"/>
  </g>
  <g fill="#d9d2c2" opacity="0.75">
    <rect x="300" y="-6" width="200" height="52" rx="4" transform="rotate(-4 400 20)"/>
    <rect x="286" y="944" width="228" height="48" rx="4" transform="rotate(3 400 968)"/>
  </g>
  <g fill="#8a8172" opacity="0.35">
    <ellipse cx="180" cy="640" rx="70" ry="26"/><ellipse cx="600" cy="330" rx="90" ry="22"/>
    <ellipse cx="300" cy="860" rx="120" ry="18"/>
  </g>
</svg>`);

/* ── entrada del club: muro, escaleras, neon de bombillas, terciopelo ── */
w("entrance.svg", `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1520" width="1080" height="1520">
  <defs>
    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#241a18"/><stop offset="0.55" stop-color="#171113"/><stop offset="1" stop-color="#0b0809"/>
    </linearGradient>
    <linearGradient id="step" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3a3330"/><stop offset="1" stop-color="#14100f"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#ff3b3b" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#ff3b3b" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1080" height="1520" fill="url(#wall)"/>
  <g opacity="0.5" fill="#3a3330">
    <rect x="0" y="0" width="1080" height="14"/><rect x="0" y="180" width="1080" height="10"/>
    <rect x="0" y="360" width="1080" height="10"/><rect x="0" y="540" width="1080" height="10"/>
    <rect x="140" y="0" width="10" height="900"/><rect x="520" y="0" width="10" height="900"/>
    <rect x="900" y="0" width="10" height="900"/>
  </g>
  <g>
    <rect x="150" y="1000" width="780" height="90" fill="url(#step)"/>
    <rect x="200" y="1090" width="680" height="90" fill="url(#step)"/>
    <rect x="250" y="1180" width="580" height="90" fill="url(#step)"/>
    <rect x="300" y="1270" width="480" height="90" fill="url(#step)"/>
    <rect x="350" y="1360" width="380" height="90" fill="url(#step)"/>
  </g>
  <g>
    <rect x="250" y="150" width="580" height="170" rx="12" fill="#0d0a0a" stroke="#3a1518" stroke-width="6"/>
    <text x="540" y="278" text-anchor="middle" font-family="Helvetica Neue, Arial, sans-serif"
      font-size="128" font-weight="800" letter-spacing="6" fill="#ff4a4a"
      style="filter:drop-shadow(0 0 10px #ff2b2b) drop-shadow(0 0 34px #ff1f1f)">VELUXE</text>
    <g fill="#ffe3c4">
      <circle cx="300" cy="180" r="11"/><circle cx="390" cy="180" r="11"/><circle cx="480" cy="180" r="11"/>
      <circle cx="600" cy="180" r="11"/><circle cx="690" cy="180" r="11"/><circle cx="780" cy="180" r="11"/>
    </g>
    <g fill="#ffd9a0" opacity="0.5">
      <circle cx="300" cy="180" r="22"/><circle cx="480" cy="180" r="22"/><circle cx="690" cy="180" r="22"/>
    </g>
    <ellipse cx="540" cy="235" rx="420" ry="190" fill="url(#glow)"/>
  </g>
  <g stroke="#7a1018" stroke-width="16" fill="none" stroke-linecap="round">
    <path d="M120 1500 Q150 1240 300 1180 Q420 1250 520 1500"/>
    <path d="M560 1500 Q640 1230 780 1170 Q900 1240 960 1500"/>
  </g>
  <g fill="#6d131b">
    <rect x="86" y="1200" width="34" height="320" rx="14"/><rect x="960" y="1190" width="34" height="330" rx="14"/>
  </g>
  <g opacity="0.5" fill="#5c2420">
    <rect x="0" y="1420" width="1080" height="100"/>
  </g>
</svg>`);

/* ── dos personas con chaquetas amarillas (recorte con alfa) ── */
w("people.svg", `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 940" width="640" height="940">
  <g>
    <circle cx="180" cy="150" r="62" fill="#c98f6a"/>
    <path d="M118 132 q62 -74 124 0 q-14 -52 -62 -52 q-48 0 -62 52z" fill="#2a1c14"/>
    <path d="M92 300 q88 -70 176 0 l24 300 q-112 34 -224 0z" fill="#f0c33a"/>
    <path d="M92 300 q88 -70 176 0 l6 84 q-94 -20 -188 0z" fill="#ffe07a" opacity="0.55"/>
    <rect x="150" y="600" width="60" height="340" fill="#20242c"/>
    <rect x="112" y="300" width="46" height="250" rx="22" fill="#e8b82f"/>
    <rect x="202" y="300" width="46" height="250" rx="22" fill="#e8b82f"/>
  </g>
  <g>
    <circle cx="450" cy="160" r="60" fill="#e0ab86"/>
    <path d="M390 138 q60 -70 120 0 q-16 -50 -60 -50 q-44 0 -60 50z" fill="#3b2a1e"/>
    <path d="M364 310 q86 -68 172 0 l22 290 q-108 32 -216 0z" fill="#f0c33a"/>
    <path d="M364 310 q86 -68 172 0 l6 80 q-92 -20 -184 0z" fill="#ffe07a" opacity="0.55"/>
    <rect x="420" y="600" width="58" height="340" fill="#20242c"/>
    <rect x="384" y="310" width="44" height="250" rx="22" fill="#e8b82f"/>
    <rect x="472" y="310" width="44" height="250" rx="22" fill="#e8b82f"/>
  </g>
</svg>`);

/* ── personajes cartoon de ojos grandes y cara de susto ── */
const char = (bg, skin, hair, eye) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <rect width="800" height="800" fill="${bg}"/>
  <g>
    <ellipse cx="400" cy="300" rx="270" ry="250" fill="${skin}"/>
    <path d="M140 250 q60 -190 260 -190 q200 0 260 190 q-40 -110 -260 -110 q-220 0 -260 110z" fill="${hair}"/>
    <g fill="#fff">
      <ellipse cx="300" cy="300" rx="86" ry="98"/>
      <ellipse cx="500" cy="300" rx="86" ry="98"/>
    </g>
    <g fill="#101014">
      <circle cx="306" cy="316" r="34"/><circle cx="494" cy="316" r="34"/>
    </g>
    <g fill="#101014">
      <ellipse cx="400" cy="500" rx="96" ry="60"/>
    </g>
    <g fill="#fff">
      <path d="M320 470 l30 60 l30 -60z"/><path d="M380 470 l30 60 l30 -60z"/><path d="M440 470 l30 60 l30 -60z"/>
    </g>
    <g stroke="#101014" stroke-width="12" fill="none" stroke-linecap="round">
      <path d="M200 190 q-40 40 -10 80"/><path d="M600 190 q40 40 10 80"/>
    </g>
  </g>
</svg>`;
w("char1.svg", char("#1b0d12", "#f0c9a8", "#2b1a22", 1));
w("char2.svg", char("#120d1c", "#e9b892", "#3a2038", 1));
w("char3.svg", char("#0d1a16", "#f4d3b4", "#1d3a30", 1));
w("char4.svg", char("#1a1208", "#f2c79f", "#3d2a12", 1));

/* ── multitud en fondo rojo (se ve desenfocada) ── */
w("crowd.svg", `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1520" width="1080" height="1520">
  <defs>
    <radialGradient id="red" cx="0.5" cy="0.35" r="0.8">
      <stop offset="0" stop-color="#7a1020"/><stop offset="0.55" stop-color="#3a0812"/><stop offset="1" stop-color="#0b0409"/>
    </radialGradient>
  </defs>
  <rect width="1080" height="1520" fill="url(#red)"/>
  <g opacity="0.75" fill="#160a10">
    <circle cx="120" cy="1120" r="95"/><circle cx="300" cy="1180" r="88"/><circle cx="470" cy="1130" r="92"/>
    <circle cx="650" cy="1190" r="90"/><circle cx="820" cy="1140" r="86"/><circle cx="960" cy="1200" r="84"/>
    <rect x="20" y="1210" width="180" height="310" rx="60"/><rect x="210" y="1260" width="170" height="260" rx="55"/>
    <rect x="390" y="1230" width="175" height="290" rx="58"/><rect x="575" y="1270" width="165" height="250" rx="52"/>
    <rect x="750" y="1240" width="180" height="280" rx="56"/><rect x="940" y="1275" width="140" height="245" rx="50"/>
  </g>
  <g fill="#ff4b5c" opacity="0.5">
    <circle cx="90" cy="330" r="26"/><circle cx="980" cy="290" r="30"/><circle cx="520" cy="180" r="22"/>
    <circle cx="700" cy="430" r="18"/><circle cx="250" cy="470" r="16"/>
  </g>
  <g fill="#ffd166" opacity="0.35">
    <circle cx="400" cy="640" r="14"/><circle cx="820" cy="700" r="12"/><circle cx="140" cy="760" r="13"/>
  </g>
</svg>`);

/* ── monstruo oscuro con dientes y ojos grandes ── */
w("monster.svg", `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
  <g>
    <path d="M120 470 q0 -330 380 -330 q380 0 380 330 q0 250 -180 340 q-200 90 -400 0 q-180 -90 -180 -340z" fill="#1b1424"/>
    <g fill="#f6f0ff">
      <ellipse cx="360" cy="400" rx="120" ry="135"/><ellipse cx="640" cy="400" rx="120" ry="135"/>
    </g>
    <g fill="#241033">
      <circle cx="372" cy="418" r="56"/><circle cx="628" cy="418" r="56"/>
      <circle cx="372" cy="418" r="22" fill="#0a0510"/><circle cx="628" cy="418" r="22" fill="#0a0510"/>
    </g>
    <path d="M250 600 q250 -150 500 0 q-40 220 -250 240 q-210 -20 -250 -240z" fill="#0c0710"/>
    <g fill="#f2e9f5">
      <path d="M290 610 l44 96 l44 -96z"/><path d="M392 630 l44 96 l44 -96z"/><path d="M494 630 l44 96 l44 -96z"/>
      <path d="M596 610 l44 96 l44 -96z"/><path d="M690 600 l40 88 l40 -88z"/>
    </g>
    <g fill="#5b3a7a" opacity="0.5">
      <path d="M120 470 q30 -120 130 -160 q-60 90 -50 200z"/>
      <path d="M880 470 q-30 -120 -130 -160 q60 90 50 200z"/>
    </g>
  </g>
</svg>`);

/* ── logo ── */
w("logo.svg", `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <circle cx="60" cy="60" r="52" fill="none" stroke="#f2f2f2" stroke-width="7"/>
  <circle cx="60" cy="60" r="10" fill="#f2f2f2"/>
  <path d="M60 40 v14 l10 8" stroke="#f2f2f2" stroke-width="7" fill="none" stroke-linecap="round"/>
</svg>`);

/* ── objetos flotantes ── */
w("bottle.svg", `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 260" width="120" height="260">
  <path d="M46 10 h28 v54 q30 14 30 56 v120 q0 14 -14 14 h-60 q-14 0 -14 -14 v-120 q0 -42 30 -56z" fill="#1f7a4d" opacity="0.95"/>
  <rect x="46" y="2" width="28" height="16" rx="4" fill="#c8a23a"/>
  <rect x="30" y="120" width="60" height="52" rx="6" fill="#f2ead8" opacity="0.9"/>
</svg>`);
w("burger.svg", `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 160" width="220" height="160">
  <path d="M14 66 a96 60 0 0 1 192 0z" fill="#e8a24a"/>
  <rect x="18" y="66" width="184" height="20" rx="9" fill="#f2c14e"/>
  <path d="M12 92 q14 -16 28 0 q14 -16 28 0 q14 -16 28 0 q14 -16 28 0 q14 -16 28 0 q14 -16 28 0 q14 -16 28 0 l0 6 q-10 12 -20 0 q-10 12 -20 0 q-10 12 -20 0 q-10 12 -20 0 q-10 12 -20 0 q-10 12 -20 0 q-10 12 -20 0 q-10 12 -20 0z" fill="#7ab648"/>
  <rect x="16" y="92" width="188" height="26" rx="10" fill="#7a3a22"/>
  <path d="M14 122 h192 l-14 34 h-164z" fill="#e8a24a"/>
  <rect x="16" y="148" width="188" height="14" rx="7" fill="#d08b38"/>
</svg>`);

console.log("placeholders listos en", DIR);
