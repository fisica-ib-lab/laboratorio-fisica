/* Simulación A.2 · Construir: corrector del diagrama de cuerpo libre. Sin pantalla (también lo usan las pruebas).
   flechas: [{ id, tipo, ang }] con tipo 'Fg'…'Fd' o 'x:<distractor>'; ángulos en grados (0° derecha, 90° arriba).
   Orden de la corrección (se informa del primer problema; las flechas implicadas se marcan):
   1. fuerzas que no existen o no van en el diagrama; 2. fuerzas que sobran o están repetidas;
   3. fuerzas que faltan (pista gradual según el intento); 4. direcciones (tolerancia ±10°);
   5. longitudes: la suma de las flechas (cada una con su longitud L) debe comportarse como la fuerza neta:
      · si el cuerpo está en equilibrio, las flechas se compensan: |ΣL| ≤ 25 % de la flecha más larga;
      · si acelera, la suma apunta hacia la aceleración (componente ≥ 8 % de la más larga) y en la dirección
        perpendicular se compensan (≤ 25 %). Así, por ejemplo, F_N tiene que ser más corta que F_g en el ascensor que baja. */

(function (raiz) {
  'use strict';
  const TOL = 10, TOL_EQ = 0.25, MIN_PAR = 0.08;
  const angulo = (x, y) => Math.round(Math.atan2(y, x) * 180 / Math.PI * 100) / 100;
  const dif = (a, b) => { let d = Math.abs(((a - b) % 360 + 360) % 360); return d > 180 ? 360 - d : d; };
  const F = (sub) => `<span class="var">F</span><sub>${sub}</sub>`;
  const SUB = { Fg: 'g', FN: 'N', Ff: 'f', FT: 'T', FH: 'H', Fb: 'b', Fd: 'd' };

  function datos() { return (typeof module !== 'undefined' && module.exports) ? require('./construir-datos.js') : raiz.ConstruirDatos; }

  // Fuerzas correctas: del modelo en el instante t (o dadas a mano si la situación no tiene modelo)
  function esperadas(s, D) {
    if (s.modelo === false) return s.fuerzas.map(f => Object.assign({ mod: 1 }, f));
    const e = D.crear(s.escena, s.par).estado(s.t);
    return e.cuerpos[s.cuerpo].fuerzas.filter(f => f.mod > 1e-12).map(f => ({ tipo: f.tipo, ang: angulo(f.x, f.y), mod: f.mod, x: f.x, y: f.y }));
  }

  // Empareja flechas y fuerzas del mismo tipo minimizando la desviación total (como mucho dos de cada tipo)
  function emparejar(puestas, esp) {
    if (!puestas.length || !esp.length) return [];
    if (puestas.length === 1 || esp.length === 1) {
      // la flecha que mejor encaja con cada fuerza esperada
      const pares = [];
      const usadas = new Set();
      for (const e of esp) {
        let mejor = null;
        for (const p of puestas) if (!usadas.has(p.id) && (!mejor || dif(p.ang, e.ang) < dif(mejor.ang, e.ang))) mejor = p;
        if (mejor) { usadas.add(mejor.id); pares.push([mejor, e]); }
      }
      return pares;
    }
    const [a, b] = puestas, [x, y] = esp;
    return dif(a.ang, x.ang) + dif(b.ang, y.ang) <= dif(a.ang, y.ang) + dif(b.ang, x.ang) ? [[a, x], [b, y]] : [[a, y], [b, x]];
  }

  function corregir(s, flechas, intento, D) {
    const C = datos(), esp = esperadas(s, D);
    // 1. distractores
    const falsas = flechas.filter(f => f.tipo.startsWith('x:'));
    if (falsas.length) {
      const d = C.DISTRACTORES[falsas[0].tipo.slice(2)];
      return { bien: false, marcadas: falsas.map(f => f.id), mensaje: `<b>«${d.texto}» no va en el diagrama.</b> ${d.comentario}` };
    }
    const tipos = [...new Set(flechas.map(f => f.tipo).concat(esp.map(f => f.tipo)))];
    // 2. sobran
    for (const t of tipos) {
      const puestas = flechas.filter(f => f.tipo === t), e = esp.filter(f => f.tipo === t);
      if (puestas.length > e.length) {
        const usadas = new Set(emparejar(puestas, e).map(p => p[0].id));
        const sobrantes = puestas.filter(p => !usadas.has(p.id));
        const msj = e.length ? `Hay ${puestas.length} flechas de ${C.NOMBRE[t]} (${F(SUB[t])}) y solo ${e.length === 1 ? 'actúa una' : 'actúan ' + e.length}: cada interacción se dibuja una sola vez.`
          : (s.sobra && s.sobra[t]) || `Sobra ${C.NOMBRE[t]} (${F(SUB[t])}). ¿Qué cuerpo la ejercería? Cada fuerza del diagrama tiene que tener un responsable que toque o atraiga al cuerpo.`;
        return { bien: false, marcadas: sobrantes.map(f => f.id), mensaje: `<b>Sobra una fuerza.</b> ${msj}` };
      }
    }
    // 3. faltan
    const faltan = [];
    for (const t of tipos) { const n = esp.filter(f => f.tipo === t).length - flechas.filter(f => f.tipo === t).length; for (let i = 0; i < n; i++) faltan.push(t); }
    if (faltan.length) {
      const t = faltan[0];
      let pista;
      if (t === 'Ff' && s.faltaFf && intento >= 2) pista = s.faltaFf;
      else if (intento <= 1) pista = faltan.length > 1 ? `Faltan ${faltan.length} fuerzas.` : 'Falta una fuerza.';
      else if (intento === 2) pista = C.CONTACTO[t] ? 'Falta una fuerza de contacto: repasa qué cuerpos tocan al que estudias.' : 'Falta una fuerza que actúa a distancia, sin contacto.';
      else pista = `Falta ${C.NOMBRE[t]} (${F(SUB[t])}).`;
      return { bien: false, marcadas: [], mensaje: `<b>Todavía no.</b> ${pista}` };
    }
    // 4. direcciones (y se guarda la dirección correcta de cada flecha para juzgar después solo su longitud)
    const dirCorrecta = {};
    for (const t of tipos) {
      for (const [p, e] of emparejar(flechas.filter(f => f.tipo === t), esp.filter(f => f.tipo === t))) {
        if (dif(p.ang, e.ang) > TOL) return { bien: false, marcadas: [p.id], mensaje: `<b>La dirección de ${C.NOMBRE[t]} (${F(SUB[t])}) no es correcta.</b> ${C.DIRECCION[t]}` };
        dirCorrecta[p.id] = e.ang;
      }
    }
    // 5. longitudes
    const L = (f) => (f.L === undefined ? 1 : f.L);
    const Lmax = Math.max(...flechas.map(L));
    let Rx = 0, Ry = 0;
    // cada longitud a lo largo de la dirección correcta: el pequeño error de ángulo ya admitido no cuenta aquí
    for (const f of flechas) { const a = dirCorrecta[f.id] * Math.PI / 180; Rx += L(f) * Math.cos(a); Ry += L(f) * Math.sin(a); }
    let Nx = 0, Ny = 0, Fmax = 0;
    if (s.modelo === false) { Nx = Math.cos(s.neta * Math.PI / 180); Ny = Math.sin(s.neta * Math.PI / 180); Fmax = 1; }
    else for (const f of esp) { Nx += f.x; Ny += f.y; Fmax = Math.max(Fmax, f.mod); }
    const Nm = Math.hypot(Nx, Ny), todas = flechas.map(f => f.id);
    if (Nm < 0.03 * Fmax) {
      if (Math.hypot(Rx, Ry) > TOL_EQ * Lmax) return { bien: false, marcadas: todas, mensaje: `<b>Las fuerzas son las correctas, pero sus longitudes no cuadran.</b> El cuerpo está ${s.equilibrio || 'en equilibrio'}: la fuerza neta es cero, así que las flechas deben compensarse. Arrastra las puntas para ajustar las longitudes.` };
    } else {
      const ux = Nx / Nm, uy = Ny / Nm, par = Rx * ux + Ry * uy, perp = Math.abs(-Rx * uy + Ry * ux);
      if (par < MIN_PAR * Lmax) return { bien: false, marcadas: todas, mensaje: `<b>Las fuerzas son las correctas, pero sus longitudes no cuadran.</b> El cuerpo acelera ${s.haciaA}: la suma de las flechas tiene que apuntar hacia allí. ¿Qué flecha debe ser más larga que la otra?` };
      if (perp > TOL_EQ * Lmax) return { bien: false, marcadas: todas, mensaje: `<b>Las fuerzas son las correctas, pero sus longitudes no cuadran.</b> En la dirección perpendicular a la aceleración no hay aceleración: ahí las flechas deben compensarse.` };
    }
    return { bien: true, marcadas: [], mensaje: `<b>¡Correcto!</b> ${s.explica.replace(/F_([a-zA-Z]+)/g, (_, x) => F(x))}` };
  }

  const api = { esperadas, corregir, angulo, dif, TOL, TOL_EQ, MIN_PAR };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else raiz.ConstruirCorrector = api;
})(this);
