/* Dinámica: leyes de Newton con las fuerzas de A.2 (peso, normal, rozamiento, tensión, fuerza elástica,
   empuje y arrastre viscoso). Sin pantalla: lo usan la simulación y las pruebas (node).

   Modelos del Cuadernillo de datos:  F = ma · F_f ≤ μs F_N · F_f = μd F_N · F_H = −kx · F_b = ρVg · F_d = 6πηrv · g = 9,81 m s⁻²
   Supuestos: cuerdas ideales (sin masa, inextensibles), poleas sin masa ni rozamiento, μd independiente de la rapidez
   y del área, sin resistencia del aire (salvo el líquido de la escena de la esfera).

   Ejes del dibujo: x a la derecha +, y hacia arriba +. Cada escena usa además una coordenada «x» a lo largo
   del movimiento (se indica en cada una). Las fuerzas se guardan como vectores {x, y} en newtons.

   El rozamiento se resuelve así en cada paso:
     · si el cuerpo se mueve: F_f = μd F_N en contra de la velocidad;
     · si está en reposo: F_f es la fuerza que hace falta para seguir en reposo, siempre que no supere μs F_N;
       si la supera, empieza a deslizar con F_f = μd F_N en contra de la fuerza que lo empuja.
     · al llegar a v = 0 se detiene exactamente en ese instante y se vuelve a evaluar el caso estático
       (el bloque frenado por el rozamiento no retrocede). */

