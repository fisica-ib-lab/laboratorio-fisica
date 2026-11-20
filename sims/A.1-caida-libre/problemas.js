/* Simulación A.1 · Caída libre: generador de problemas con datos al azar. Sin pantalla (también lo usan las pruebas).
   Lo usan «Plantear problemas» (datos con signo → ecuación → resultado) y «Practicar».

   Convención: arriba +, s se mide desde el punto de salida, a = −9,81 m s⁻² (Cuadernillo de datos).
   Ecuaciones del Cuadernillo (aceleración uniforme), con la magnitud que NO aparece en cada una:
     0) s = (u + v)t / 2   (sin a)     1) v = u + at   (sin s)
     2) s = ut + ½at²      (sin v)     3) v² = u² + 2as (sin t)

   Cada problema: { id, grupo, termino, texto, figura, papeles {s,u,v,a,t: 'dato'|'incognita'|'no'}, completo {s,u,v,a,t}
     (los cinco valores reales del movimiento, sacados del modelo), incognita, respuesta, unidad, raiz (si la ecuación es
     de segundo grado), pista, resolucion, avisos {magnitud: pista si se equivoca en esa fila}, medir(PF) }.
   La respuesta es completo[incognita]; las pruebas comprueban que las cuatro ecuaciones se cumplen con «completo». */

