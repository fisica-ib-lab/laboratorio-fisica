/* Tarjeta de preguntas guiadas para la parte Explorar (común a las simulaciones de A.1).
   Cada simulación aporta sus preguntas (archivo preguntas.js, sin pantalla) y tres funciones:
     cargar(idSituacion)  → pone los valores de la situación en la simulación
     contexto()           → objeto con el modelo actual (lo reciben respuesta, texto y resolución)
     alOcultar()          → opcional: se llama al cambiar lo que hay que ocultar (para redibujar)
   Tipos de pregunta:
     opcion: { texto, opciones: [[html, esCorrecta, comentario]], explicacion }
     valor:  { texto, respuesta(ctx), unidad, tol (0,02), pista, pistaSigno?, pistaExtra?(x, ctx), resolucion(ctx) }
   texto, pista y explicacion pueden ser funciones de ctx.
   «oculta»: lista de id de lecturas que darían la respuesta; la tarjeta les pone la clase guia-oculto
   y la simulación puede consultar Guia.oculto(id) para lo que dibuja en el lienzo. */
(function (raiz) {
  'use strict';

  function c3(x) {                       // 3 cifras significativas, coma decimal, signo menos tipográfico
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-12) return '0';
    const d = Math.max(0, 2 - Math.floor(Math.log10(Math.abs(x)) + 1e-12));
    return x.toFixed(Math.min(d, 6)).replace('.', ',').replace('-', '−');
  }
  function leerNumero(txt) {
    const limpio = String(txt).trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-');
    if (!/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(limpio)) return NaN;
    return Number(limpio);
  }

  let activa = null;   // la tarjeta en uso (una por página)

  function crear(o) {
    const el = document.createElement('div');
    el.className = 'caja guia-p' + (o.clase ? ' ' + o.clase : '');
    el.setAttribute('aria-live', 'polite');
    el.innerHTML = `
      <div class="guia-cab"><span class="guia-num"></span><span class="guia-puntos"></span></div>
      <div class="guia-sit"><span class="guia-nombre"></span> <button type="button" class="boton mini guia-reiniciar" title="Volver a los valores de esta situación">Reiniciar</button></div>
      <div class="guia-texto"></div>
      <div class="guia-resp"></div>
      <div class="correccion" hidden></div>
      <div class="guia-nav"><button type="button" class="boton mini guia-ant">← Anterior</button><button type="button" class="boton mini guia-sig">Siguiente →</button></div>`;
    o.contenedor.insertBefore(el, o.contenedor.firstChild);
    const q$ = (s) => el.querySelector(s);
    const st = { nivel: null, i: {}, resp: {}, sit: null, ocultos: [] };
    const lista = () => (o.niveles[st.nivel] || []);
    const preg = () => lista()[st.i[st.nivel] || 0];
    const clave = () => `${st.nivel}-${st.i[st.nivel] || 0}`;
    const valorDe = (f) => (typeof f === 'function' ? f(o.contexto()) : f);

    function ponerOcultos(ids) {
      for (const id of st.ocultos) { const e = document.getElementById(id); if (e) e.classList.remove('guia-oculto'); }
      st.ocultos = ids || [];
      for (const id of st.ocultos) { const e = document.getElementById(id); if (e) e.classList.add('guia-oculto'); }
      if (o.alOcultar) o.alOcultar();
    }
    function cargar(id) { st.sit = id; o.cargar(id); }
    function ponerNivel(n) {
      st.nivel = n;
      const hay = lista().length > 0;
      el.hidden = !hay;
      if (!hay) { ponerOcultos([]); return; }
      ir(st.i[n] || 0, true);
    }
    function ir(i, forzar) {
      const L = lista(); i = Math.max(0, Math.min(L.length - 1, i));
      st.i[st.nivel] = i;
      const q = L[i];
      const r = st.resp[clave()];
      ponerOcultos(r && r.bien ? [] : q.oculta);
      if (forzar || q.sit !== st.sit) cargar(q.sit);
      pintar();
    }
    function pintar() {
      const L = lista(), i = st.i[st.nivel] || 0, q = L[i], r = st.resp[clave()] || {};
      q$('.guia-num').textContent = `Pregunta ${i + 1} de ${L.length}`;
      const pts = q$('.guia-puntos');
      pts.innerHTML = L.map((_, j) => {
        const rj = st.resp[`${st.nivel}-${j}`];
        return `<button type="button" class="${j === i ? 'actual' : ''}${rj && rj.bien ? ' bien' : ''}" data-i="${j}" aria-label="Pregunta ${j + 1}${rj && rj.bien ? ' (resuelta)' : ''}"></button>`;
      }).join('');
      pts.querySelectorAll('button').forEach(b => b.addEventListener('click', () => ir(Number(b.dataset.i))));
      q$('.guia-nombre').textContent = o.situaciones[q.sit].nombre;
      q$('.guia-texto').innerHTML = valorDe(q.texto);
      const resp = q$('.guia-resp');
      if (q.tipo === 'opcion') {
        resp.innerHTML = q.opciones.map((op, j) => {
          const cls = r.bien && op[1] ? ' bien' : (r.malas || []).includes(j) ? ' mal' : '';
          return `<button type="button" class="opc${cls}" data-j="${j}"${r.bien || cls ? ' disabled' : ''}>${op[0]}</button>`;
        }).join('');
        resp.querySelectorAll('.opc').forEach(b => b.addEventListener('click', () => elegir(Number(b.dataset.j))));
      } else {
        resp.innerHTML = `<div class="guia-valor"><input inputmode="decimal" autocomplete="off" aria-label="Tu respuesta"${r.bien ? ' disabled' : ''} value="${r.texto || ''}">` +
          `<span>${q.unidad || ''}</span><button type="button" class="boton mini primario"${r.bien ? ' disabled' : ''}>Comprobar</button></div>`;
        resp.querySelector('button').addEventListener('click', comprobar);
        resp.querySelector('input').addEventListener('keydown', (e) => { if (e.key === 'Enter') comprobar(); });
      }
      const corr = q$('.correccion');
      corr.hidden = !r.mensaje; corr.className = 'correccion ' + (r.clase || ''); corr.innerHTML = r.mensaje || '';
      const ver = corr.querySelector('.guia-verres'); if (ver) ver.addEventListener('click', verResolucion);
      q$('.guia-ant').disabled = i === 0; q$('.guia-sig').disabled = i === L.length - 1;
    }
    function resuelta(r) { r.bien = true; ponerOcultos([]); }
    function elegir(j) {
      const q = preg(), r = st.resp[clave()] = st.resp[clave()] || { malas: [] };
      r.malas = r.malas || [];
      if (q.opciones[j][1]) { resuelta(r); Object.assign(r, { clase: 'bien', mensaje: `<b>¡Correcto!</b> ${valorDe(q.explicacion)}` }); }
      else { r.malas.push(j); Object.assign(r, { clase: 'pista', mensaje: `<b>No es así.</b> ${q.opciones[j][2]}` }); }
      pintar();
    }
    function comprobar() {
      const q = preg(), r = st.resp[clave()] = st.resp[clave()] || { intentos: 0 };
      const txt = q$('.guia-resp input').value.trim(); r.texto = txt.replace(/"/g, '');
      const x = leerNumero(txt);
      if (!txt || !isFinite(x)) { Object.assign(r, { clase: 'pista', mensaje: 'Escribe solo un número (con coma o punto decimal), sin la unidad.' }); pintar(); return; }
      const ctx = o.contexto(), bien = q.respuesta(ctx), tol = q.tol || 0.02;
      if (Math.abs(x - bien) <= tol * Math.abs(bien) + 1e-9) {
        resuelta(r); Object.assign(r, { clase: 'bien', mensaje: `<b>¡Correcto!</b><br>${q.resolucion(ctx)}` });
      } else {
        r.intentos = (r.intentos || 0) + 1;
        let pista = typeof q.pista === 'function' ? q.pista(ctx) : q.pista;
        if (Math.abs(bien) > 1e-9 && Math.abs(x + bien) <= tol * Math.abs(bien)) pista = q.pistaSigno || 'El valor es correcto, pero revisa el <b>signo</b>: derecha y arriba son positivos.';
        else if (q.pistaExtra) { const extra = q.pistaExtra(x, ctx); if (extra) pista = extra; }
        Object.assign(r, { clase: 'pista', mensaje: `<b>Todavía no.</b> ${pista}` + (r.intentos >= 2 ? '<br><button type="button" class="boton mini guia-verres">Ver resolución</button>' : '') });
      }
      pintar();
    }
    function verResolucion() {
      const q = preg(), r = st.resp[clave()];
      ponerOcultos([]);
      Object.assign(r, { clase: 'solucion', mensaje: q.resolucion(o.contexto()) });
      pintar();
    }
    q$('.guia-ant').addEventListener('click', () => ir((st.i[st.nivel] || 0) - 1));
    q$('.guia-sig').addEventListener('click', () => ir((st.i[st.nivel] || 0) + 1));
    q$('.guia-reiniciar').addEventListener('click', () => { if (st.sit) cargar(st.sit); });

    const api = {
      ponerNivel,
      ocultar() { el.hidden = true; ponerOcultos([]); },
      actualizar() { if (!el.hidden && lista().length) q$('.guia-texto').innerHTML = valorDe(preg().texto); },
      oculto: (id) => st.ocultos.includes(id) && !el.hidden,
      ir, estado: st, elemento: el
    };
    activa = api;
    return api;
  }

  const Guia = { crear, c3, leerNumero, oculto: (id) => !!(activa && activa.oculto(id)) };
  if (typeof module !== 'undefined' && module.exports) module.exports = Guia; else raiz.Guia = Guia;
})(typeof window !== 'undefined' ? window : globalThis);
