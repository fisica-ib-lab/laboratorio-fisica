/* A.1 · Caída libre — nivel 4 «Medir g» (sin pantalla).
   Medidas con puerta fotoeléctrica: distancia caída s (regla, ±0,002 m) y tiempo t (±0,003 s; el tiempo medido
   tiene una dispersión aleatoria pequeña, como en el laboratorio). Linealización: s = ½g t² ⇒ s frente a t² es una
   recta de pendiente m = g/2 que pasa por el origen. Se ajusta por mínimos cuadrados y la incertidumbre de la
   pendiente sale de las rectas de pendiente máxima y mínima que pasan por las barras de error del primer y del
   último punto (método del IB). g = 2m ± 2Δm. */
(function (raiz) {
  'use strict';
  const nodo = typeof module !== 'undefined' && module.exports;
  const { G } = nodo ? require('../../comun/proyectil.js') : raiz.ProyectilFisica;
  const DS = 0.002, DT = 0.003, SIGMA_T = 0.0012;

  function normal(r) { let u = 0, v = 0; while (u === 0) u = r(); v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

  // Una medida: la bola se suelta desde h y la puerta está en «puerta» (alturas sobre la mesa, m)
  function medir(r, h, puerta, sinRuido) {
    const s = Math.round((h - puerta) * 1000) / 1000;
    const real = Math.sqrt(2 * s / G);
    const t = Math.round((real + (sinRuido ? 0 : SIGMA_T * normal(r))) * 1000) / 1000;
    return { s, t };
  }

  // Ajuste de s frente a t²
  function ajuste(datos) {
    const pts = datos.map(d => ({ x: d.t * d.t, y: d.s, dx: 2 * d.t * DT, dy: DS })).sort((a, b) => a.x - b.x);
    const n = pts.length;
    if (n < 3 || pts[n - 1].x - pts[0].x < 1e-6) return null;
    let sx = 0, sy = 0, sxx = 0, sxy = 0;
    for (const p of pts) { sx += p.x; sy += p.y; sxx += p.x * p.x; sxy += p.x * p.y; }
    const den = n * sxx - sx * sx;
    const m = (n * sxy - sx * sy) / den, c = (sy - m * sx) / n;
    const a = pts[0], b = pts[n - 1];
    const mMax = ((b.y + b.dy) - (a.y - a.dy)) / ((b.x - b.dx) - (a.x + a.dx));
    const mMin = ((b.y - b.dy) - (a.y + a.dy)) / ((b.x + b.dx) - (a.x - a.dx));
    const dm = (mMax - mMin) / 2;
    return { pts, m, c, mMax, mMin, dm, g: 2 * m, dg: 2 * dm,
      lineaMax: { m: mMax, c: (a.y - a.dy) - mMax * (a.x + a.dx) },
      lineaMin: { m: mMin, c: (a.y + a.dy) - mMin * (a.x - a.dx) } };
  }

  // Valor ± incertidumbre al estilo IB: incertidumbre con 1 cifra significativa y el valor redondeado al mismo lugar
  function conIncertidumbre(x, dx) {
    const e = Math.floor(Math.log10(dx));
    let paso = Math.pow(10, e), d1 = Math.round(dx / paso);
    if (d1 >= 10) { paso *= 10; d1 = 1; }
    const dec = Math.max(0, -Math.round(Math.log10(paso)));
    const fmt = (v) => v.toFixed(dec).replace('.', ',').replace('-', '−');
    return { valor: fmt(Math.round(x / paso) * paso), inc: fmt(d1 * paso), dec };
  }

  const api = { DS, DT, SIGMA_T, medir, ajuste, conIncertidumbre, G };
  if (nodo) module.exports = api; else raiz.ExperimentoCaida = api;
})(typeof window !== 'undefined' ? window : globalThis);
