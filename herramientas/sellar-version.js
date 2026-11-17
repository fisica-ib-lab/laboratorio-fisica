// Sella la versión de los archivos .js y .css que cargan las páginas: node herramientas/sellar-version.js
// Añade (o cambia) «?v=AAAAMMDDhhmm» en cada src/href local de todos los .html del sitio. Así, después de publicar,
// los navegadores descargan los archivos nuevos en vez de usar la copia guardada.
// Ejecutarlo justo antes de cada commit que vaya a publicarse.

const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..');
const d = new Date();
const dos = (n) => String(n).padStart(2, '0');
const sello = `${d.getFullYear()}${dos(d.getMonth() + 1)}${dos(d.getDate())}${dos(d.getHours())}${dos(d.getMinutes())}`;

function htmls(dir) {
  let r = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'node_modules') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) r = r.concat(htmls(p));
    else if (e.name.endsWith('.html')) r.push(p);
  }
  return r;
}

let cambios = 0;
for (const archivo of htmls(raiz)) {
  const antes = fs.readFileSync(archivo, 'utf8');
  // solo rutas locales a .js o .css (no enlaces externos ni plantillas ${…})
  const despues = antes.replace(/(\s(?:src|href)=")([^"#:$]+?\.(?:js|css))(?:\?v=\d+)?(")/g, (_, a, ruta, c) => `${a}${ruta}?v=${sello}${c}`);
  if (despues !== antes) { fs.writeFileSync(archivo, despues); cambios++; }
}
console.log(`Versión ${sello} sellada en ${cambios} páginas.`);
