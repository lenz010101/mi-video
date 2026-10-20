// Regenera dos placeholders: la entrada SIN el neon (el neon va en vivo en el
// HTML para poder parpadear) y la multitud con bordes blandos (evita el
// filter:blur() caro que el manual prohibe).
import fs from "node:fs";

const DIR = "assets/placeholders";
const w = (name, svg) => {
  fs.writeFileSync(`${DIR}/${name}`, svg.trim() + "\n", "utf8");
  console.log("  " + name);
};

w(
  "entrance.svg",
  `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1520" width="1080" height="1520">
  <defs>
    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#241a18"/><stop offset="0.55" stop-color="#171113"/><stop offset="1" stop-color="#0b0809"/>
    </linearGradient>
    <linearGradient id="step" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3a3330"/><stop offset="1" stop-color="#14100f"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1520" fill="url(#wall)"/>
  <g opacity="0.45" fill="#3a3330">
    <rect x="0" y="0" width="1080" height="14"/><rect x="0" y="180" width="1080" height="10"/>
    <rect x="0" y="360" width="1080" height="10"/><rect x="0" y="540" width="1080" height="10"/>
    <rect x="140" y="0" width="10" height="900"/><rect x="520" y="0" width="10" height="900"/><rect x="900" y="0" width="10" height="900"/>
  </g>
  <g>
    <rect x="150" y="1000" width="780" height="90" fill="url(#step)"/>
    <rect x="200" y="1090" width="680" height="90" fill="url(#step)"/>
    <rect x="250" y="1180" width="580" height="90" fill="url(#step)"/>
    <rect x="300" y="1270" width="480" height="90" fill="url(#step)"/>
    <rect x="350" y="1360" width="380" height="90" fill="url(#step)"/>
  </g>
  <g stroke="#7a1018" stroke-width="15" fill="none" stroke-linecap="round">
    <path d="M120 1500 Q150 1240 300 1180 Q420 1250 520 1500"/>
    <path d="M560 1500 Q640 1230 780 1170 Q900 1240 960 1500"/>
  </g>
  <g fill="#6d131b">
    <rect x="86" y="1200" width="34" height="320" rx="14"/><rect x="960" y="1190" width="34" height="330" rx="14"/>
  </g>
  <g opacity="0.5" fill="#5c2420"><rect x="0" y="1420" width="1080" height="100"/></g>
</svg>`
);

w(
  "crowd.svg",
  `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1520" width="1080" height="1520">
  <defs>
    <radialGradient id="red" cx="0.5" cy="0.32" r="0.78">
      <stop offset="0" stop-color="#8a1424"/><stop offset="0.5" stop-color="#400914"/><stop offset="1" stop-color="#0b0409"/>
    </radialGradient>
    <radialGradient id="blob" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#1c0a12" stop-opacity="0.95"/><stop offset="0.62" stop-color="#1c0a12" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#1c0a12" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1080" height="1520" fill="url(#red)"/>
  <g>
    <ellipse cx="130" cy="1120" rx="150" ry="160" fill="url(#blob)"/>
    <ellipse cx="320" cy="1180" rx="140" ry="150" fill="url(#blob)"/>
    <ellipse cx="500" cy="1130" rx="150" ry="160" fill="url(#blob)"/>
    <ellipse cx="690" cy="1190" rx="140" ry="150" fill="url(#blob)"/>
    <ellipse cx="880" cy="1140" rx="145" ry="155" fill="url(#blob)"/>
    <ellipse cx="1010" cy="1200" rx="130" ry="140" fill="url(#blob)"/>
    <ellipse cx="230" cy="1000" rx="110" ry="110" fill="url(#blob)" opacity="0.7"/>
    <ellipse cx="760" cy="980" rx="115" ry="115" fill="url(#blob)" opacity="0.7"/>
  </g>
  <g fill="#ff4b5c" opacity="0.45">
    <circle cx="90" cy="330" r="26"/><circle cx="980" cy="290" r="30"/><circle cx="520" cy="180" r="22"/>
    <circle cx="700" cy="430" r="18"/><circle cx="250" cy="470" r="16"/>
  </g>
  <g fill="#ffd166" opacity="0.3">
    <circle cx="400" cy="640" r="14"/><circle cx="820" cy="700" r="12"/><circle cx="140" cy="760" r="13"/>
  </g>
</svg>`
);
