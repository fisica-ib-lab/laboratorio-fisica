// Verificación de «Practicar» en «Diagramas de cuerpo libre y segunda ley» (A.2): node pruebas/verificar-practicar-fuerzas.js
// 1000 ejercicios al azar de cada tipo: la respuesta coincide con lo que mide el modelo con los mismos datos
// (±0,5 %, salvo la viscosidad, que parte de una velocidad medida con 3 cifras), el enunciado y la resolución están
// completos, la resolución muestra el resultado y cada pregunta de opción tiene exactamente una respuesta correcta.

const D = require('../comun/dinamica.js');
const P = require('../sims/A.2-fuerzas/practicar-ejercicios.js');
let fallos = 0, comprobaciones = 0;
function ok(cond, msg) { comprobaciones++; if (!cond) { fallos++; if (fallos <= 40) console.log('FALLO:', msg); } }
const cerca = (a, b, tol) => Math.abs(a - b) <= tol * Math.abs(b) + 1e-9;
const texto = (e) => [e.texto, e.resolucion, e.pista, e.explicacion, ...(e.opciones || []).map(o => o[0] + (o[2] || ''))].join(' ');

for (const tipo of P.LISTA) {
  ok(P.GRUPO_DE[tipo] && P.GRUPOS.some(g => g[0] === P.GRUPO_DE[tipo]), `${tipo}: sin grupo`);
  for (let i = 0; i < 1000; i++) {
    const e = P.generar(tipo), id = `${tipo} #${i}: ${e.texto.replace(/<[^>]+>/g, '').slice(0, 90)}`;
    ok(['Calcula', 'Determina', 'Indica', 'Explica'].includes(e.termino), `${id}: término de instrucción`);
    ok(e.texto.toLowerCase().includes(e.termino.toLowerCase()), `${id}: el enunciado no usa el término «${e.termino}»`);
    ok(!/NaN|undefined|Infinity|null/.test(texto(e)), `${id}: texto con NaN/undefined`);
    ok(e.grupo === P.GRUPO_DE[tipo], `${id}: grupo distinto del declarado`);
    if (e.figura && !e.figura.dibujo) { const mod = D.crear(e.figura.escena, e.figura.par); ok(isFinite(mod.estado(e.figura.t).x), `${id}: la figura no se puede crear`); }
    if (e.opciones) {
      ok(e.opciones.filter(o => o[1]).length === 1, `${id}: debe haber una sola opción correcta`);
      ok(e.opciones.every(o => o[1] || o[2]), `${id}: falta comentario en una opción incorrecta`);
      ok(!!e.explicacion, `${id}: falta la explicación`);
      if (tipo === 'seMueve') {
        const r = e.medir(D), bien = e.opciones.find(o => o[1])[0];
        ok(r.desliza === r.esperado.desliza && cerca(r.Ff, r.esperado.Ff, 1e-9), `${id}: el modelo no hace lo que dice la respuesta`);
        ok(r.desliza ? bien.startsWith('Desliza') : bien.startsWith('No desliza'), `${id}: opción correcta mal marcada`);
      }
      continue;
    }
    ok(isFinite(e.respuesta) && e.respuesta > 0, `${id}: respuesta ${e.respuesta}`);
    const medido = e.medir(D);
    ok(cerca(medido, e.respuesta, tipo === 'viscosidad' ? 0.006 : 0.005), `${id}: el modelo mide ${medido}, la respuesta es ${e.respuesta}`);
    ok(e.resolucion.includes('<b>' + P.c3(e.respuesta)), `${id}: la resolución no termina en el resultado (${P.c3(e.respuesta)})`);
    // el resultado redondeado a 3 c.s. que muestra la resolución se acepta con la tolerancia del ±2 %
    const mostrado = Number(P.c3(e.respuesta).replace('−', '-').replace(',', '.'));
    ok(Math.abs(mostrado - e.respuesta) <= e.tol * Math.abs(e.respuesta), `${id}: el resultado mostrado no se aceptaría`);
  }
}
// grupos: todos tienen al menos un tipo y el generador por grupo respeta el filtro
for (const [g] of P.GRUPOS) for (let i = 0; i < 50; i++) { const e = P.generarDeGrupo(g, null); ok(g === 'todos' || e.grupo === g, `grupo ${g}: generó ${e.tipo}`); }

console.log(`${comprobaciones} comprobaciones · ${fallos} fallos`);
process.exit(fallos ? 1 : 0);
