/* Simulación A.2 · Practicar: ejercicios al azar (practicar-ejercicios.js) que se corrigen uno a uno, sin puntaje.
   La figura es el montaje de la simulación sin fuerzas ni lecturas; al resolver el ejercicio se muestran las fuerzas. */

(function () {
  'use strict';
  const D = window.Dinamica, P = window.PracticarFuerzas, Es = window.FuerzasEscena;
  const $ = (id) => document.getElementById(id);
  const fz = (html) => html.replace(/F_([a-zA-Z]+)/g, (_, x) => `<span class="var">F</span><sub>${x}</sub>`).replace(/μs/g, '<span class="var">μ</span><sub>s</sub>');
  const est = { grupo: 'todos', ej: null, intentos: 0, resuelto: false, malas: [], mensaje: null };

  function pintarGrupos() {
    $('pGrupos').innerHTML = P.GRUPOS.map(([g, t]) => `<button class="nivel${g === est.grupo ? ' activo' : ''}" data-g="${g}" aria-pressed="${g === est.grupo}">${t}</button>`).join('');
    $('pGrupos').querySelectorAll('.nivel').forEach(b => b.addEventListener('click', () => { est.grupo = b.dataset.g; pintarGrupos(); nuevo(); }));
  }
  function nuevo() {
    est.ej = P.generarDeGrupo(est.grupo, est.ej && est.ej.tipo);
    est.intentos = 0; est.resuelto = false; est.malas = []; est.mensaje = null;
    pintar();
    const inp = $('eInput'); if (inp && window.matchMedia('(min-width: 900px)').matches) inp.focus();
  }
  function figura() {
    const e = est.ej, cv = $('pFig');
    $('pSinFig').hidden = !!e.figura; cv.hidden = !e.figura;
    if (!e.figura) return;
    if (e.figura.dibujo === 'resorte') { dibujarResorte(cv, e.figura); return; }
    const mod = D.crear(e.figura.escena, e.figura.par), s = mod.estado(e.figura.t);
    let Fmax = 0; for (const c of s.cuerpos) for (const f of c.fuerzas) Fmax = Math.max(Fmax, f.mod);
    // sin fuerzas ni lecturas hasta resolverlo (no deben dar la respuesta)
    Es.dibujarEscena(cv, { mod, est: s, ver: { fuerzas: est.resuelto, valores: false, componentes: false }, Fmax, jugando: false, sinLecturas: true });
  }
  // masa colgada de un resorte (ejercicio de la constante elástica): soporte, resorte con su alargamiento y regla
  function dibujarResorte(cv, f) {
    const Gr = window.Graficas, { ctx, w, h } = Gr.prepararLienzo(cv);
    if (w < 60) return;
    const cx = w * 0.45, y0 = 22, L0 = Math.min(110, h * 0.3), alarg = Math.min(h * 0.35, f.x * 9), yF = y0 + 12 + L0 + alarg;
    ctx.fillStyle = '#D3AC84'; ctx.fillRect(cx - 90, y0 - 10, 180, 10); ctx.fillStyle = '#EFE8DC'; ctx.fillRect(cx - 90, y0 - 2, 180, 2);
    ctx.strokeStyle = Gr.COL.tinta; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx, y0); ctx.lineTo(cx, y0 + 12);
    const n = 14, paso = (yF - y0 - 24) / n;
    for (let i = 0; i <= n; i++) ctx.lineTo(cx + (i % 2 ? 12 : -12) * (i === 0 || i === n ? 0 : 1), y0 + 12 + i * paso);
    ctx.lineTo(cx, yF); ctx.stroke();
    Es.bloque(ctx, cx, yF + 26, 64, 44, 0, [[(f.m * 1000).toFixed(0) + ' g', false]]);
    // regla con la posición sin carga y el alargamiento
    const xr = cx + 80, yLibre = y0 + 12 + L0;
    ctx.fillStyle = '#F6F8FA'; ctx.fillRect(xr, y0 + 4, 16, yF - y0 + 20); ctx.strokeStyle = '#8A97A6'; ctx.lineWidth = 1; ctx.strokeRect(xr, y0 + 4, 16, yF - y0 + 20);
    ctx.setLineDash([4, 3]); ctx.strokeStyle = Gr.COL.suave; ctx.beginPath(); ctx.moveTo(cx - 30, yLibre); ctx.lineTo(xr + 30, yLibre); ctx.moveTo(cx - 30, yF); ctx.lineTo(xr + 30, yF); ctx.stroke(); ctx.setLineDash([]);
    Gr.flecha(ctx, xr + 26, yLibre, xr + 26, yF, '#C65911', 2.5, 9);
    Gr.textoRico(ctx, [['x', true], [' = ' + String(f.x).replace('.', ',') + ' cm', false]], xr + 34, (yLibre + yF) / 2, 14, '#C65911', 'left', true);
    Gr.textoRico(ctx, [['sin carga', false]], xr + 34, yLibre - 10, 12, Gr.COL.suave, 'left');
  }
  function pintar() {
    const e = est.ej;
    $('eTermino').textContent = e.termino;
    $('eGrupo').textContent = (P.GRUPOS.find(g => g[0] === e.grupo) || [, ''])[1];
    $('eTexto').innerHTML = e.texto;
    if (e.opciones) {
      $('eResp').innerHTML = e.opciones.map((o, j) => {
        const cls = est.resuelto && o[1] ? ' bien' : est.malas.includes(j) ? ' mal' : '';
        return `<button class="opc${cls}" data-j="${j}"${est.resuelto || cls ? ' disabled' : ''}>${fz(o[0])}</button>`;
      }).join('');
      $('eResp').querySelectorAll('.opc').forEach(b => b.addEventListener('click', () => elegir(Number(b.dataset.j))));
    } else {
      $('eResp').innerHTML = `<div class="guia-valor"><input id="eInput" inputmode="decimal" autocomplete="off" aria-label="Tu respuesta"${est.resuelto ? ' disabled' : ''} value="${est.texto || ''}">` +
        `<span>${e.unidad}</span><button class="boton mini primario" id="eComprobar"${est.resuelto ? ' disabled' : ''}>Comprobar</button></div>`;
      $('eComprobar').addEventListener('click', comprobar);
      $('eInput').addEventListener('keydown', (ev) => { if (ev.key === 'Enter') comprobar(); });
    }
    const m = est.mensaje, c = $('eCorr');
    c.hidden = !m; if (m) { c.className = 'correccion ' + m.clase; c.innerHTML = m.html; }
    const vr = $('eVerRes'); if (vr) vr.addEventListener('click', verResolucion);
    figura();
  }
  function comprobar() {
    const e = est.ej, txt = $('eInput').value.trim(); est.texto = txt;
    const x = Number(txt.replace(/\s/g, '').replace(',', '.').replace('−', '-'));
    if (!txt || !isFinite(x)) { est.mensaje = { clase: 'pista', html: 'Escribe un número (con coma o punto decimal).' }; pintar(); return; }
    if (Math.abs(x - e.respuesta) <= e.tol * Math.abs(e.respuesta)) {
      est.resuelto = true;
      est.mensaje = { clase: 'bien', html: `<b>¡Correcto!</b>${e.resolucion}` };
    } else {
      est.intentos++;
      // pistas para dos errores frecuentes: el signo y las unidades (cm, g, mm) sin convertir
      let extra = '';
      if (Math.abs(x + e.respuesta) <= e.tol * Math.abs(e.respuesta)) extra = ' Revisa el signo: aquí se pide el módulo.';
      else if ([100, 1000, 0.01, 0.001].some(f => Math.abs(x * f - e.respuesta) <= e.tol * Math.abs(e.respuesta))) extra = ' El número se parece, pero revisa las unidades (cm → m, g → kg, mm → m).';
      est.mensaje = { clase: 'pista', html: `<b>Todavía no.</b> ${e.pista}${extra}` + (est.intentos >= 2 ? '<br><button class="boton mini" id="eVerRes">Ver resolución</button>' : '') };
    }
    est.texto = txt; pintar();
  }
  function verResolucion() { est.resuelto = true; est.mensaje = { clase: 'solucion', html: `<b>Resolución.</b>${est.ej.resolucion}` }; pintar(); }
  function elegir(j) {
    const e = est.ej, o = e.opciones[j];
    if (o[1]) { est.resuelto = true; est.mensaje = { clase: 'bien', html: `<b>¡Correcto!</b> ${fz(e.explicacion)}` }; }
    else { est.malas.push(j); est.mensaje = { clase: 'pista', html: `<b>No es así.</b> ${fz(o[2])}` }; }
    pintar();
  }
  $('eNuevo').addEventListener('click', nuevo);
  new ResizeObserver(() => { if (!$('panel-practicar').hidden && est.ej) figura(); }).observe($('pFig').parentElement);

  function mostrar() { if (!est.ej) { pintarGrupos(); nuevo(); } else pintar(); }
  window.PracticarUI = { mostrar, nuevo, est };
})();
