/* Cinemática exacta por tramos con aceleración uniforme.
   Un movimiento = posición inicial s0, velocidad inicial u y una lista de tramos {duracion, a}.
   s y v son continuas; a es constante dentro de cada tramo.
   Sirve para el nivel 1 (un tramo con a = 0) y para los niveles siguientes (aceleración y tramos).
   Un tramo puede traer «v»: la velocidad cambia de golpe a ese valor al empezar el tramo. Es la idealización
   de las gráficas s–t hechas de rectas (solo se usa en ejercicios de ese tipo); s sigue siendo continua.
   Un tramo puede traer «j» (m s⁻³): la aceleración cambia de forma uniforme dentro del tramo, a(τ) = a + jτ
   (aceleración NO uniforme; v cuadrática y s cúbica, también exactas). */

(function (raiz) {
  function Movimiento(s0, u, tramos) {
    this.s0 = s0;
    this.u = u;
    this.tramos = [];
    let t = 0, s = s0, v = u;
    this.conSaltos = false;
    for (const tr of tramos) {
      const T = tr.duracion, a = tr.a, j = tr.j || 0;
      const salto = tr.v !== undefined;
      if (salto) { if (tr.v !== v) this.conSaltos = true; v = tr.v; }
      this.tramos.push({ t0: t, t1: t + T, s0: s, v0: v, a: a, j: j, salto: salto });
      if (j) this.noUniforme = true;
      s = s + v * T + 0.5 * a * T * T + j * T * T * T / 6;
      v = v + a * T + 0.5 * j * T * T;
      t = t + T;
    }
    this.duracion = t;
  }

  const sTramo = (tr, d) => tr.s0 + tr.v0 * d + 0.5 * tr.a * d * d + tr.j * d * d * d / 6;
  const vTramo = (tr, d) => tr.v0 + tr.a * d + 0.5 * tr.j * d * d;
  // Instantes (absolutos, estrictamente dentro de (t0, fin)) en que v = 0 dentro del tramo
  function cerosV(tr, fin) {
    const r = [];
    if (tr.j === 0) { if (tr.a !== 0) r.push(-tr.v0 / tr.a); }
    else {
      const A = 0.5 * tr.j, B = tr.a, C = tr.v0, disc = B * B - 4 * A * C;
      if (disc >= 0) { const q = Math.sqrt(disc); r.push((-B - q) / (2 * A), (-B + q) / (2 * A)); }
    }
    return r.map(d => tr.t0 + d).filter(x => x > tr.t0 && x < fin).sort((x, y) => x - y);
  }

  // Tramo que contiene el instante t (en un límite entre tramos, el que empieza en t).
  Movimiento.prototype.indice = function (t) {
    const n = this.tramos.length;
    if (t <= 0) return 0;
    for (let i = 0; i < n; i++) if (t < this.tramos[i].t1) return i;
    return n - 1;
  };

  Movimiento.prototype.limitar = function (t) {
    return Math.min(Math.max(t, 0), this.duracion);
  };

  Movimiento.prototype.s = function (t) {
    t = this.limitar(t);
    const tr = this.tramos[this.indice(t)], dt = t - tr.t0;
    return sTramo(tr, dt);
  };

  Movimiento.prototype.v = function (t) {
    t = this.limitar(t);
    const tr = this.tramos[this.indice(t)];
    return vTramo(tr, t - tr.t0);
  };

  Movimiento.prototype.a = function (t) {
    t = this.limitar(t);
    const tr = this.tramos[this.indice(t)];
    return tr.a + tr.j * (t - tr.t0);
  };

  Movimiento.prototype.desplazamiento = function (t) {
    return this.s(t) - this.s0;
  };

  // Distancia recorrida desde 0 hasta t: suma de |Δs| separando donde v cambia de signo.
  Movimiento.prototype.distancia = function (t) {
    t = this.limitar(t);
    let d = 0;
    for (const tr of this.tramos) {
      if (tr.t0 >= t) break;
      const fin = Math.min(tr.t1, t);
      const pos = (x) => sTramo(tr, x - tr.t0);
      const cortes = [tr.t0].concat(cerosV(tr, fin));   // instantes en que v = 0
      cortes.push(fin);
      for (let i = 0; i + 1 < cortes.length; i++) d += Math.abs(pos(cortes[i + 1]) - pos(cortes[i]));
    }
    return d;
  };

  // Valores extremos de s en [0, duración] (para escalar ejes y comprobar la pista).
  Movimiento.prototype.rangoS = function () {
    let min = this.s0, max = this.s0;
    for (const tr of this.tramos) {
      const candidatos = [tr.t0, tr.t1].concat(cerosV(tr, tr.t1));
      for (const x of candidatos) { const s = this.s(x); if (s < min) min = s; if (s > max) max = s; }
    }
    return [min, max];
  };

  // Primer instante (> 0) en que la posición sale del intervalo [min, max]; null si nunca sale.
  // Solo para tramos con aceleración uniforme (j = 0), que son los únicos que la usan.
  Movimiento.prototype.primerCruce = function (min, max) {
    for (const tr of this.tramos) {
      const T = tr.t1 - tr.t0;
      let mejor = null;
      for (const [L, sentido] of [[min, -1], [max, 1]]) {
        const c = tr.s0 - L, raices = [];
        if (tr.a === 0) { if (tr.v0 !== 0) raices.push(-c / tr.v0); }
        else {
          const disc = tr.v0 * tr.v0 - 2 * tr.a * c;
          if (disc > 0) { const r = Math.sqrt(disc); raices.push((-tr.v0 - r) / tr.a, (-tr.v0 + r) / tr.a); }
        }
        for (const d of raices) {
          if (d < -1e-12 || d > T + 1e-12) continue;
          const v = tr.v0 + tr.a * d;                 // debe ir hacia fuera en ese instante
          if (v * sentido <= 1e-12) continue;
          const dd = Math.max(0, d);
          if (mejor === null || dd < mejor) mejor = dd;
        }
      }
      if (mejor !== null) return tr.t0 + mejor;
    }
    return null;
  };

  // Copia del movimiento que termina en el instante t.
  Movimiento.prototype.recortar = function (t) {
    const defs = [];
    for (const tr of this.tramos) {
      if (tr.t0 >= t) break;
      const d = { duracion: Math.min(tr.t1, t) - tr.t0, a: tr.a, j: tr.j };
      if (tr.salto) d.v = tr.v0;
      defs.push(d);
    }
    const m = new Movimiento(this.s0, this.u, defs);
    m.recortado = true;
    return m;
  };

  // Formato español: coma decimal y signo menos tipográfico.
  function numero(x, decimales) {
    if (decimales === undefined) decimales = 1;
    let r = Math.abs(x) < 0.5 * Math.pow(10, -decimales) ? 0 : x;
    let txt = Math.abs(r).toFixed(decimales).replace('.', ',');
    // espacio de miles
    const partes = txt.split(',');
    partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    txt = partes.join(',');
    return (r < 0 ? '−' : '') + txt;
  }

  const api = { Movimiento: Movimiento, numero: numero };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else raiz.Cinematica = api;
})(this);
