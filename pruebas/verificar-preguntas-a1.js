/* Verifica las preguntas guiadas de Explorar de las simulaciones de A.1.
   Para cada pregunta: la situación existe y es del nivel; las de opción tienen una sola correcta,
   comentario en cada distractor y «verifica(ctx)» se cumple con el modelo; las de valor dan un número
   finito que coincide con el valor calculado a mano (tabla ESPERADO) y su resolución muestra ese número.
   Además, con valores al azar de los deslizadores, cada resolución sigue mostrando la respuesta correcta.
   Uso: node pruebas/verificar-preguntas-a1.js   (0 fallos antes de publicar) */
'use strict';
const path = require('path');
const Guia = require('../comun/guia.js');
const c3 = Guia.c3;

const SIMS = [
  { nombre: 'Tres gráficas', ruta: '../sims/A.1-tres-graficas/preguntas.js',
    esperado: { '1-1': 2, '1-4': -12, '2-1': 0.5, '2-5': 20, '2-6': 2, '3-2': 24, '3-4': 14, '3-5': 4, '3-6': 6 },
    azar: (P, sit, r) => {   // otro contexto con deslizadores al azar del mismo nivel
      if (sit.nivel === 3) return null;
      const par = { s0: Math.round(r() * 20 - 10), v: Math.round((r() * 8 - 4) * 2) / 2, a: sit.nivel === 2 ? Math.round((r() * 2 - 1) * 10) / 10 : 0 };
      if (sit.nivel === 1) par.v = Math.round((r() * 4 - 2) * 10) / 10;
      return { mov: P.movimientoPar(par, sit.nivel), par };
    } },
  { nombre: 'Proyectiles', ruta: '../sims/A.1-proyectiles/preguntas.js',
    esperado: (() => { const G = 9.81, R = Math.PI / 180;
      const tv = (h, u, a) => { const uy = u * Math.sin(a * R); return (uy + Math.sqrt(uy * uy + 2 * G * h)) / G; };
      return { '1-1': Math.sqrt(1.6 / G), '1-2': 2.5 * Math.sqrt(1.6 / G), '1-5': Math.sqrt(6.25 + 2 * G * 0.8),
        '2-2': Math.pow(4 * Math.sin(30 * R), 2) / (2 * G), '2-3': 16 * Math.sin(60 * R) / G,
        '3-1': tv(0.6, 4, 35), '3-2': -Math.sqrt(Math.pow(4 * Math.sin(35 * R), 2) + 2 * G * 0.6) }; })(),
    tolEsperado: 1e-9,
    azar: (P, sit, r) => {
      const par = Object.assign({}, sit.par);
      if (sit.nivel !== 2) par.h = Math.round((0.3 + r() * 0.7) * 10) / 10;
      if (sit.nivel !== 1) par.ang = 10 + 5 * Math.floor(r() * 15);
      par.v = 1 + 0.5 * Math.floor(r() * 9);
      return P.contextoDe(par, sit.nivel, sit.aire);
    } },
  { nombre: 'Caída libre', ruta: '../sims/A.1-caida-libre/preguntas.js',
    esperado: (() => { const G = 9.81; const tv = (h, u) => (u + Math.sqrt(u * u + 2 * G * h)) / G;
      return { '1-1': Math.sqrt(3 / G), '1-2': -Math.sqrt(2 * G * 1.5), '1-4': G,
        '2-1': 4 / G, '2-2': 16 / (2 * G), '2-5': -4,
        '3-1': tv(0.5, 4), '3-2': 4 * 0.9 - 0.5 * G * 0.81, '3-4': -Math.sqrt(16 + 2 * G * 0.5) }; })(),
    azar: (P, sit, r) => {
      const par = Object.assign({}, sit.par);
      if (sit.nivel === 1) { par.h = Math.round((0.4 + r() * 1.6) * 10) / 10; par.puerta = Math.max(0.1, Math.floor((par.h - 0.1) * r() / 0.05) * 0.05); }
      else { par.u = 1 + 0.5 * Math.floor(r() * 9); par.h = sit.nivel === 2 ? Math.round(r() * 10) / 10 : Math.round(r() * 10) / 10; par.puerta = 0.1; }
      return P.contextoDe(par, sit.nivel);
    } }
];
const extra = process.argv.slice(2);