(function (raiz) {
  'use strict';
  const G = 9.81;
  const RAD = Math.PI / 180;
  const H = 1e-4;              // paso de integración (s)
  const DS = 0.01;             // separación entre muestras guardadas (s)

  /* ---------- Integrador en una dimensión con rozamiento seco ----------
     o = { M, D(t), N(t), mus, mud, x0, v0, xmin, xmax, T }
     D: fuerza neta sin el rozamiento, a lo largo de x. N: normal de la superficie con rozamiento. */
  function rozamiento(v, D, N, mus, mud) {
    if (v !== 0) return { Ff: -Math.sign(v) * mud * N, quieto: false };
    if (Math.abs(D) <= mus * N + 1e-12) return { Ff: -D, quieto: true };
    return { Ff: -Math.sign(D) * mud * N, quieto: false };
  }
  function integrar(o) {
    const pasos = Math.round(DS / H);
    const m = { t: [], x: [], v: [], a: [], Ff: [], quieto: [] };
    let x = o.x0, v = o.v0, t = 0, fin = null;
    const guardar = () => {
      const D = o.D(t), N = o.N(t), r = rozamiento(v, D, N, o.mus, o.mud);
      m.t.push(t); m.x.push(x); m.v.push(v); m.a.push((D + r.Ff) / o.M); m.Ff.push(r.Ff); m.quieto.push(r.quieto);
    };
    guardar();
    const nMuestras = Math.round(o.T / DS);
    fuera:
    for (let k = 1; k <= nMuestras; k++) {
      for (let i = 0; i < pasos; i++) {
        let h = H;
        // el paso usa las fuerzas del comienzo del paso (D y N cambian poco o a saltos en múltiplos de H)
        let D = o.D(t), N = o.N(t), r = rozamiento(v, D, N, o.mus, o.mud), a = (D + r.Ff) / o.M;
        let xn = x + v * h + 0.5 * a * h * h, vn = v + a * h;
        if (v !== 0 && Math.sign(vn) !== Math.sign(v)) {
          // se detiene dentro del paso: llega exactamente a v = 0 y se vuelve a evaluar
          const tz = -v / a;
          x = x + v * tz + 0.5 * a * tz * tz; v = 0;
          const r2 = rozamiento(0, D, N, o.mus, o.mud), a2 = (D + r2.Ff) / o.M, resto = h - tz;
          xn = x + 0.5 * a2 * resto * resto; vn = a2 * resto;
        }
        if (xn > o.xmax || xn < o.xmin) {
          // llega al tope: se termina el experimento en ese instante
          const lim = xn > o.xmax ? o.xmax : o.xmin;
          let tl = h * (lim - x) / (xn - x);
          tl = Math.max(0, Math.min(h, tl));
          v = v + a * tl; x = lim; t += tl;
          fin = { t, motivo: 'tope' };
          break fuera;
        }
        x = xn; v = vn; t = Math.round((t + h) * 1e9) / 1e9;
      }
      guardar();
    }
    if (fin) guardar();
    return { m, T: fin ? fin.t : o.T, fin };
  }
  /* Estado en el instante t: se parte de la muestra anterior y se avanza con su aceleración (deteniéndose
     exactamente en v = 0 si el rozamiento lo frena, como en el integrador). El rozamiento y la aceleración se
     recalculan con las fuerzas de ese mismo instante: así ΣF = ma se cumple exactamente en cualquier t. */
  function leerEn(r, o, t) {
    const m = r.m, n = m.t.length;
    let i;
    if (t <= 0) i = 0;
    else if (t >= m.t[n - 1]) i = n - 1;
    else {
      i = Math.min(n - 2, Math.floor(t / DS));
      while (i > 0 && m.t[i] > t) i--;
      while (i < n - 2 && m.t[i + 1] <= t) i++;
    }
    let x = m.x[i], v = m.v[i];
    const dt = Math.max(0, t - m.t[i]), a0 = m.a[i];
    if (dt > 0) {
      if (v !== 0 && Math.sign(v + a0 * dt) !== Math.sign(v)) {
        const tz = -v / a0, tt = m.t[i] + tz;
        x += v * tz + 0.5 * a0 * tz * tz; v = 0;
        const D2 = o.D(tt), r2 = rozamiento(0, D2, o.N(tt), o.mus, o.mud), a2 = (D2 + r2.Ff) / o.M, resto = dt - tz;
        x += 0.5 * a2 * resto * resto; v = a2 * resto;
      } else { x += v * dt + 0.5 * a0 * dt * dt; v += a0 * dt; }
      x = Math.max(o.xmin, Math.min(o.xmax, x));
    }
    if (Math.abs(v) < 1e-12) v = 0;
    const D = o.D(t), N = o.N(t), rz = rozamiento(v, D, N, o.mus, o.mud);
    const Ff = Math.abs(rz.Ff) < 1e-15 ? 0 : rz.Ff;
    return { x, v, a: (D + Ff) / o.M, Ff, quieto: rz.quieto && v === 0 };
  }
  function integrarYLeer(o) { const r = integrar(o); r.en = (t) => leerEn(r, o, t); return r; }

  const vec = (x, y) => ({ x, y });
  const fuerza = (tipo, x, y, por, sobre, punto) => ({ tipo, x, y, mod: Math.hypot(x, y), por, sobre, punto: punto || 'centro' });

  /* ---------- Escenas ----------
     Cada una devuelve { escena, par, T, fin, muestras, estado(t) }.
     estado(t) = { t, x, v, a, cuerpos: [{ id, nombre, m, fuerzas: [...], a: {x, y} }], lecturas: {...} } */

  // 1. Bloque sobre una mesa horizontal, tirado por un dinamómetro (fuerza elástica F_H) con ángulo θ sobre la horizontal.
  //    x: a lo largo de la mesa, derecha +. Modos: «constante», «rampa» (F crece de 0 a Fmax en 6 s) y «soltar» (F hasta 1 s).
  //    u: velocidad inicial (hacia la derecha), para la primera ley y la velocidad constante con rozamiento.
  const K_DINAMOMETRO = 200;            // N m⁻¹
  const RAMPA = 6, SOLTAR = 1;
  function horizontal(par) {
    const { m, mus, mud, F, ang, modo } = par;
    const th = ang * RAD, c = Math.cos(th), s = Math.sin(th);
    const Fde = (t) => modo === 'rampa' ? Math.min(F, F * t / RAMPA) : modo === 'soltar' ? (t < SOLTAR - 1e-9 ? F : 0) : F;
    const T = modo === 'rampa' ? 8 : 5;
    const N = (t) => m * G - Fde(t) * s;
    const r = integrarYLeer({ M: m, D: (t) => Fde(t) * c, N, mus, mud, x0: 0, v0: par.u || 0, xmin: -0.01, xmax: 2.4, T });
    return {
      escena: 'horizontal', par, T: r.T, fin: r.fin, muestras: r.m, Fde,
      estado(t) {
        t = Math.max(0, Math.min(t, r.T));
        const e = r.en(t), Fh = Fde(t), FN = N(t);
        return {
          t, x: e.x, v: e.v, a: e.a, quieto: e.quieto,
          cuerpos: [{ id: 'bloque', nombre: 'el bloque', m, a: vec(e.a, 0), fuerzas: [
            fuerza('Fg', 0, -m * G, 'la Tierra', 'el bloque'),
            fuerza('FN', 0, FN, 'la mesa', 'el bloque', 'base'),
            fuerza('Ff', e.Ff, 0, 'la mesa', 'el bloque', 'base'),
            fuerza('FH', Fh * c, Fh * s, 'el resorte del dinamómetro', 'el bloque', 'gancho')
          ].filter(f => f.mod > 1e-9 || f.tipo === 'Fg') }],
          lecturas: { dinamometro: Fh, alargamiento: Fh / K_DINAMOMETRO, FN, Ff: Math.abs(e.Ff), limiteEstatico: mus * FN, Fneta: m * e.a }
        };
      }
    };
  }

  // 2. Plano inclinado que sube hacia la derecha. x: a lo largo del plano, hacia arriba del plano +.
  //    El bloque sale desde abajo con velocidad u hacia arriba, o desde arriba en reposo si u = 0.
  const LARGO_PLANO = 2;
  function plano(par) {
    const { m, ang, mus, mud, u } = par;
    const th = ang * RAD, c = Math.cos(th), s = Math.sin(th);
    const x0 = u > 0 ? 0.25 : 1.6;
    const r = integrarYLeer({ M: m, D: () => -m * G * s, N: () => m * G * c, mus, mud, x0, v0: u, xmin: 0, xmax: LARGO_PLANO, T: 5 });
    return {
      escena: 'plano', par, T: r.T, fin: r.fin, muestras: r.m, x0, largo: LARGO_PLANO,
      estado(t) {
        t = Math.max(0, Math.min(t, r.T));
        const e = r.en(t), FN = m * G * c;
        return {
          t, x: e.x, v: e.v, a: e.a, quieto: e.quieto,
          cuerpos: [{ id: 'bloque', nombre: 'el bloque', m, a: vec(e.a * c, e.a * s), fuerzas: [
            fuerza('Fg', 0, -m * G, 'la Tierra', 'el bloque'),
            fuerza('FN', -FN * s, FN * c, 'el plano', 'el bloque', 'base'),
            fuerza('Ff', e.Ff * c, e.Ff * s, 'el plano', 'el bloque', 'base')
          ].filter(f => f.mod > 1e-9 || f.tipo !== 'Ff') }],
          lecturas: { FN, Ff: Math.abs(e.Ff), limiteEstatico: mus * FN, paralela: m * G * s, perpendicular: m * G * c, Fneta: m * e.a,
            anguloLimite: Math.atan(mus) / RAD }
        };
      }
    };
  }

  // 3. Persona sobre una balanza en un ascensor. x: altura del ascensor, arriba +. La aceleración la impone el cable.
  //    Modos: «constante» (a durante 4 s, desde el reposo), «subir» y «bajar» (arranca 1,5 s, velocidad constante 2 s, frena 1,5 s).
  function ascensor(par) {
    const { m, a: A, modo } = par;
    let tramos;
    if (modo === 'subir') tramos = [[1.5, A], [2, 0], [1.5, -A]];
    else if (modo === 'bajar') tramos = [[1.5, -A], [2, 0], [1.5, A]];
    else tramos = [[4, Math.max(-G, A)]];
    const ini = []; let tt = 0, x = 0, v = 0;
    for (const [d, a] of tramos) { ini.push({ t0: tt, x0: x, v0: v, a, t1: tt + d }); x += v * d + 0.5 * a * d * d; v += a * d; tt += d; }
    const T = tt;
    const tramo = (t) => { for (const q of ini) if (t < q.t1 - 1e-12) return q; return ini[ini.length - 1]; };
    const muestras = { t: [], x: [], v: [], a: [] };
    const est = (t) => { const q = tramo(t), d = t - q.t0; return { x: q.x0 + q.v0 * d + 0.5 * q.a * d * d, v: q.v0 + q.a * d, a: q.a }; };
    for (let i = 0; i <= Math.round(T / DS); i++) { const t = i * DS, e = est(Math.min(t, T)); muestras.t.push(t); muestras.x.push(e.x); muestras.v.push(e.v); muestras.a.push(e.a); }
    return {
      escena: 'ascensor', par, T, fin: null, muestras,
      estado(t) {
        t = Math.max(0, Math.min(t, T));
        const e = est(t), FN = m * (G + e.a);
        return {
          t, x: e.x, v: Math.abs(e.v) < 1e-12 ? 0 : e.v, a: e.a,
          cuerpos: [{ id: 'persona', nombre: 'la persona', m, a: vec(0, e.a), fuerzas: [
            fuerza('Fg', 0, -m * G, 'la Tierra', 'la persona'),
            fuerza('FN', 0, FN, 'la balanza', 'la persona', 'base')
          ].filter(f => f.mod > 1e-9 || f.tipo === 'Fg') }],
          lecturas: { balanza: FN, peso: m * G, Fneta: m * e.a }
        };
      }
    };
  }

  // 4. Máquina de Atwood: m₁ a la izquierda, m₂ a la derecha. x: lo que baja m₂ (y sube m₁). Polea colgada de un dinamómetro.
  const RECORRIDO_ATWOOD = 0.6;
  function atwood(par) {
    const { m1, m2 } = par;
    const r = integrarYLeer({ M: m1 + m2, D: () => (m2 - m1) * G, N: () => 0, mus: 0, mud: 0, x0: 0, v0: 0, xmin: -RECORRIDO_ATWOOD, xmax: RECORRIDO_ATWOOD, T: 3 });
    return {
      escena: 'atwood', par, T: r.T, fin: r.fin, muestras: r.m, recorrido: RECORRIDO_ATWOOD,
      estado(t) {
        t = Math.max(0, Math.min(t, r.T));
        const e = r.en(t), FT = m1 * (G + e.a);
        return {
          t, x: e.x, v: e.v, a: e.a,
          cuerpos: [
            { id: 'm1', nombre: 'la masa m₁', m: m1, a: vec(0, e.a), fuerzas: [
              fuerza('Fg', 0, -m1 * G, 'la Tierra', 'la masa m₁'), fuerza('FT', 0, FT, 'la cuerda', 'la masa m₁', 'arriba')] },
            { id: 'm2', nombre: 'la masa m₂', m: m2, a: vec(0, -e.a), fuerzas: [
              fuerza('Fg', 0, -m2 * G, 'la Tierra', 'la masa m₂'), fuerza('FT', 0, FT, 'la cuerda', 'la masa m₂', 'arriba')] }
          ],
          lecturas: { FT, polea: 2 * FT, pesoTotal: (m1 + m2) * G, Fneta: (m1 + m2) * e.a }
        };
      }
    };
  }

  // 5. Bloque m₁ sobre la mesa unido por una cuerda, a través de una polea en el borde derecho, a una masa colgante m₂.
  //    x: lo que avanza el bloque hacia la polea (= lo que baja m₂).
  const RECORRIDO_MESA = 0.9;
  function mesa(par) {
    const { m1, m2, mus, mud } = par;
    const r = integrarYLeer({ M: m1 + m2, D: () => m2 * G, N: () => m1 * G, mus, mud, x0: 0, v0: 0, xmin: -0.01, xmax: RECORRIDO_MESA, T: 4 });
    return {
      escena: 'mesa', par, T: r.T, fin: r.fin, muestras: r.m, recorrido: RECORRIDO_MESA,
      estado(t) {
        t = Math.max(0, Math.min(t, r.T));
        const e = r.en(t), FT = m2 * (G - e.a);
        return {
          t, x: e.x, v: e.v, a: e.a, quieto: e.quieto,
          cuerpos: [
            { id: 'm1', nombre: 'el bloque', m: m1, a: vec(e.a, 0), fuerzas: [
              fuerza('Fg', 0, -m1 * G, 'la Tierra', 'el bloque'),
              fuerza('FN', 0, m1 * G, 'la mesa', 'el bloque', 'base'),
              fuerza('Ff', e.Ff, 0, 'la mesa', 'el bloque', 'base'),
              fuerza('FT', FT, 0, 'la cuerda', 'el bloque', 'gancho')].filter(f => f.mod > 1e-9 || f.tipo === 'Fg') },
            { id: 'm2', nombre: 'la masa colgante', m: m2, a: vec(0, -e.a), fuerzas: [
              fuerza('Fg', 0, -m2 * G, 'la Tierra', 'la masa colgante'), fuerza('FT', 0, FT, 'la cuerda', 'la masa colgante', 'arriba')] }
          ],
          lecturas: { FT, pesoColgante: m2 * G, FN: m1 * G, Ff: Math.abs(e.Ff), limiteEstatico: mus * m1 * G, Fneta: (m1 + m2) * e.a }
        };
      }
    };
  }

  // 6. Cuerpo colgado de dos cuerdas sujetas al techo. Ángulos θ₁ y θ₂ medidos desde la horizontal (el techo).
  //    Equilibrio: T₁ cos θ₁ = T₂ cos θ₂ ; T₁ sen θ₁ + T₂ sen θ₂ = mg.
  function cuerdas(par) {
    const { m, ang1, ang2 } = par;
    const a1 = ang1 * RAD, a2 = ang2 * RAD, den = Math.sin(a1 + a2);
    const T1 = m * G * Math.cos(a2) / den, T2 = m * G * Math.cos(a1) / den;
    const muestras = { t: [0, 1], x: [0, 0], v: [0, 0], a: [0, 0] };
    return {
      escena: 'cuerdas', par, T: 0, fin: null, muestras, estatica: true,
      estado() {
        return {
          t: 0, x: 0, v: 0, a: 0,
          cuerpos: [{ id: 'cuerpo', nombre: 'el cuerpo', m, a: vec(0, 0), fuerzas: [
            fuerza('Fg', 0, -m * G, 'la Tierra', 'el cuerpo'),
            fuerza('FT', -T1 * Math.cos(a1), T1 * Math.sin(a1), 'la cuerda 1', 'el cuerpo', 'arriba'),
            fuerza('FT', T2 * Math.cos(a2), T2 * Math.sin(a2), 'la cuerda 2', 'el cuerpo', 'arriba')] }],
          lecturas: { T1, T2, peso: m * G, Fneta: 0 }
        };
      }
    };
  }

  // 7. Esfera que cae desde el reposo en un líquido viscoso (totalmente sumergida desde el principio).
  //    m dv/dt = mg − ρ_f V g − 6πηr v  →  v = v_t (1 − e^(−t/τ)), τ = m / (6πηr), v_t = 2r²(ρ_s − ρ_f)g / 9η.
  //    x: lo que ha bajado, abajo +. (Modelo del Cuadernillo: no se incluye la «masa añadida» del líquido.)
  const LIQUIDOS = {
    glicerina: { nombre: 'glicerina', rho: 1260, eta: 1.41 },
    ricino: { nombre: 'aceite de ricino', rho: 960, eta: 0.99 }
  };
  const MATERIALES = { acero: { nombre: 'acero', rho: 7800 }, vidrio: { nombre: 'vidrio', rho: 2500 } };
  const TUBO = 0.40;                     // m de líquido por debajo del punto de salida
  function esfera(par) {
    const r = par.r / 1000, liq = LIQUIDOS[par.liquido], mat = MATERIALES[par.material];
    const V = 4 / 3 * Math.PI * r * r * r, m = mat.rho * V, Fb = liq.rho * V * G, b = 6 * Math.PI * liq.eta * r;
    const tau = m / b, vt = (m * G - Fb) / b;
    const x = (t) => vt * (t - tau * (1 - Math.exp(-t / tau)));
    // instante en que llega al fondo (Newton sobre x(t) = TUBO)
    let T = TUBO / vt + tau;
    for (let i = 0; i < 50; i++) T -= (x(T) - TUBO) / (vt * (1 - Math.exp(-T / tau)));
    const n = 400, muestras = { t: [], x: [], v: [], a: [] };
    // muestras más densas al principio (el régimen transitorio dura unos pocos τ)
    for (let i = 0; i <= n; i++) {
      const f = i / n, t = Math.min(T, f < 0.5 ? 10 * tau * (f / 0.5) : 10 * tau + (T - 10 * tau) * ((f - 0.5) / 0.5));
      if (i && t <= muestras.t[muestras.t.length - 1]) continue;
      muestras.t.push(t); muestras.x.push(x(t)); muestras.v.push(vt * (1 - Math.exp(-t / tau))); muestras.a.push(vt / tau * Math.exp(-t / tau));
    }
    const Re = liq.rho * vt * 2 * r / liq.eta;
    return {
      escena: 'esfera', par, T, fin: null, muestras, tau, vt, m, V, Fb, Re, liquido: liq, material: mat, tubo: TUBO,
      estado(t) {
        t = Math.max(0, Math.min(t, T));
        const v = vt * (1 - Math.exp(-t / tau)), a = vt / tau * Math.exp(-t / tau), Fd = b * v;
        return {
          t, x: x(t), v, a,
          // la esfera baja: en el dibujo la aceleración y la velocidad apuntan hacia −y
          cuerpos: [{ id: 'esfera', nombre: 'la esfera', m, a: vec(0, -a), fuerzas: [
            fuerza('Fg', 0, -m * G, 'la Tierra', 'la esfera'),
            fuerza('Fb', 0, Fb, 'el líquido', 'la esfera'),
            fuerza('Fd', 0, Fd, 'el líquido', 'la esfera')].filter(f => f.mod > 1e-12 || f.tipo !== 'Fd') }],
          lecturas: { peso: m * G, Fb, Fd, Fneta: m * a, vt, tau, Re }
        };
      }
    };
  }

  const ESCENAS = { horizontal, plano, ascensor, atwood, mesa, cuerdas, esfera };
  function crear(escena, par) { return ESCENAS[escena](par); }

  const api = { G, RAD, H, DS, crear, integrar, rozamiento, K_DINAMOMETRO, RAMPA, SOLTAR, LIQUIDOS, MATERIALES, LARGO_PLANO };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else raiz.Dinamica = api;
})(this);
