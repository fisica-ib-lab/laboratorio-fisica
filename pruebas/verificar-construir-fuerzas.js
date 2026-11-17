// Verificación de «Construir» en «Diagramas de cuerpo libre y segunda ley» (A.2): node pruebas/verificar-construir-fuerzas.js
// Reto 1: en cada situación, las fuerzas que da el modelo en ese instante son exactamente las que dice «espera», el estado
// de movimiento es el que describe el enunciado y las direcciones caen en la cuadrícula de 5° del arrastre.
// Reto 2: cada pareja y cada pregunta está bien formada. Además se prueba el corrector con respuestas buenas y malas.

const D = require('../comun/dinamica.js');
const C = require('../sims/A.2-fuerzas/construir-datos.js');
const { esperadas, corregir, angulo } = require('../sims/A.2-fuerzas/construir-corrector.js');
let fallos = 0, comprobaciones = 0;
function ok(cond, msg) { comprobaciones++; if (!cond) { fallos++; console.log('FALLO:', msg); } }
const ordenar = (a) => a.slice().sort().join(',');

for (const s of C.SITUACIONES) {
  const esp = esperadas(s, D);
  ok(ordenar(esp.map(f => f.tipo)) === ordenar(s.espera), `${s.id}: el modelo da ${ordenar(esp.map(f => f.tipo))}, se esperaba ${ordenar(s.espera)}`);
  for (const f of esp) ok(Math.abs(f.ang / 5 - Math.round(f.ang / 5)) < 1e-6, `${s.id}: ${f.tipo} a ${f.ang}° no cae en la cuadrícula de 5°`);
  for (const d of s.extra.concat(C.SIEMPRE)) ok(C.DISTRACTORES[d], `${s.id}: distractor «${d}» inexistente`);
  if (s.modelo !== false) {
    const mod = D.crear(s.escena, s.par), e = mod.estado(s.t);
    ok(s.t <= mod.T + 1e-9, `${s.id}: el instante ${s.t} está después del final (${mod.T})`);
    // estado de movimiento que dice el enunciado
    const v = e.v;
    if (/en reposo|quieto/i.test(s.texto)) ok(v === 0, `${s.id}: debía estar en reposo (v=${v})`);
    if (/desliza|sube|baja|se mueven|acelerando|arranca/i.test(s.texto) && !/en reposo/i.test(s.texto)) ok(v !== 0 || Math.abs(e.a) > 0, `${s.id}: debía moverse`);
    if (s.id === 'soltado') ok(!e.cuerpos[0].fuerzas.some(f => f.tipo === 'FH') && v > 0, 'soltado: el dinamómetro debía estar suelto y el bloque deslizando');
    if (s.id === 'planoSube') ok(v > 0, 'planoSube: debía estar subiendo');
    if (s.id === 'planoBaja') ok(v < 0, 'planoBaja: debía estar bajando');
    if (s.id === 'ascensorBaja') ok(e.a < 0 && e.lecturas.balanza < e.lecturas.peso, 'ascensorBaja: debía acelerar hacia abajo');
    if (s.id === 'esfera') ok(e.a > 0 && e.lecturas.Fd > 0, 'esfera: debía estar acelerando con arrastre');
  }
  // el corrector acepta la respuesta correcta (en cualquier orden y con ±10°) y detecta los errores típicos
  // respuesta correcta: longitudes proporcionales a los módulos (carrito: F_N = F_g, rozamiento menor) y ±4° de error
  const max = Math.max(...esp.map(f => f.mod));
  const Lde = (f) => s.modelo === false ? (f.tipo === 'Ff' ? 40 : 90) : 100 * f.mod / max;
  const bien = esp.map((f, i) => ({ id: i, tipo: f.tipo, ang: f.ang + (i % 2 ? 4 : -4), L: Lde(f) })).reverse();
  // con ±8° y longitudes exactas también debe aceptarse (la dirección se acepta hasta ±10°)
  ok(corregir(s, esp.map((f, i) => ({ id: i, tipo: f.tipo, ang: f.ang + (i % 2 ? 8 : -8), L: Lde(f) })), 1, D).bien, `${s.id}: con ±8° el corrector debía aceptar`);
  // todas las flechas iguales: solo puede valer si de verdad son iguales y se compensan
  const iguales = esp.map((f, i) => ({ id: i, tipo: f.tipo, ang: f.ang, L: 70 }));
  if (['planoQuieto', 'tirado', 'bloqueMesa', 'esfera', 'ascensorBaja', 'colgante', 'cuerdas'].includes(s.id)) ok(!corregir(s, iguales, 1, D).bien && /longitudes/.test(corregir(s, iguales, 1, D).mensaje), `${s.id}: con todas las flechas iguales debía pedir ajustar las longitudes`);
  if (['ascensorBaja', 'colgante'].includes(s.id)) {
    // F_N (o F_T) igual o más larga que F_g: debe rechazarse
    const mal = esp.map((f, i) => ({ id: i, tipo: f.tipo, ang: f.ang, L: f.tipo === 'Fg' ? 80 : 85 }));
    ok(!corregir(s, mal, 1, D).bien, `${s.id}: con la fuerza hacia arriba más larga que el peso debía rechazarse`);
  }
  if (s.equilibrio) ok(['reposoMesa', 'planoQuieto', 'cuerdas'].includes(s.id) && Math.abs(D.crear(s.escena, s.par).estado(s.t).a) < 1e-12, `${s.id}: marcado en equilibrio sin estarlo`);
  else ok(!!s.haciaA, `${s.id}: falta haciaA`);
  ok(corregir(s, bien, 1, D).bien, `${s.id}: el corrector rechaza la respuesta correcta`);
  const falta = bien.slice(1);
  const rf = corregir(s, falta, 1, D); ok(!rf.bien && /Falta/.test(rf.mensaje), `${s.id}: no detecta una fuerza que falta`);
  ok(/Falta (el|la) /.test(corregir(s, falta, 3, D).mensaje) || s.id === 'carrito', `${s.id}: la tercera pista debe nombrar la fuerza`);
  const conDistractor = bien.concat([{ id: 99, tipo: 'x:movimiento', ang: 0 }]);
  const rd = corregir(s, conDistractor, 1, D); ok(!rd.bien && rd.marcadas.includes(99), `${s.id}: no detecta el distractor`);
  const girada = bien.map((f, i) => i === 0 ? Object.assign({}, f, { ang: f.ang + 40 }) : f);
  const rg = corregir(s, girada, 1, D); ok(!rg.bien && /dirección/.test(rg.mensaje), `${s.id}: no detecta una dirección incorrecta`);
  const doble = bien.concat([{ id: 98, tipo: 'Fg', ang: -90 }]);
  ok(!corregir(s, doble, 1, D).bien, `${s.id}: no detecta una fuerza repetida`);
}
ok(angulo(1, 0) === 0 && angulo(0, 1) === 90 && angulo(0, -1) === -90, 'función angulo');

for (const [i, p] of C.PAREJAS.entries()) {
  if (p.tipo === 'pareja') {
    ok(p.cuerpos.includes(p.por) && p.cuerpos.includes(p.sobre), `pareja ${i + 1}: cuerpos`);
    ok(C.TIPOS.some(t => t[0] === p.clase) && C.OPUESTO[p.sentido], `pareja ${i + 1}: tipo o sentido`);
  } else {
    ok(p.opciones.filter(o => o[1]).length === 1 && p.opciones.every(o => o[1] || o[2]) && p.explica, `pregunta ${i + 1}: mal formada`);
  }
}

console.log(`${comprobaciones} comprobaciones · ${fallos} fallos`);
process.exit(fallos ? 1 : 0);