let fallos = 0, pruebas = 0;
const falla = (m) => { fallos++; if (fallos <= 40) console.log('  ✗ ' + m); };
const ok = (cond, m) => { pruebas++; if (!cond) falla(m); };
let semilla = 12345; const r = () => { semilla = (semilla * 1103515245 + 12345) % 2147483648; return semilla / 2147483648; };
const textoPlano = (h) => String(h).replace(/<[^>]+>/g, '');

for (const sim of SIMS) {
  if (extra.length && !extra.includes(sim.nombre)) continue;
  const P = require(path.join(__dirname, sim.ruta));
  let n = 0;
  for (const nivel of Object.keys(P.NIVELES)) {
    P.NIVELES[nivel].forEach((q, i) => {
      n++;
      const id = `${sim.nombre} ${nivel}-${i}`;
      const sit = P.SIT[q.sit];
      ok(!!sit, `${id}: la situación «${q.sit}» no existe`);
      if (!sit) return;
      ok(String(sit.nivel) === String(nivel), `${id}: la situación es de otro nivel`);
      const ctx = P.contexto(q.sit);
      const texto = typeof q.texto === 'function' ? q.texto(ctx) : q.texto;
      if (typeof q.pista === 'function') ok(q.pista(ctx).length > 10, `${id}: falta la pista`);
      ok(typeof texto === 'string' && texto.length > 10, `${id}: falta el texto`);
      if (q.tipo === 'opcion') {
        ok(q.opciones.filter(o => o[1]).length === 1, `${id}: debe haber exactamente una opción correcta`);
        ok(q.opciones.every(o => o[1] || (o[2] && o[2].length > 10)), `${id}: un distractor no tiene comentario`);
        ok(typeof q.verifica === 'function', `${id}: falta verifica`);
        if (q.verifica) ok(q.verifica(ctx) === true, `${id}: el modelo no cumple lo que dice la opción correcta`);
        const ex = typeof q.explicacion === 'function' ? q.explicacion(ctx) : q.explicacion;
        ok(typeof ex === 'string' && ex.length > 10, `${id}: falta la explicación`);
      } else if (q.tipo === 'valor') {
        const x = q.respuesta(ctx);
        ok(isFinite(x), `${id}: respuesta no finita`);
        const esp = sim.esperado[`${nivel}-${i}`];
        ok(esp !== undefined, `${id}: falta el valor esperado en la tabla`);
        if (esp !== undefined) ok(Math.abs(x - esp) <= 1e-9 * Math.max(1, Math.abs(esp)), `${id}: respuesta ${x} ≠ esperado ${esp}`);
        ok(textoPlano(q.resolucion(ctx)).includes(c3(x)), `${id}: la resolución no muestra ${c3(x)}`);
        ok(!!q.unidad && !!q.pista, `${id}: falta unidad o pista`);
        // la tolerancia acepta la respuesta escrita con 3 cifras y rechaza el signo contrario
        const escrita = Guia.leerNumero(c3(x)), tol = q.tol || 0.02;
        ok(Math.abs(escrita - x) <= tol * Math.abs(x) + 1e-9, `${id}: la respuesta con 3 cifras no se aceptaría`);
        if (Math.abs(x) > 1e-9) ok(Math.abs(-x - x) > tol * Math.abs(x), `${id}: el signo contrario se aceptaría`);
        // con deslizadores al azar la resolución sigue siendo coherente con la respuesta
        if (sim.azar) for (let k = 0; k < 300; k++) {
          const c2 = sim.azar(P, sit, r); if (!c2) break;
          const y = q.respuesta(c2); if (!isFinite(y)) continue;
          ok(textoPlano(q.resolucion(c2)).includes(c3(y)), `${id}: con otros valores la resolución no muestra ${c3(y)}`);
        }
      } else falla(`${id}: tipo desconocido`);
    });
  }
  console.log(`${sim.nombre}: ${n} preguntas`);
}
console.log(`${pruebas} comprobaciones, ${fallos} fallos`);
process.exit(fallos ? 1 : 0);
