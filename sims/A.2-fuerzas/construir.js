/* Simulación A.2 · Construir.
   Reto 1: el alumno arrastra flechas desde un banco de fuerzas hasta el cuerpo aislado y las gira arrastrando la punta;
   las flechas salen del borde del cuerpo, alineadas con su centro. Corrige construir-corrector.js.
   Reto 2: parejas de tercera ley (quién la ejerce, sobre quién, tipo, sentido y módulo) y preguntas de opción. */

(function () {
  'use strict';
  const D = window.Dinamica, C = window.ConstruirDatos, K = window.ConstruirCorrector, Es = window.FuerzasEscena, Gr = window.Graficas;
  const { COL, LETRA, prepararLienzo, textoRico, medirRico, flecha, rectRedondo, pildora } = Gr;
  const $ = (id) => document.getElementById(id);
  const RAD = Math.PI / 180;
  const F = (sub) => `<span class="var">F</span><sub>${sub}</sub>`;
  const SUB = { Fg: 'g', FN: 'N', Ff: 'f', FT: 'T', FH: 'H', Fb: 'b', Fd: 'd' };
  const BANCO = [['Fg', 'peso'], ['FN', 'normal'], ['Ff', 'rozamiento'], ['FT', 'tensión'], ['FH', 'elástica (dinamómetro)'], ['Fb', 'empuje'], ['Fd', 'arrastre viscoso']];
  const GRIS = '#6B7785';

  /* ======================= Reto 1 ======================= */
  const r1 = { i: 0, flechas: {}, intentos: {}, estado: {}, sel: null, marcadas: [], mensaje: {}, sigId: 1, geo: null };
  const sit = () => C.SITUACIONES[r1.i];
  const lista = () => (r1.flechas[r1.i] = r1.flechas[r1.i] || []);

  // ---------- Banco ----------
  function pintarBanco() {
    const s = sit();
    const reales = BANCO.map(([t, n]) => `<button class="ficha" data-tipo="${t}" style="--c:${Es.FZ[t].color}"><span class="muestra-f"></span>${F(SUB[t])} <small>${n}</small></button>`);
    const falsas = C.SIEMPRE.concat(s.extra).map(d => `<button class="ficha falsa" data-tipo="x:${d}" style="--c:${GRIS}"><span class="muestra-f"></span><small>${C.DISTRACTORES[d].texto}</small></button>`);
    $('banco').innerHTML = reales.concat(falsas).join('');
    $('banco').querySelectorAll('.ficha').forEach(b => b.addEventListener('pointerdown', (e) => empezarArrastre(e, b.dataset.tipo)));
  }
  // arrastrar una ficha desde el banco: se suelta sobre la zona de trabajo (la dirección es la del punto donde se suelta)
  let fantasma = null;
  function empezarArrastre(e, tipo) {
    if (r1.estado[r1.i] === 'bien') return;
    e.preventDefault();
    const x0 = e.clientX, y0 = e.clientY;
    let movido = false;
    const mover = (ev) => {
      if (!movido && Math.hypot(ev.clientX - x0, ev.clientY - y0) > 6) {
        movido = true;
        fantasma = document.createElement('div');
        fantasma.className = 'fantasma';
        fantasma.innerHTML = tipo.startsWith('x:') ? C.DISTRACTORES[tipo.slice(2)].corto : F(SUB[tipo]);
        fantasma.style.setProperty('--c', tipo.startsWith('x:') ? GRIS : Es.FZ[tipo].color);
        document.body.appendChild(fantasma);
      }
      if (fantasma) { fantasma.style.left = ev.clientX + 'px'; fantasma.style.top = ev.clientY + 'px'; }
    };
    const soltar = (ev) => {
      window.removeEventListener('pointermove', mover); window.removeEventListener('pointerup', soltar); window.removeEventListener('pointercancel', soltar);
      if (fantasma) { fantasma.remove(); fantasma = null; }
      const r = $('cTrabajo').getBoundingClientRect();
      if (movido) {
        if (ev.clientX < r.left || ev.clientX > r.right || ev.clientY < r.top || ev.clientY > r.bottom || !r1.geo) return;
        const dx = ev.clientX - r.left - r1.geo.cx, dy = ev.clientY - r.top - r1.geo.cy;
        agregar(tipo, Math.hypot(dx, dy) < 4 ? 90 : ajustar(Math.atan2(-dy, dx) / RAD));
      } else agregar(tipo, libre());
    };
    window.addEventListener('pointermove', mover); window.addEventListener('pointerup', soltar); window.addEventListener('pointercancel', soltar);
  }
  const ajustar = (a) => { let r = Math.round(a / 5) * 5; if (r <= -180) r += 360; if (r > 180) r -= 360; return r; };
  // dirección libre para una ficha tocada (sin arrastrar): la primera que no esté ocupada
  function libre() {
    const usadas = lista().map(f => f.ang);
    for (const a of [90, 0, -90, 180, 45, 135, -45, -135]) if (!usadas.some(u => Math.abs(u - a) < 20)) return a;
    return 30;
  }
  function agregar(tipo, ang) {
    const f = { id: r1.sigId++, tipo, ang, L: 72 };
    lista().push(f);
    r1.sel = f.id; tocar();
    // en pantallas angostas la zona de trabajo puede quedar fuera de la vista: se lleva a la vista
    const r = $('cTrabajo').getBoundingClientRect();
    if (r.bottom < 60 || r.top > window.innerHeight - 60) $('cTrabajo').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function tocar() { r1.marcadas = []; r1.mensaje[r1.i] = null; pintarR1(); }

  // ---------- Geometría del cuerpo en la zona de trabajo ----------
  function geometria(w, h) {
    const s = sit(), cx = w / 2, cy = h / 2 + (s.contexto === 'cuerda' ? 14 : 0), k = Math.max(0.7, Math.min(1.3, Math.min(w / 460, h / 380)));
    if (s.forma === 'esfera') return { cx, cy, k, cuerpo: { cx, cy, r: 34 * k } };
    if (s.forma === 'persona') return { cx, cy, k, cuerpo: { cx, cy, w: 62 * k, h: 150 * k, ang: 0 } };
    if (s.forma === 'colgante') return { cx, cy, k, cuerpo: { cx, cy, w: 72 * k, h: 62 * k, ang: 0 } };
    const ang = s.contexto === 'plano' ? s.par.ang * RAD : 0;
    return { cx, cy, k, cuerpo: { cx, cy, w: 120 * k, h: 72 * k, ang } };
  }
  const punta = (f, g) => {
    const ux = Math.cos(f.ang * RAD), uy = -Math.sin(f.ang * RAD), [x0, y0] = Es.salida(g.cuerpo, ux, uy);
    return { x0, y0, x1: x0 + ux * f.L * g.k, y1: y0 + uy * f.L * g.k };
  };

  function dibujarContexto(ctx, w, h, g) {
    const s = sit(), c = g.cuerpo, k = g.k;
    ctx.save();
    ctx.strokeStyle = '#B8C3CF'; ctx.fillStyle = '#F3F5F8'; ctx.lineWidth = 2;
    const linea = (x1, y1, x2, y2) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
    if (s.contexto === 'mesa' || s.contexto === 'mesaCuerda' || s.contexto === 'carrito' || s.contexto === 'piso') {
      const yb = c.cy + c.h / 2;
      if (s.contexto === 'carrito') {
        rectRedondo(ctx, c.cx - 120 * k, yb, 240 * k, 26 * k, 4); ctx.fill(); ctx.stroke();
        for (const dx of [-80, 80]) { ctx.beginPath(); ctx.arc(c.cx + dx * k, yb + 34 * k, 10 * k, 0, 2 * Math.PI); ctx.fillStyle = '#FFF'; ctx.fill(); ctx.stroke(); }
      } else { ctx.fillRect(0, yb, w, 14); linea(0, yb, w, yb); }
      if (s.contexto === 'mesaCuerda') { ctx.setLineDash([6, 5]); linea(c.cx + c.w / 2, c.cy, w - 10, c.cy); }
    }
    if (s.contexto === 'plano') {
      const a = c.ang, ux = Math.cos(a), uy = -Math.sin(a), nx = -Math.sin(a), ny = -Math.cos(a);
      const bx = c.cx - nx * c.h / 2, by = c.cy - ny * c.h / 2, L = Math.max(w, h);
      ctx.beginPath(); ctx.moveTo(bx - ux * L, by - uy * L); ctx.lineTo(bx + ux * L, by + uy * L); ctx.lineTo(bx + ux * L, h + L); ctx.lineTo(bx - ux * L, h + L); ctx.closePath(); ctx.fill();
      linea(bx - ux * L, by - uy * L, bx + ux * L, by + uy * L);
    }
    if (s.contexto === 'cuerda') { ctx.setLineDash([6, 5]); linea(c.cx, c.cy - c.h / 2, c.cx, 0); }
    if (s.contexto === 'cuerdas') {
      ctx.setLineDash([6, 5]);
      for (const a of [180 - s.par.ang1, s.par.ang2]) linea(c.cx, c.cy, c.cx + Math.cos(a * RAD) * w, c.cy - Math.sin(a * RAD) * w);   // direcciones de las cuerdas, por el centro
    }
    if (s.contexto === 'liquido') { ctx.fillStyle = '#F7F0D6'; ctx.fillRect(0, 0, w, h); }
    ctx.restore();
    // indicaciones de movimiento
    if (s.id === 'soltado' || s.id === 'tirado' || s.id === 'bloqueMesa') pildora(ctx, [['v', true], [' →', false]], c.cx, c.cy - c.h / 2 - 16, 13, COL.vel, COL.velFondo, COL.vel);
    if (s.id === 'planoSube' || s.id === 'planoBaja') {
      const sube = s.id === 'planoSube';
      pildora(ctx, [['v', true], [sube ? ' hacia arriba del plano' : ' hacia abajo del plano', false]], 110, 18, 13, COL.vel, COL.velFondo, COL.vel, 4, w - 4);
    }
    if (s.id === 'ascensorBaja') pildora(ctx, [['a', true], [' ↓ (arranca hacia abajo)', false]], 104, 18, 13, COL.ace, COL.aceFondo, COL.ace, 4, w - 4);
    if (s.id === 'carrito') pildora(ctx, [['a', true], [' → (el carrito y el bloque)', false]], 110, 18, 13, COL.ace, COL.aceFondo, COL.ace, 4, w - 4);
    if (s.id === 'colgante') pildora(ctx, [['v', true], [' ↓', false]], 40, 18, 13, COL.vel, COL.velFondo, COL.vel);
    if (s.id === 'esfera') pildora(ctx, [['v', true], [' ↓ (acaba de soltarse)', false]], 96, 18, 13, COL.vel, COL.velFondo, COL.vel, 4, w - 4);
  }
  function dibujarCuerpo(ctx, g) {
    const s = sit(), c = g.cuerpo;
    if (s.forma === 'esfera') {
      ctx.beginPath(); ctx.arc(c.cx, c.cy, c.r, 0, 2 * Math.PI); ctx.fillStyle = '#C9D3DF'; ctx.fill(); ctx.strokeStyle = COL.tinta; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.beginPath(); ctx.arc(c.cx - c.r * 0.35, c.cy - c.r * 0.35, c.r * 0.22, 0, 2 * Math.PI); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fill();
    } else if (s.forma === 'persona') {
      const e = c.h / 150, x = c.cx, pie = c.cy + c.h / 2;
      const parte = (px, py, ww, hh, r, col) => { rectRedondo(ctx, px, py, ww, hh, r); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = COL.tinta; ctx.lineWidth = 1.3; ctx.stroke(); };
      parte(x - 14 * e, pie - 62 * e, 11 * e, 62 * e, 4 * e, '#5A6B7D'); parte(x + 3 * e, pie - 62 * e, 11 * e, 62 * e, 4 * e, '#5A6B7D');
      parte(x - 19 * e, pie - 118 * e, 38 * e, 60 * e, 10 * e, '#B5CFEC');
      parte(x - 28 * e, pie - 112 * e, 9 * e, 46 * e, 4 * e, '#B5CFEC'); parte(x + 19 * e, pie - 112 * e, 9 * e, 46 * e, 4 * e, '#B5CFEC');
      ctx.beginPath(); ctx.arc(x, pie - 132 * e, 14 * e, 0, 2 * Math.PI); ctx.fillStyle = '#F1D6BE'; ctx.fill(); ctx.stroke();
    } else Es.bloque(ctx, c.cx, c.cy, c.w, c.h, c.ang, s.forma === 'colgante' ? [['m', true], ['₂', false]] : null);
    ctx.beginPath(); ctx.arc(c.cx, c.cy, 3, 0, 2 * Math.PI); ctx.fillStyle = COL.tinta; ctx.fill();
  }
  function dibujarTrabajo() {
    const cv = $('cTrabajo'), { ctx, w, h } = prepararLienzo(cv);
    if (w < 60 || h < 60) return;
    const g = r1.geo = geometria(w, h);
    dibujarContexto(ctx, w, h, g);
    dibujarCuerpo(ctx, g);
    const fl = lista(), bien = r1.estado[r1.i] === 'bien' || r1.estado[r1.i] === 'visto';
    for (const f of fl) {
      const p = punta(f, g), falsa = f.tipo.startsWith('x:'), color = falsa ? GRIS : Es.FZ[f.tipo].color;
      const mal = r1.marcadas.includes(f.id), sel = r1.sel === f.id && !bien;
      if (sel) flecha(ctx, p.x0, p.y0, p.x1, p.y1, 'rgba(242,184,75,.55)', 10, 18);
      flecha(ctx, p.x0, p.y0, p.x1, p.y1, 'rgba(255,255,255,.9)', 6.5, 15);
      flecha(ctx, p.x0, p.y0, p.x1, p.y1, color, 3.5, 12);
      // asa para girar
      if (!bien) { ctx.beginPath(); ctx.arc(p.x1, p.y1, 7, 0, 2 * Math.PI); ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fill(); ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke(); }
      if (mal) { ctx.beginPath(); ctx.arc((p.x0 + p.x1) / 2, (p.y0 + p.y1) / 2, Math.hypot(p.x1 - p.x0, p.y1 - p.y0) / 2 + 10, 0, 2 * Math.PI); ctx.setLineDash([5, 4]); ctx.strokeStyle = COL.ace; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]); }
      const ux = Math.cos(f.ang * RAD), uy = -Math.sin(f.ang * RAD);
      const partes = falsa ? [[C.DISTRACTORES[f.tipo.slice(2)].corto, false]] : [['F', true], [SUB[f.tipo], false, true]];
      const ancho = medirRico(ctx, partes, 15, true), tx = p.x1 + ux * 16, ty = p.y1 + uy * 15;
      const x = ux > 0.4 ? tx : ux < -0.4 ? tx - ancho : tx - ancho / 2;
      ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(x - 2, ty - 9, ancho + 4, 18);
      textoRico(ctx, partes, x, ty, 15, color, 'left', true);
    }
    if (!fl.length) {
      ctx.font = `15px ${LETRA}`; ctx.fillStyle = COL.suave; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const yT = Math.min(h - 18, g.cuerpo.cy + (g.cuerpo.r || g.cuerpo.h / 2) + 46);
      const txt = 'Arrastra fuerzas del banco hasta aquí. Gira y alarga cada flecha arrastrando su punta.';
      if (ctx.measureText(txt).width < w - 24) ctx.fillText(txt, w / 2, yT);
      else { ctx.fillText('Arrastra o toca fuerzas del banco.', w / 2, yT - 10); ctx.fillText('Gira y alarga cada flecha arrastrando su punta.', w / 2, yT + 10); }
    }
  }
  function dibujarMini() {
    const s = sit(), cv = $('cMini');
    const resuelta = r1.estado[r1.i] === 'bien' || r1.estado[r1.i] === 'visto';
    if (s.modelo === false) {
      const { ctx, w, h } = prepararLienzo(cv);
      if (w < 60) return;
      const yM = h * 0.72, k = Math.min(1.2, w / 300);
      Es.mesaLab(ctx, 0, w, yM);
      const cx = w * 0.5, cw = 130 * k, ch = 22 * k;
      ctx.lineWidth = 1.3; ctx.strokeStyle = COL.tinta;
      rectRedondo(ctx, cx - cw / 2, yM - 10 * k - ch, cw, ch, 4); ctx.fillStyle = '#E4E9EF'; ctx.fill(); ctx.stroke();
      for (const dx of [-cw / 3, cw / 3]) { ctx.beginPath(); ctx.arc(cx + dx, yM - 7 * k, 7 * k, 0, 2 * Math.PI); ctx.fillStyle = '#5A6B7D'; ctx.fill(); ctx.stroke(); }
      Es.bloque(ctx, cx, yM - 10 * k - ch - 20 * k, 60 * k, 40 * k, 0, null);
      pildora(ctx, [['a', true], [' →', false]], cx + cw / 2 + 28, yM - 40 * k, 13, COL.ace, COL.aceFondo, COL.ace);
      textoRico(ctx, [['carrito que acelera', false]], cx, yM + 22, 12, COL.suave, 'center');
      return;
    }
    const mod = D.crear(s.escena, s.par), est = mod.estado(s.t);
    let Fmax = 0; for (const c of est.cuerpos) for (const f of c.fuerzas) Fmax = Math.max(Fmax, f.mod);
    Es.dibujarEscena(cv, { mod, est, ver: { fuerzas: resuelta, valores: false, componentes: false }, Fmax, jugando: false });
  }

  function pintarR1() {
    const s = sit(), n = C.SITUACIONES.length, est = r1.estado[r1.i];
    $('cNum').textContent = `Situación ${r1.i + 1} de ${n}`;
    $('cPuntos').innerHTML = C.SITUACIONES.map((_, j) => `<button class="${j === r1.i ? 'actual' : ''}${r1.estado[j] === 'bien' ? ' bien' : ''}" data-i="${j}" aria-label="Situación ${j + 1}"></button>`).join('');
    $('cPuntos').querySelectorAll('button').forEach(b => b.addEventListener('click', () => irSit(Number(b.dataset.i))));
    $('cNombre').textContent = s.nombre;
    $('cTexto').textContent = s.texto;
    const m = r1.mensaje[r1.i];
    $('cCorr').hidden = !m; if (m) { $('cCorr').className = 'correccion ' + m.clase; $('cCorr').innerHTML = m.html; }
    const vs = $('cVerSol'); if (vs) vs.addEventListener('click', verSolucion);
    const hecho = est === 'bien' || est === 'visto';
    $('cComprobar').disabled = hecho; $('cBorrar').disabled = hecho || !lista().length;
    $('cQuitar').disabled = hecho || !lista().some(f => f.id === r1.sel);
    $('banco').classList.toggle('apagado', hecho);
    $('cAnt').disabled = r1.i === 0; $('cSig').disabled = r1.i === n - 1;
    dibujarTrabajo(); dibujarMini();
  }
  function irSit(i) {
    r1.i = Math.max(0, Math.min(C.SITUACIONES.length - 1, i)); r1.sel = null; r1.marcadas = [];
    pintarBanco(); pintarR1();
  }
  function comprobar() {
    const intento = r1.intentos[r1.i] = (r1.intentos[r1.i] || 0) + 1;
    const r = K.corregir(sit(), lista(), intento, D);
    r1.marcadas = r.marcadas;
    if (r.bien) { r1.estado[r1.i] = 'bien'; r1.sel = null; r1.mensaje[r1.i] = { clase: 'bien', html: r.mensaje }; }
    else r1.mensaje[r1.i] = { clase: 'pista', html: r.mensaje + (intento >= 3 ? '<br><button class="boton mini" id="cVerSol">Ver solución</button>' : '') };
    pintarR1();
  }
  function verSolucion() {
    const esp = K.esperadas(sit(), D), max = Math.max(...esp.map(f => f.mod));
    // longitudes proporcionales a los módulos (el carrito no tiene modelo: F_N = F_g y el rozamiento más corto)
    const Lsol = (f) => sit().modelo === false ? (f.tipo === 'Ff' ? 40 : 90) : Math.max(10, 120 * f.mod / max);
    r1.flechas[r1.i] = esp.map(f => ({ id: r1.sigId++, tipo: f.tipo, ang: f.ang, L: Lsol(f) }));
    r1.estado[r1.i] = 'visto'; r1.marcadas = []; r1.sel = null;
    r1.mensaje[r1.i] = { clase: 'solucion', html: `<b>Solución.</b> ${sit().explica.replace(/F_([a-zA-Z]+)/g, (_, x) => F(x))}` };
    pintarR1();
  }
  function quitar() { r1.flechas[r1.i] = lista().filter(f => f.id !== r1.sel); r1.sel = null; tocar(); }
  $('cComprobar').addEventListener('click', comprobar);
  $('cQuitar').addEventListener('click', quitar);
  $('cBorrar').addEventListener('click', () => { r1.flechas[r1.i] = []; r1.sel = null; tocar(); });
  $('cAnt').addEventListener('click', () => irSit(r1.i - 1));
  $('cSig').addEventListener('click', () => irSit(r1.i + 1));

  // ---------- Girar y alargar flechas arrastrando la punta; quitarlas soltándolas sobre el cuerpo ----------
  (function () {
    const cv = $('cTrabajo');
    let arrastre = null;
    const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    const distSeg = (px, py, a) => { const dx = a.x1 - a.x0, dy = a.y1 - a.y0, L2 = dx * dx + dy * dy || 1; const t = Math.max(0, Math.min(1, ((px - a.x0) * dx + (py - a.y0) * dy) / L2)); return Math.hypot(px - a.x0 - t * dx, py - a.y0 - t * dy); };
    cv.addEventListener('pointerdown', (e) => {
      if (!r1.geo || r1.estado[r1.i] === 'bien' || r1.estado[r1.i] === 'visto') return;
      const [x, y] = pos(e);
      let mejor = null, dMin = 18;
      for (const f of lista()) { const p = punta(f, r1.geo), d = Math.min(Math.hypot(x - p.x1, y - p.y1), distSeg(x, y, p) + 6); if (d < dMin) { dMin = d; mejor = f; } }
      r1.sel = mejor ? mejor.id : null;
      if (mejor) { arrastre = mejor; cv.setPointerCapture(e.pointerId); e.preventDefault(); }
      pintarR1();
    });
    cv.addEventListener('pointermove', (e) => {
      if (!arrastre) return;
      const [x, y] = pos(e), g = r1.geo, dx = x - g.cx, dy = y - g.cy, d = Math.hypot(dx, dy);
      if (d < 6) return;
      arrastre.ang = ajustar(Math.atan2(-dy, dx) / RAD);
      const [x0, y0] = Es.salida(g.cuerpo, Math.cos(arrastre.ang * RAD), -Math.sin(arrastre.ang * RAD));
      arrastre.L = Math.max(10, Math.min(150, (d - Math.hypot(x0 - g.cx, y0 - g.cy)) / g.k));
      arrastre.quitar = d < Math.hypot(x0 - g.cx, y0 - g.cy) * 0.7;
      r1.marcadas = []; r1.mensaje[r1.i] = null;
      pintarR1();
    });
    const fin = () => { if (arrastre && arrastre.quitar) { r1.sel = arrastre.id; arrastre = null; quitar(); return; } arrastre = null; };
    cv.addEventListener('pointerup', fin); cv.addEventListener('pointercancel', fin);
    cv.addEventListener('keydown', (e) => {
      const f = lista().find(q => q.id === r1.sel);
      if (!f || r1.estado[r1.i] === 'bien') return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { f.ang = ajustar(f.ang + 5); e.preventDefault(); tocar(); }
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { f.ang = ajustar(f.ang - 5); e.preventDefault(); tocar(); }
      else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); quitar(); }
    });
  })();

  /* ======================= Reto 2 ======================= */
  const r2 = { i: 0, resp: {} };
  const opciones = (lista, val) => `<option value="">—</option>` + lista.map(([v, t]) => `<option value="${v}"${v === val ? ' selected' : ''}>${t}</option>`).join('');
  function pintarR2() {
    const p = C.PAREJAS[r2.i], n = C.PAREJAS.length, r = r2.resp[r2.i] || {};
    $('pNum').textContent = `Pregunta ${r2.i + 1} de ${n}`;
    $('pPuntos').innerHTML = C.PAREJAS.map((_, j) => `<button class="${j === r2.i ? 'actual' : ''}${r2.resp[j] && r2.resp[j].bien ? ' bien' : ''}" data-i="${j}" aria-label="Pregunta ${j + 1}"></button>`).join('');
    $('pPuntos').querySelectorAll('button').forEach(b => b.addEventListener('click', () => { r2.i = Number(b.dataset.i); pintarR2(); }));
    if (p.tipo === 'pareja') {
      const cuerpos = p.cuerpos.map(c => [c, c]), v = r.valores || {}, dis = r.bien ? ' disabled' : '';
      $('pCuerpo').innerHTML = `<p class="guia-texto"><b>Fuerza dada:</b> ${p.fuerza}</p><p class="guia-texto">Construye su pareja de tercera ley:</p>
        <div class="pareja">
          <label>La ejerce <select id="pPor"${dis}>${opciones(cuerpos, v.por)}</select></label>
          <label>sobre <select id="pSobre"${dis}>${opciones(cuerpos, v.sobre)}</select></label>
          <label>Tipo <select id="pTipo"${dis}>${opciones(C.TIPOS, v.clase)}</select></label>
          <label>Sentido <select id="pSentido"${dis}>${opciones(C.SENTIDOS, v.sentido)}</select></label>
          <label>Módulo comparado con la fuerza dada <select id="pModulo"${dis}>${opciones(C.MODULOS, v.modulo)}</select></label>
        </div>
        <button class="boton mini primario" id="pComprobar"${dis}>Comprobar</button>`;
      $('pComprobar').addEventListener('click', comprobarPareja);
    } else {
      $('pCuerpo').innerHTML = `<p class="guia-texto">${p.texto}</p><div class="guia-resp">` + p.opciones.map((o, j) => {
        const cls = r.bien && o[1] ? ' bien' : (r.malas || []).includes(j) ? ' mal' : '';
        return `<button class="opc${cls}" data-j="${j}"${r.bien || cls ? ' disabled' : ''}>${o[0]}</button>`;
      }).join('') + '</div>';
      $('pCuerpo').querySelectorAll('.opc').forEach(b => b.addEventListener('click', () => elegir(Number(b.dataset.j))));
    }
    $('pCorr').hidden = !r.mensaje; $('pCorr').className = 'correccion ' + (r.clase || ''); $('pCorr').innerHTML = r.mensaje || '';
    $('pAnt').disabled = r2.i === 0; $('pSig').disabled = r2.i === n - 1;
  }
  function comprobarPareja() {
    const p = C.PAREJAS[r2.i], r = r2.resp[r2.i] = r2.resp[r2.i] || {};
    const v = r.valores = { por: $('pPor').value, sobre: $('pSobre').value, clase: $('pTipo').value, sentido: $('pSentido').value, modulo: $('pModulo').value };
    if (Object.values(v).some(x => !x)) { Object.assign(r, { clase: 'pista', mensaje: 'Completa las cinco casillas.' }); pintarR2(); return; }
    const crit = [
      [v.por === p.sobre && v.sobre === p.por, 'Cuerpos', v.por === p.por && v.sobre === p.sobre ? 'Esa es la misma fuerza que te dan. La pareja actúa sobre el otro cuerpo.' : 'La pareja la ejerce el cuerpo que recibe la fuerza dada, y actúa sobre el que la ejerce.'],
      [v.clase === p.clase, 'Tipo', 'Las dos fuerzas de una pareja son del mismo tipo de interacción.'],
      [v.sentido === C.OPUESTO[p.sentido], 'Sentido', 'Las dos fuerzas de una pareja tienen sentidos opuestos.'],
      [v.modulo === 'igual', 'Módulo', 'Las dos fuerzas de una pareja tienen siempre el mismo módulo, aunque los cuerpos tengan masas muy distintas o aceleren.']
    ];
    const lista = '<ul class="criterios">' + crit.map(([b, n, txt]) => `<li class="${b ? 'si' : 'no'}">${b ? '✓' : '✗'} <b>${n}.</b>${b ? '' : ' ' + txt}</li>`).join('') + '</ul>';
    if (crit.every(c => c[0])) Object.assign(r, { bien: true, clase: 'bien', mensaje: `<b>¡Correcto!</b> ${p.explica}` });
    else Object.assign(r, { clase: 'pista', mensaje: '<b>Revisa los criterios:</b>' + lista });
    pintarR2();
  }
  function elegir(j) {
    const p = C.PAREJAS[r2.i], r = r2.resp[r2.i] = r2.resp[r2.i] || { malas: [] };
    r.malas = r.malas || [];
    if (p.opciones[j][1]) Object.assign(r, { bien: true, clase: 'bien', mensaje: `<b>¡Correcto!</b> ${p.explica}` });
    else { r.malas.push(j); Object.assign(r, { clase: 'pista', mensaje: `<b>No es así.</b> ${p.opciones[j][2]}` }); }
    pintarR2();
  }
  $('pAnt').addEventListener('click', () => { r2.i = Math.max(0, r2.i - 1); pintarR2(); });
  $('pSig').addEventListener('click', () => { r2.i = Math.min(C.PAREJAS.length - 1, r2.i + 1); pintarR2(); });

  /* ======================= Retos y visibilidad ======================= */
  let reto = 1;
  document.querySelectorAll('#retos .nivel').forEach(b => b.addEventListener('click', () => {
    reto = Number(b.dataset.reto);
    document.querySelectorAll('#retos .nivel').forEach(x => { const a = x === b; x.classList.toggle('activo', a); x.setAttribute('aria-pressed', String(a)); });
    $('reto1').hidden = reto !== 1; $('reto2').hidden = reto !== 2;
    mostrar();
  }));
  function mostrar() { if ($('panel-construir').hidden) return; if (reto === 1) pintarR1(); else pintarR2(); }
  new ResizeObserver(() => { if (!$('panel-construir').hidden && reto === 1) { dibujarTrabajo(); dibujarMini(); } }).observe($('reto1'));

  pintarBanco();
  window.ConstruirFuerzas = { mostrar, r1, r2, irSit, agregar, comprobar, verSolucion };
})();
