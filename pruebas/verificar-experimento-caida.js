/* Verifica el nivel 4 «Medir g» de caída libre (sims/A.1-caida-libre/experimento.js).
   Sin ruido el ajuste da g exacto; con ruido, la pendiente queda entre las rectas máxima y mínima y g ± Δg contiene 9,81
   en la gran mayoría de los experimentos; el formato valor ± incertidumbre sigue la regla del IB. */
'use strict';
const X = require('../sims/A.1-caida-libre/experimento.js');
let fallos = 0, n = 0; const ok = (c, m) => { n++; if (!c) { fallos++; if (fallos < 20) console.log('  ✗ ' + m); } };
let sem = 7; const r = () => { sem = (sem * 1103515245 + 12345) % 2147483648; return sem / 2147483648; };
const alturas = [0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4];
// sin ruido
{ const d = alturas.map(p => X.medir(r, 1.6, p, true)); const a = X.ajuste(d);
  ok(Math.abs(a.g - X.G) / X.G < 0.003, 'sin ruido: g ≈ 9,81 (' + a.g + ')'); ok(a.mMin < a.m && a.m < a.mMax, 'sin ruido: m entre las rectas'); }
let dentro = 0; const N = 2000;
for (let k = 0; k < N; k++) {
  const npt = 5 + Math.floor(r() * 3), d = [];
  for (let i = 0; i < npt; i++) d.push(X.medir(r, 1.6, alturas[i], false));
  const a = X.ajuste(d);
  ok(a && isFinite(a.g) && a.dg > 0, 'ajuste válido');
  ok(a.mMin <= a.mMax, 'mMin ≤ mMax');
  if (Math.abs(a.g - X.G) <= a.dg) dentro++;
  const f = X.conIncertidumbre(a.g, a.dg);
  ok(/^[1-9]$/.test(f.inc.replace(/[0,]/g, '')) && f.inc.replace(',', '').replace(/^0+/, '').length === 1, 'incertidumbre con 1 cifra: ' + f.inc);
  ok(f.valor.split(',')[1]?.length === f.inc.split(',')[1]?.length, 'mismos decimales: ' + f.valor + ' ± ' + f.inc);
}
ok(dentro / N > 0.9, `g ± Δg contiene 9,81 en el ${(100 * dentro / N).toFixed(1)} % (> 90 %)`);
ok(X.ajuste([X.medir(r, 1.6, 0.4, true), X.medir(r, 1.6, 0.4, true)]) === null, 'con menos de 3 medidas no hay ajuste');
console.log(`g ± Δg contiene 9,81 en el ${(100 * dentro / N).toFixed(1)} % de ${N} experimentos`);
console.log(`${n} comprobaciones, ${fallos} fallos`); process.exit(fallos ? 1 : 0);
