/* Cinemática exacta por tramos con aceleración uniforme.
   Un movimiento = posición inicial s0, velocidad inicial u y una lista de tramos {duracion, a}.
   s y v son continuas; a es constante dentro de cada tramo.
   Sirve para el nivel 1 (un tramo con a = 0) y para los niveles siguientes (aceleración y tramos). */

(function (raiz) {
  function Movimiento(s0, u, tramos) {
    this.s0 = s0;
    this.u = u;
    this.tramos = [];
    let t = 0, s = s0, v = u;
    for (const tr of tramos) {
      const T = tr.duracion, a = tr.a;
      this.tramos.push({ t0: t, t1: t + T, s0: s, v0: v, a: a });
      s = s + v * T + 0.5 * a * T * T;
      v = v + a * T;
      t = t + T;
    }
    this.duracion = t;
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
    return tr.s0 + tr.v0 * dt + 0.5 * tr.a * dt * dt;
  };

  Movimiento.prototype.v = function (t) {
    t = this.limitar(t);
    const tr = this.tramos[this.indice(t)];
    return tr.v0 + tr.a * (t - tr.t0);
  };

  Movimiento.prototype.a = function (t) {
    return this.tramos[this.indice(this.limitar(t))].a;
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
      const pos = (x) => tr.s0 + tr.v0 * (x - tr.t0) + 0.5 * tr.a * (x - tr.t0) * (x - tr.t0);
      const cortes = [tr.t0];
      if (tr.a !== 0) {
        const tc = tr.t0 - tr.v0 / tr.a; // instante en que v = 0
        if (tc > tr.t0 && tc < fin) cortes.push(tc);
      }
      cortes.push(fin);
      for (let i = 0; i + 1 < cortes.length; i++) d += Math.abs(pos(cortes[i + 1]) - pos(cortes[i]));
    }
    return d;
  };

  // Valores extremos de s en [0, duración] (para escalar ejes y comprobar la pista).
  Movimiento.prototype.rangoS = function () {
    let min = this.s0, max = this.s0;
    for (const tr of this.tramos) {
      const candidatos = [tr.t0, tr.t1];
      if (tr.a !== 0) {
        const tc = tr.t0 - tr.v0 / tr.a;
        if (tc > tr.t0 && tc < tr.t1) candidatos.push(tc);
      }
      for (const x of candidatos) { const s = this.s(x); if (s < min) min = s; if (s > max) max = s; }
    }
    return [min, max];
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