(function (raiz) {
  'use strict';
  const G = 9.81;
  const azar = (a) => a[Math.floor(Math.random() * a.length)];
  const entre = (min, max, paso) => { const n = Math.round((max - min) / paso); return Math.round((min + paso * Math.floor(Math.random() * (n + 1))) * 1e6) / 1e6; };
  const mezclar = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const n = (x, d) => { const r = Math.abs(x) < 0.5 * Math.pow(10, -d) ? 0 : x; return (r < 0 ? '−' : '') + Math.abs(r).toFixed(d).replace('.', ','); };
  const c3 = (x) => { if (x === 0) return '0'; const e = Math.floor(Math.log10(Math.abs(x))); return n(x, Math.max(0, 2 - e)); };
  const v = (x) => `<span class="var">${x}</span>`;
  const paso = (l) => '<ol class="pasos">' + l.map(x => `<li>${x}</li>`).join('') + '</ol>';
  const MAG = ['s', 'u', 'v', 'a', 't'];
  const UNIDAD = { s: 'm', u: 'm s⁻¹', v: 'm s⁻¹', a: 'm s⁻²', t: 's' };
  const NOMBRE = { s: 'desplazamiento', u: 'velocidad inicial', v: 'velocidad final', a: 'aceleración', t: 'tiempo' };
  const ECUACIONES = [
    { html: `${v('s')} = (${v('u')} + ${v('v')})${v('t')} / 2`, mags: ['s', 'u', 'v', 't'], falta: 'a' },
    { html: `${v('v')} = ${v('u')} + ${v('at')}`, mags: ['v', 'u', 'a', 't'], falta: 's' },
    { html: `${v('s')} = ${v('ut')} + ½${v('at')}²`, mags: ['s', 'u', 'a', 't'], falta: 'v' },
    { html: `${v('v')}² = ${v('u')}² + 2${v('as')}`, mags: ['v', 'u', 'a', 's'], falta: 't' }
  ];
  // Las cuatro ecuaciones con los cinco valores (para las pruebas): devuelve los residuos relativos
  function residuos(c) {
    const esc = Math.max(1, Math.abs(c.s), c.u * c.u, c.v * c.v, Math.abs(c.u), Math.abs(c.v));
    return [c.s - (c.u + c.v) * c.t / 2, c.v - (c.u + c.a * c.t), c.s - (c.u * c.t + 0.5 * c.a * c.t * c.t), c.v * c.v - (c.u * c.u + 2 * c.a * c.s)].map(r => Math.abs(r) / esc);
  }
  // Ecuaciones válidas: contienen la incógnita y todas sus otras magnitudes son datos
  const validas = (P) => ECUACIONES.map((e, i) => i).filter(i => ECUACIONES[i].mags.includes(P.incognita) && ECUACIONES[i].mags.every(m => m === P.incognita || P.papeles[m] === 'dato'));

  // Avisos frecuentes al marcar datos
  const AV = {
    aSigno: `Con arriba +, la aceleración de la gravedad apunta hacia abajo: ${v('a')} = −9,81 m s⁻².`,
    sAbajo: `${v('s')} es el desplazamiento desde el punto de salida: si la bola termina más abajo, ${v('s')} es negativo.`,
    sArriba: `${v('s')} es el desplazamiento desde el punto de salida: si termina más arriba, ${v('s')} es positivo.`,
    uSoltar: `«Se suelta» o «se deja caer» significa que parte del reposo: ${v('u')} = 0 es un dato, aunque no aparezca un número.`,
    uAbajo: `Se lanza hacia abajo: con arriba +, ${v('u')} es negativa.`,
    vCima: `En el punto más alto la velocidad es cero: ${v('v')} = 0 es un dato, aunque el enunciado no lo diga.`,
    vNo: `El enunciado no da la velocidad final ni la pide: no interviene.`,
    tNo: `El enunciado no da el tiempo ni lo pide: no interviene.`
  };

  const PF = () => (typeof module !== 'undefined' && module.exports) ? require('../../comun/proyectil.js') : raiz.ProyectilFisica;

  const PLANTILLAS = {
    tCaida() {
      const h = entre(1, 20, 0.5), t = Math.sqrt(2 * h / G);
      return { grupo: 'caida', termino: 'Calcula', texto: `Se deja caer una bola desde ${n(h, 1)} m de altura. Calcula el tiempo que tarda en llegar al suelo.`,
        figura: { modo: 'caida', h, u: 0 }, papeles: { s: 'dato', u: 'dato', v: 'no', a: 'dato', t: 'incognita' },
        completo: { s: -h, u: 0, v: -G * t, a: -G, t }, incognita: 't', raiz: 'positiva',
        avisos: { s: AV.sAbajo, u: AV.uSoltar, v: AV.vNo, a: AV.aSigno },
        pista: `Con ${v('u')} = 0: ${v('s')} = ½${v('at')}² ⇒ ${v('t')} = √(2${v('s')}/${v('a')}). Ojo: ${v('s')} y ${v('a')} son negativos.`,
        resolucion: paso([`Datos (arriba +): ${v('s')} = −${n(h, 1)} m, ${v('u')} = 0, ${v('a')} = −9,81 m s⁻²`, `${v('s')} = ${v('ut')} + ½${v('at')}² ⇒ −${n(h, 1)} = ½(−9,81)${v('t')}²`, `${v('t')} = √(2 × ${n(h, 1)} / 9,81) = <b>${c3(t)} s</b>`]),
        medir: (P) => new P.Proyectil(h, 0, 90).duracion };
    },
    vLlegada() {
      const h = entre(1, 20, 0.5), vf = -Math.sqrt(2 * G * h), t = Math.sqrt(2 * h / G);
      return { grupo: 'caida', termino: 'Calcula', texto: `Se deja caer una bola desde ${n(h, 1)} m de altura. Calcula su velocidad (con signo, arriba +) justo antes de llegar al suelo.`,
        figura: { modo: 'caida', h, u: 0 }, papeles: { s: 'dato', u: 'dato', v: 'incognita', a: 'dato', t: 'no' },
        completo: { s: -h, u: 0, v: vf, a: -G, t }, incognita: 'v', raiz: 'negativa',
        avisos: { s: AV.sAbajo, u: AV.uSoltar, t: AV.tNo, a: AV.aSigno },
        pista: `${v('v')}² = ${v('u')}² + 2${v('as')} da dos raíces: la bola baja, así que la velocidad es negativa.`,
        resolucion: paso([`Datos: ${v('s')} = −${n(h, 1)} m, ${v('u')} = 0, ${v('a')} = −9,81 m s⁻²`, `${v('v')}² = 0 + 2(−9,81)(−${n(h, 1)}) = ${c3(2 * G * h)} m² s⁻²`, `Baja ⇒ raíz negativa: ${v('v')} = <b>${c3(vf)} m s⁻¹</b>`]),
        medir: (P) => { const p = new P.Proyectil(h, 0, 90); return p.vy(p.duracion); } };
    },
    hMax() {
      const u = entre(2, 20, 0.5), s = u * u / (2 * G);
      return { grupo: 'subida', termino: 'Calcula', texto: `Se lanza una bola verticalmente hacia arriba con ${n(u, 1)} m s⁻¹. Calcula la altura máxima que alcanza sobre el punto de lanzamiento.`,
        figura: { modo: 'subida', h: 0.3, u }, papeles: { s: 'incognita', u: 'dato', v: 'dato', a: 'dato', t: 'no' },
        completo: { s, u, v: 0, a: -G, t: u / G }, incognita: 's',
        avisos: { v: AV.vCima, t: AV.tNo, a: AV.aSigno, u: `Se lanza hacia arriba: ${v('u')} es positiva.` },
        pista: `En el punto más alto ${v('v')} = 0. Usa la ecuación que no tiene ${v('t')}.`,
        resolucion: paso([`Datos: ${v('u')} = +${n(u, 1)} m s⁻¹, ${v('v')} = 0 (punto más alto), ${v('a')} = −9,81 m s⁻²`, `${v('v')}² = ${v('u')}² + 2${v('as')} ⇒ 0 = ${c3(u * u)} + 2(−9,81)${v('s')}`, `${v('s')} = ${c3(u * u)} / 19,62 = <b>${c3(s)} m</b>`]),
        medir: (P) => { const p = new P.Proyectil(0.3, u, 90); return p.alturaMax() - 0.3; } };
    },
    tSubida() {
      const u = entre(2, 20, 0.5), t = u / G;
      return { grupo: 'subida', termino: 'Calcula', texto: `Se lanza una bola verticalmente hacia arriba con ${n(u, 1)} m s⁻¹. Calcula el tiempo que tarda en llegar al punto más alto.`,
        figura: { modo: 'subida', h: 0.3, u }, papeles: { s: 'no', u: 'dato', v: 'dato', a: 'dato', t: 'incognita' },
        completo: { s: u * u / (2 * G), u, v: 0, a: -G, t }, incognita: 't',
        avisos: { v: AV.vCima, s: 'El enunciado no da la altura ni la pide: no interviene.', a: AV.aSigno, u: `Se lanza hacia arriba: ${v('u')} es positiva.` },
        pista: `En el punto más alto ${v('v')} = 0. La ecuación sin ${v('s')} es ${v('v')} = ${v('u')} + ${v('at')}.`,
        resolucion: paso([`Datos: ${v('u')} = +${n(u, 1)} m s⁻¹, ${v('v')} = 0, ${v('a')} = −9,81 m s⁻²`, `${v('v')} = ${v('u')} + ${v('at')} ⇒ 0 = ${n(u, 1)} − 9,81${v('t')}`, `${v('t')} = ${n(u, 1)} / 9,81 = <b>${c3(t)} s</b>`]),
        medir: (P) => new P.Proyectil(0.3, u, 90).tCumbre };
    },
    tVuelo() {
      const u = entre(2, 15, 0.5), h = entre(1, 20, 0.5), t = (u + Math.sqrt(u * u + 2 * G * h)) / G;
      return { grupo: 'subida', termino: 'Calcula', texto: `Desde lo alto de un edificio de ${n(h, 1)} m se lanza una bola verticalmente hacia arriba con ${n(u, 1)} m s⁻¹. Calcula el tiempo que tarda en llegar al suelo.`,
        figura: { modo: 'subida', h, u }, papeles: { s: 'dato', u: 'dato', v: 'no', a: 'dato', t: 'incognita' },
        completo: { s: -h, u, v: u - G * t, a: -G, t }, incognita: 't', raiz: 'positiva',
        avisos: { s: `Termina en el suelo, ${n(h, 1)} m por debajo del punto de salida: ${v('s')} = −${n(h, 1)} m (no cuenta lo que sube primero).`, v: AV.vNo, a: AV.aSigno, u: `Se lanza hacia arriba: ${v('u')} es positiva.` },
        pista: `${v('s')} = ${v('ut')} + ½${v('at')}² es una ecuación de segundo grado en ${v('t')}: una raíz es negativa y no tiene sentido físico.`,
        resolucion: paso([`Datos: ${v('s')} = −${n(h, 1)} m, ${v('u')} = +${n(u, 1)} m s⁻¹, ${v('a')} = −9,81 m s⁻²`, `−${n(h, 1)} = ${n(u, 1)}${v('t')} − 4,905${v('t')}² ⇒ 4,905${v('t')}² − ${n(u, 1)}${v('t')} − ${n(h, 1)} = 0`,
          `${v('t')} = (${n(u, 1)} ± √(${c3(u * u)} + ${c3(2 * G * h)})) / 9,81; la raíz positiva: <b>${c3(t)} s</b>`]),
        medir: (P) => new P.Proyectil(h, u, 90).duracion };
    },
    vAbajo() {
      const w = entre(1, 10, 0.5), h = entre(1, 20, 0.5), vf = -Math.sqrt(w * w + 2 * G * h);
      return { grupo: 'abajo', termino: 'Calcula', texto: `Desde una altura de ${n(h, 1)} m se lanza una bola verticalmente hacia abajo con ${n(w, 1)} m s⁻¹. Calcula su velocidad (con signo, arriba +) al llegar al suelo.`,
        figura: { modo: 'subida', h, u: -w }, papeles: { s: 'dato', u: 'dato', v: 'incognita', a: 'dato', t: 'no' },
        completo: { s: -h, u: -w, v: vf, a: -G, t: (-w - vf) / G }, incognita: 'v', raiz: 'negativa',
        avisos: { s: AV.sAbajo, u: AV.uAbajo, t: AV.tNo, a: AV.aSigno },
        pista: `${v('u')} = −${n(w, 1)} m s⁻¹ (hacia abajo). En ${v('v')}² = ${v('u')}² + 2${v('as')}, la bola sigue bajando: toma la raíz negativa.`,
        resolucion: paso([`Datos: ${v('s')} = −${n(h, 1)} m, ${v('u')} = −${n(w, 1)} m s⁻¹, ${v('a')} = −9,81 m s⁻²`, `${v('v')}² = ${c3(w * w)} + 2(−9,81)(−${n(h, 1)}) = ${c3(w * w + 2 * G * h)} m² s⁻²`, `Baja ⇒ ${v('v')} = <b>${c3(vf)} m s⁻¹</b>`]),
        medir: (P) => { const p = new P.Proyectil(h, -w, 90); return p.vy(p.duracion); } };
    },
    gPlaneta() {
      const pl = azar([['la Luna', 1.62], ['Marte', 3.71], ['Mercurio', 3.70], ['Venus', 8.87], ['Júpiter', 24.8]]);
      const d = entre(1, 3, 0.1), t0 = Math.sqrt(2 * d / pl[1]);
      const e = Math.floor(Math.log10(t0)), t = Math.round(t0 / Math.pow(10, e - 2)) * Math.pow(10, e - 2);   // medida con 3 c.s.
      const a = -2 * d / (t * t);
      return { grupo: 'planetas', termino: 'Determina', texto: `En ${pl[0]}, un astronauta deja caer una herramienta desde ${n(d, 1)} m de altura y tarda ${c3(t)} s en llegar al suelo. Determina la aceleración de caída libre allí (con signo, arriba +).`,
        figura: null, papeles: { s: 'dato', u: 'dato', v: 'no', a: 'incognita', t: 'dato' },
        completo: { s: -d, u: 0, v: a * t, a, t }, incognita: 'a',
        avisos: { s: AV.sAbajo, u: AV.uSoltar, v: AV.vNo, t: 'El tiempo es un dato del enunciado.' },
        pista: `Con ${v('u')} = 0: ${v('s')} = ½${v('at')}² ⇒ ${v('a')} = 2${v('s')}/${v('t')}². Como ${v('s')} < 0, ${v('a')} sale negativa.`,
        resolucion: paso([`Datos: ${v('s')} = −${n(d, 1)} m, ${v('u')} = 0, ${v('t')} = ${c3(t)} s`, `${v('s')} = ½${v('at')}² ⇒ ${v('a')} = 2${v('s')}/${v('t')}² = 2(−${n(d, 1)}) / ${c3(t)}²`, `${v('a')} = <b>${c3(a)} m s⁻²</b> (el valor tabulado en ${pl[0]} es ${n(pl[1], 2)} m s⁻² hacia abajo; la diferencia viene del redondeo del tiempo)`]),
        medir: () => -pl[1], tolMedir: 0.012 };
    },
    vEnT() {
      const u = entre(4, 20, 0.5), tc = u / G, t = Math.round(entre(0.2, 2 * tc * 0.95, 0.1) * 10) / 10 || 0.2, vt = u - G * t;
      return { grupo: 'subida', termino: 'Calcula', texto: `Se lanza una bola verticalmente hacia arriba con ${n(u, 1)} m s⁻¹. Calcula su velocidad (con signo, arriba +) ${n(t, 1)} s después del lanzamiento.`,
        figura: { modo: 'subida', h: 0.3, u }, papeles: { s: 'no', u: 'dato', v: 'incognita', a: 'dato', t: 'dato' },
        completo: { s: u * t - 0.5 * G * t * t, u, v: vt, a: -G, t }, incognita: 'v',
        avisos: { s: 'El enunciado no da el desplazamiento ni lo pide: no interviene.', a: AV.aSigno, u: `Se lanza hacia arriba: ${v('u')} es positiva.`, t: 'El tiempo es un dato del enunciado.' },
        pista: `${v('v')} = ${v('u')} + ${v('at')}. Si el resultado es negativo, la bola ya está bajando.`,
        resolucion: paso([`Datos: ${v('u')} = +${n(u, 1)} m s⁻¹, ${v('a')} = −9,81 m s⁻², ${v('t')} = ${n(t, 1)} s`, `${v('v')} = ${n(u, 1)} + (−9,81)(${n(t, 1)})`, `${v('v')} = <b>${c3(vt)} m s⁻¹</b> ${vt < 0 ? '(negativa: ya está bajando)' : '(positiva: todavía sube)'}`]),
        medir: (P) => new P.Proyectil(0.3, u, 90).vy(t) };
    },
    segundoInstante() {
      for (;;) {
        const u = entre(5, 20, 0.5), H = u * u / (2 * G), y = Math.round(entre(0.2, 0.85, 0.05) * H * 10) / 10;
        if (y < 0.3) continue;
        const r = Math.sqrt(u * u - 2 * G * y), t1 = (u - r) / G, t2 = (u + r) / G;
        return { grupo: 'subida', termino: 'Calcula', texto: `Se lanza una bola verticalmente hacia arriba con ${n(u, 1)} m s⁻¹. Pasa dos veces a ${n(y, 1)} m por encima del punto de lanzamiento. Calcula el instante en que pasa por segunda vez (bajando).`,
          figura: { modo: 'subida', h: 0.3, u }, papeles: { s: 'dato', u: 'dato', v: 'no', a: 'dato', t: 'incognita' },
          completo: { s: y, u, v: -r, a: -G, t: t2 }, incognita: 't', raiz: 'mayor',
          avisos: { s: AV.sArriba, v: AV.vNo, a: AV.aSigno, u: `Se lanza hacia arriba: ${v('u')} es positiva.` },
          pista: `${v('s')} = ${v('ut')} + ½${v('at')}² tiene dos raíces positivas: la menor es al subir y la mayor, al bajar.`,
          resolucion: paso([`Datos: ${v('s')} = +${n(y, 1)} m, ${v('u')} = +${n(u, 1)} m s⁻¹, ${v('a')} = −9,81 m s⁻²`, `4,905${v('t')}² − ${n(u, 1)}${v('t')} + ${n(y, 1)} = 0 ⇒ ${v('t')} = ${c3(t1)} s o ${c3(t2)} s`, `Al bajar, la mayor: <b>${c3(t2)} s</b>`]),
          medir: (P) => new P.Proyectil(0.3, u, 90).crucesAltura(0.3 + y)[1] };
      }
    },
    sEnT() {
      const t = entre(0.2, 2, 0.1), s = -0.5 * G * t * t;
      return { grupo: 'caida', termino: 'Calcula', texto: `Se deja caer una bola desde lo alto de un acantilado. Calcula su desplazamiento (con signo, arriba +) ${n(t, 1)} s después de soltarla.`,
        figura: null, papeles: { s: 'incognita', u: 'dato', v: 'no', a: 'dato', t: 'dato' },
        completo: { s, u: 0, v: -G * t, a: -G, t }, incognita: 's',
        avisos: { u: AV.uSoltar, v: AV.vNo, a: AV.aSigno, t: 'El tiempo es un dato del enunciado.' },
        pista: `${v('s')} = ${v('ut')} + ½${v('at')}² con ${v('u')} = 0 y ${v('a')} negativa: el desplazamiento sale negativo.`,
        resolucion: paso([`Datos: ${v('u')} = 0, ${v('a')} = −9,81 m s⁻², ${v('t')} = ${n(t, 1)} s`, `${v('s')} = 0 + ½(−9,81)(${n(t, 1)})²`, `${v('s')} = <b>${c3(s)} m</b> (${c3(-s)} m por debajo del punto de salida)`]),
        medir: (P) => { const p = new P.Proyectil(100, 0, 90); return p.y(t) - 100; } };
    }
  };

  // ---------- Solo en Practicar ----------
  const EXTRA = {
    puerta() {
      const L = azar([1, 1.5, 2, 2.5, 3]), h = entre(0.2, 1.5, 0.05);       // cm de tarjeta; caída hasta la puerta (m)
      // tiempo exacto en que la tarjeta (de L cm) tapa la puerta: el borde inferior llega a la puerta tras caer h y el superior tras h + L
      const Lm = L / 100, dt0 = Math.sqrt(2 * (h + Lm) / G) - Math.sqrt(2 * h / G);
      const e = Math.floor(Math.log10(dt0)), dt = Math.round(dt0 / Math.pow(10, e - 2)) * Math.pow(10, e - 2);
      const vm = Lm / dt, hEst = vm * vm / (2 * G);
      // con aceleración uniforme, la velocidad media en un intervalo es la instantánea en su instante medio:
      // v²/2g es exactamente la caída hasta la mitad del tiempo de paso (algo más que hasta el borde de la tarjeta)
      const t1 = Math.sqrt(2 * h / G), t2 = Math.sqrt(2 * (h + Lm) / G), hMedio = 0.5 * G * Math.pow((t1 + t2) / 2, 2);
      return { grupo: 'puerta', termino: 'Determina', texto: `Una bola con una tarjeta de ${n(L, 1)} cm se suelta desde el reposo sobre una puerta fotoeléctrica. La tarjeta tapa la puerta durante ${c3(dt * 1000)} ms. Determina, aproximadamente, cuánto había caído la bola mientras pasaba por la puerta.`,
        figura: { modo: 'caida', h: Math.min(2, h + 0.4), u: 0, puerta: 0.4 }, unidad: 'm', respuesta: hEst, tol: 0.03,
        pista: `La puerta mide una velocidad media: ${v('v')} ≈ (ancho de la tarjeta) / Δ${v('t')}. Luego, desde el reposo, ${v('v')}² = 2${v('g')}${v('h')}. Pasa los cm a m y los ms a s.`,
        resolucion: paso([`${v('v')} ≈ ${n(Lm, 3)} m / ${c3(dt)} s = ${c3(vm)} m s⁻¹ (velocidad media mientras pasa la tarjeta)`, `${v('v')}² = 2${v('g')}${v('h')} ⇒ ${v('h')} = ${v('v')}² / 2${v('g')} = <b>${c3(hEst)} m</b>`,
          `Con aceleración uniforme, la velocidad media en un intervalo es la velocidad en su instante medio: ${c3(hEst)} m es lo que había caído a mitad del paso de la tarjeta (hasta su borde inferior, ${c3(h)} m).`]),
        medir: () => hMedio, tolMedir: 0.025 };
    },
    explica() {
      const q = azar(EXPLICA);
      return Object.assign({ grupo: 'explica', termino: 'Explica', figura: q.figura || null }, q, { opciones: mezclar(q.opciones) });
    }
  };
  const EXPLICA = [
    { texto: 'Una bola lanzada hacia arriba llega a su punto más alto. Explica cuánto vale su aceleración en ese instante.', figura: { modo: 'subida', h: 0.3, u: 4 },
      opciones: [['−9,81 m s⁻²: la gravedad sigue actuando aunque la velocidad sea cero.', true],
        ['Cero, porque la bola está quieta en ese instante.', false, 'Estar quieto un instante no es lo mismo que no acelerar. Si a fuera cero, ¿por qué empezaría a bajar? Mira la gráfica v–t: su pendiente no cambia.'],
        ['Cambia de signo: primero era negativa y ahora es positiva.', false, 'La que cambia de signo es la velocidad. La aceleración es −9,81 m s⁻² todo el tiempo.']],
      explicacion: 'Sin resistencia del aire la única fuerza es el peso: a = −g en todo el vuelo, también en el punto más alto, donde solo la velocidad vale cero.' },
    { texto: 'Se dejan caer a la vez, desde la misma altura y sin resistencia del aire, una bola de acero de 1 kg y otra de 0,1 kg. Explica cuál llega antes.', figura: { modo: 'caida', h: 1.5, u: 0 },
      opciones: [['Llegan a la vez: sin aire, todas caen con la misma aceleración g.', true],
        ['La de 1 kg, porque pesa más.', false, 'Pesa diez veces más, pero también tiene diez veces más masa: a = F/m = g en las dos.'],
        ['La de 0,1 kg, porque es más ligera.', false, 'Sin resistencia del aire la masa no influye: las dos aceleran con g.']],
      explicacion: 'El peso es proporcional a la masa (mg), así que la aceleración mg/m = g es la misma para las dos.' },
    { texto: 'Una bola se lanza hacia arriba y vuelve a la mano. Explica cómo son el tiempo de subida y el de bajada (sin resistencia del aire).', figura: { modo: 'subida', h: 0.3, u: 4 },
      opciones: [['Iguales: el movimiento es simétrico porque la aceleración es la misma al subir y al bajar.', true],
        ['La subida es más lenta porque la gravedad la frena.', false, 'Al bajar la gravedad acelera igual de fuerte. Mira la gráfica s–t: es una parábola simétrica.'],
        ['La bajada es más rápida porque la gravedad ayuda.', false, 'Sube frenando con g y baja acelerando con g: tarda lo mismo. Compara los tiempos en la simulación.']],
      explicacion: 'Con a constante, la v–t es una recta que pasa por cero en la cumbre: la bola tarda lo mismo en perder la velocidad que en recuperarla, y vuelve con la misma rapidez.' },
    { texto: 'Se marca la posición de una bola soltada desde el reposo cada 0,1 s. Explica cómo son las distancias recorridas en intervalos sucesivos.', figura: { modo: 'caida', h: 1.5, u: 0 },
      opciones: [['Crecen como 1 : 3 : 5 : 7…, porque la velocidad aumenta de manera uniforme.', true],
        ['Son iguales, porque los intervalos de tiempo son iguales.', false, 'Eso pasaría con velocidad constante. Activa las huellas en Explorar: ¿están igual de separadas?'],
        ['Se duplican en cada intervalo: 1 : 2 : 4 : 8…', false, 'Desde el reposo, s = ½gt² crece con t²: las distancias acumuladas son 1, 4, 9, 16… y las de cada intervalo, 1, 3, 5, 7…']],
      explicacion: 's = ½gt²: las posiciones a 1, 2, 3… intervalos son proporcionales a 1, 4, 9…; las diferencias, a 1, 3, 5…' },
    { texto: 'Una bola lanzada hacia arriba pasa por el mismo punto al subir y al bajar. Explica cómo son sus velocidades en ese punto.', figura: { modo: 'subida', h: 0.3, u: 4 },
      opciones: [['Misma rapidez y sentidos opuestos: v y −v.', true],
        ['Iguales, con el mismo signo.', false, 'Al subir va hacia arriba y al bajar, hacia abajo: con arriba +, las velocidades tienen signos opuestos.'],
        ['Al bajar es menor, porque ha perdido energía.', false, 'Sin resistencia del aire no pierde energía: v² = u² + 2as da la misma rapidez para la misma altura.']],
      explicacion: 'v² = u² + 2as: para el mismo s, v² es el mismo; las dos raíces, +|v| al subir y −|v| al bajar.' },
    { texto: 'En un experimento real con una pluma y una bola de acero soltadas a la vez, la bola llega mucho antes. Explica por qué.', figura: null,
      opciones: [['Por la resistencia del aire, que afecta mucho más a la pluma que a la bola.', true],
        ['Porque la bola tiene más masa y la gravedad la atrae con más aceleración.', false, 'La gravedad da la misma aceleración a todas las masas. En el vacío caerían a la vez (se ha hecho en la Luna).'],
        ['Porque la pluma flota en el aire como en un líquido.', false, 'El empuje del aire es muy pequeño. Lo que frena a la pluma es el arrastre, que depende de su forma y de su rapidez.']],
      explicacion: 'Sin aire caerían a la vez. Con aire, el arrastre es comparable al peso de la pluma (llega pronto a una velocidad terminal pequeña) y despreciable para la bola de acero.' }
  ];

  const GRUPOS = [['todos', 'Todos'], ['caida', 'Caída desde el reposo'], ['subida', 'Lanzamiento hacia arriba'], ['abajo', 'Lanzamiento hacia abajo'], ['planetas', 'Otros planetas'], ['puerta', 'Puerta fotoeléctrica'], ['explica', 'Explica']];
  const GRUPO_DE = { tCaida: 'caida', vLlegada: 'caida', sEnT: 'caida', hMax: 'subida', tSubida: 'subida', tVuelo: 'subida', vEnT: 'subida', segundoInstante: 'subida', vAbajo: 'abajo', gPlaneta: 'planetas', puerta: 'puerta', explica: 'explica' };

  function completar(id, P) {
    P.id = id; P.tol = P.tol || 0.02;
    if (P.papeles) { P.respuesta = P.completo[P.incognita]; P.unidad = UNIDAD[P.incognita]; P.validas = validas(P); }
    return P;
  }
  function plantear(id) { return completar(id, PLANTILLAS[id]()); }
  function generar(id) { return completar(id, (PLANTILLAS[id] || EXTRA[id])()); }
  const LISTA_PLANTEAR = Object.keys(PLANTILLAS), LISTA = LISTA_PLANTEAR.concat(Object.keys(EXTRA));
  function aleatorio(lista, filtro, anterior) {
    const ok = lista.filter(t => !filtro || filtro === 'todos' || GRUPO_DE[t] === filtro);
    const otros = ok.filter(t => t !== anterior || ok.length === 1 || t === 'explica');
    return generar((otros.length ? otros : ok)[Math.floor(Math.random() * (otros.length ? otros : ok).length)]);
  }

  const api = { G, MAG, UNIDAD, NOMBRE, ECUACIONES, PLANTILLAS, EXTRA, EXPLICA, GRUPOS, GRUPO_DE, LISTA, LISTA_PLANTEAR, residuos, validas, plantear, generar, aleatorio, c3, n };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else raiz.ProblemasCaida = api;
})(this);
