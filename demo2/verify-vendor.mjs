/* Comprueba que todo lo que hay vendorizado en assets/vendor es EXACTAMENTE lo
   mismo que instala npm. Es la garantia de que la nube (que usa node_modules)
   y el repo (que usa assets/vendor) renderizan lo mismo.

   Uso (desde la raiz del proyecto):
     node demo2/verify-vendor.mjs

   De donde se lee npm:
     $EDITING_TOOLS/node_modules  (la nube: $HOME/editing-tools)
     ./node_modules               (local, si se ha instalado en el proyecto)

   Sale con codigo 1 si algo no esta o no coincide. */
import fs from 'node:fs';
import path from 'node:path';

const REPO = process.cwd();
const TOOLS = process.env.EDITING_TOOLS || path.join(process.env.HOME || '', 'editing-tools');
const NPM = fs.existsSync(path.join(TOOLS, 'node_modules'))
  ? path.join(TOOLS, 'node_modules')
  : path.join(REPO, 'node_modules');

/* fichero vendorizado -> fichero dentro del paquete de npm */
const MAP = {
  'assets/vendor/gsap.min.js': 'gsap/dist/gsap.min.js',
  'assets/vendor/anime.umd.min.js': 'animejs/dist/bundles/anime.umd.min.js',
  'assets/vendor/lottie.min.js': 'lottie-web/build/player/lottie.min.js',
  'assets/vendor/three.module.js': 'three/build/three.module.js',
  'assets/vendor/d3.min.js': 'd3/dist/d3.min.js',
  'assets/vendor/leaflet/leaflet.js': 'leaflet/dist/leaflet.js',
  'assets/vendor/leaflet/leaflet.css': 'leaflet/dist/leaflet.css',
  'assets/vendor/leaflet/marker-icon.png': 'leaflet/dist/images/marker-icon.png',
  'assets/vendor/leaflet/marker-icon-2x.png': 'leaflet/dist/images/marker-icon-2x.png',
  'assets/vendor/leaflet/marker-shadow.png': 'leaflet/dist/images/marker-shadow.png',
};

/* Los plugins de GSAP se comprueban uno a uno contra gsap/dist/ */
const PLUGIN_DIR = 'assets/vendor/gsap';

/* Carpetas vendorizadas -> carpeta del paquete de npm: se comprueba cada
   fichero por separado (mapas, typegpu...). */
const DIRS = {
  'assets/vendor/maplibre': 'maplibre-gl/dist',
  'assets/vendor/mapbox': 'mapbox-gl/dist',
  'assets/vendor/typegpu': 'typegpu',
};

function sha(b) {
  return b.length > 0 ? b.length + ' bytes' : 'vacio';
}

let ok = 0;
const bad = [];

function check(vendorFile, npmFile) {
  const vPath = path.join(REPO, vendorFile);
  const nPath = path.join(NPM, npmFile);
  if (!fs.existsSync(vPath)) { bad.push(`${vendorFile}  (no esta vendorizado)`); return; }
  if (!fs.existsSync(nPath)) { bad.push(`${vendorFile}  (npm no tiene ${npmFile})`); return; }
  const a = fs.readFileSync(vPath);
  const b = fs.readFileSync(nPath);
  if (a.equals(b)) {
    ok++;
    console.log(`  OK   ${vendorFile.padEnd(46)} ${sha(a)}`);
  } else {
    bad.push(`${vendorFile}  (difiere de ${npmFile}: ${a.length} vs ${b.length} bytes)`);
  }
}

console.log(`vendorizado: ${path.join(REPO, 'assets', 'vendor')}`);
console.log(`npm:         ${NPM}`);

if (!fs.existsSync(NPM)) {
  console.log('');
  console.log('No hay node_modules aqui: la comparacion se omite.');
  console.log('La comprobacion real se hace en la nube (render.yml / validate.yml),');
  console.log('donde las librerias estan instaladas en $HOME/editing-tools.');
  process.exit(0);
}
console.log('');

for (const [v, n] of Object.entries(MAP)) check(v, n);

const pluginDir = path.join(REPO, PLUGIN_DIR);
if (fs.existsSync(pluginDir)) {
  for (const f of fs.readdirSync(pluginDir).sort()) {
    check(`${PLUGIN_DIR}/${f}`, `gsap/dist/${f}`);
  }
} else {
  bad.push(`${PLUGIN_DIR}  (no existe la carpeta de plugins)`);
}

for (const [dir, npmDir] of Object.entries(DIRS)) {
  const abs = path.join(REPO, dir);
  if (!fs.existsSync(abs)) { bad.push(`${dir}  (no existe la carpeta)`); continue; }
  for (const f of fs.readdirSync(abs).sort()) {
    check(`${dir}/${f}`, `${npmDir}/${f}`);
  }
}

console.log('');
if (bad.length) {
  for (const b of bad) console.log(`  [!]  ${b}`);
  console.log(`\n${bad.length} problema(s) de ${ok + bad.length} comprobacion(es).`);
  process.exit(1);
}
console.log(`${ok} fichero(s) vendorizado(s) identicos a npm.`);
