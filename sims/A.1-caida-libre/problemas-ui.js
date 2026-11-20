/* Simulación A.1 · Caída libre: pestañas «Plantear problemas» y «Practicar».
   Problemas de problemas.js. Plantear: 1) datos e incógnita con su signo (arriba +), 2) ecuación del Cuadernillo,
   3) resultado; cada paso se corrige con una pista según el error. Practicar: los mismos problemas y otros más,
   corregidos solo por el resultado. Esquema propio (no a escala) que solo muestra lo que ya dice el enunciado. */

(function () {
  'use strict';
  const P = window.ProblemasCaida, Gr = window.Graficas;
  const { COL, prepararLienzo, textoRico, pildora, flecha } = Gr;
  const $ = (id) => document.getElementById(id);
  const n = P.n, c3 = P.c3;
  const V = (x) => `<span class="var">${x}</span>`;
  const leer = (txt) => Number(String(txt).trim().replace(/\s/g, '').replace(',', '.').replace('−', '-'));
  const cercano = (x, y, tol) => Math.abs(x - y) <= tol * Math.abs(y) + 1e-9;

  /* ---------- Esquema del enunciado (no a escala) ---------- */
  function esquema(cv, Pr) {
    const f = Pr.figura;
    cv.parentElement.hidden = !f;
    if (!f) return;
    const { ctx, w, h } = prepararLienzo(cv);
    if (w < 60 || h < 60) return;
    const yG = h - 24, edificio = f.h >= 1 && !f.puerta, xb = w * 0.46;
    const yS = edificio ? Math.max(70, yG - (h - 90) * 0.68) : yG - Math.min(120, h * 0.32);
    // suelo
    ctx.fillStyle = '#EFE8DC'; ctx.fillRect(0, yG, w, 3); ctx.fillStyle = '#D3AC84'; ctx.fillRect(0, yG + 3, w, 6);
    ctx.lineWidth = 1.3; ctx.strokeStyle = COL.tinta;
    if (edificio) {
      // edificio o acantilado: bloque gris con ventanas
      const x0 = w * 0.16, x1 = xb - 16;
      ctx.fillStyle = '#E4E9EF'; ctx.fillRect(x0, yS, x1 - x0, yG - yS); ctx.strokeRect(x0, yS, x1 - x0, yG - yS);
      ctx.fillStyle = '#B5CFEC';
      for (let y = yS + 14; y < yG - 18; y += 26) for (let x = x0 + 10; x < x1 - 16; x += 22) ctx.fillRect(x, y, 10, 12);
    } else {
      // mano o soporte bajo
      ctx.fillStyle = '#E4E9EF'; ctx.fillRect(xb - 22, yS + 9, 44, 6); ctx.strokeRect(xb - 22, yS + 9, 44, 6);
      ctx.fillStyle = '#8A97A6'; ctx.fillRect(xb - 3, yS + 15, 6, yG - yS - 15);
    }
    // trayectoria cualitativa (subida y bajada) si se lanza hacia arriba
    if (f.u > 0) {
      ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = '#8A97A6'; ctx.lineWidth = 1.5;
      const tope = Math.max(28, yS - Math.min(90, yS - 30));
      ctx.beginPath(); ctx.moveTo(xb + 8, yS - 10); ctx.lineTo(xb + 8, tope); ctx.arc(xb + 16, tope, 8, Math.PI, 0); ctx.lineTo(xb + 24, edificio || Pr.completo && Pr.completo.s < 0 ? yG - 6 : yS - 4); ctx.stroke(); ctx.restore();
    }
    // bola
    ctx.beginPath(); ctx.arc(xb, yS, 8, 0, 2 * Math.PI); ctx.fillStyle = '#C9D3DF'; ctx.fill(); ctx.stroke();
    // eje: arriba +, s = 0 en el punto de salida
    const xe = Math.min(w - 40, w * 0.8);
    flecha(ctx, xe, yG - 4, xe, Math.max(14, yS - 60), COL.azul, 2, 9);
    textoRico(ctx, [['arriba +', false]], xe + 6, Math.max(18, yS - 56), 12, COL.azulOsc, 'left', true);
    ctx.save(); ctx.setLineDash([5, 4]); ctx.strokeStyle = COL.azul; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(xb + 12, yS); ctx.lineTo(xe, yS); ctx.stroke(); ctx.restore();
    textoRico(ctx, [['s', true], [' = 0', false]], xe + 6, yS, 13, COL.azulOsc, 'left', true);
    // altura (solo si es un dato del enunciado)
    if (edificio && f.verH !== false) {
      const xa = w * 0.1;
      ctx.strokeStyle = '#C65911'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(xa - 5, yS); ctx.lineTo(xa + 5, yS); ctx.moveTo(xa, yS); ctx.lineTo(xa, yG); ctx.moveTo(xa - 5, yG); ctx.lineTo(xa + 5, yG); ctx.stroke();
      if (f.rotuloH) textoRico(ctx, [[f.rotuloH, false]], xa - 4, (yS + yG) / 2, 13, '#C65911', 'right', true);
    }
    // velocidad inicial
    if (f.u) {
      const sube = f.u > 0;
      flecha(ctx, xb, yS + (sube ? -10 : 10), xb, yS + (sube ? -54 : 54), COL.vel, 3, 10);
      pildora(ctx, [['u', true], [' = ' + n(Math.abs(f.u), 1) + ' m s⁻¹', false]], xb - 70, yS + (sube ? -40 : 40), 12, COL.vel, COL.velFondo, COL.vel, 4, w - 4);
    } else pildora(ctx, [['se suelta (reposo)', false]], xb - 76, yS, 12, COL.vel, COL.velFondo, COL.vel, 4, w - 4);
    // altura intermedia (dos instantes)
    if (f.marca) {
      const ym = yS - 44;
      ctx.save(); ctx.setLineDash([3, 4]); ctx.strokeStyle = COL.naranja || '#C65911'; ctx.beginPath(); ctx.moveTo(xb - 40, ym); ctx.lineTo(xe, ym); ctx.stroke(); ctx.restore();
      textoRico(ctx, [['s', true], [' = +' + f.marca + ' m', false]], xe + 6, ym, 13, '#C65911', 'left', true);
    }
    // puerta fotoeléctrica
    if (f.puerta) {
      const yp = yS + Math.min(90, (yG - yS) * 0.55);
      ctx.fillStyle = '#2F3E4E'; ctx.fillRect(xb - 30, yp - 5, 12, 10); ctx.fillRect(xb + 18, yp - 5, 12, 10);
      ctx.strokeStyle = '#E2B045'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(xb - 18, yp); ctx.lineTo(xb + 18, yp); ctx.stroke();
      textoRico(ctx, [['puerta fotoeléctrica', false]], xb + 36, yp, 12, COL.suave, 'left');
    }
    textoRico(ctx, [['esquema, no a escala', false]], 8, 12, 11, COL.suave, 'left');
  }
  // datos que el esquema puede mostrar porque ya están en el enunciado
  function prepararFigura(Pr) {
    if (!Pr.figura) return;
    const f = Pr.figura;
    if (Pr.papeles) {
      f.verH = Pr.papeles.s === 'dato' && Pr.completo.s < 0;
      if (f.verH) f.rotuloH = n(-Pr.completo.s, 1) + ' m';
      if (Pr.id === 'segundoInstante') f.marca = n(Pr.completo.s, 1);
    } else f.verH = false;
  }

  /* ======================= Plantear problemas ======================= */
  const pl = { Pr: null, paso: 1, intentos: [0, 0, 0, 0], marcas: {}, msj: null, valores: {}, papeles: {}, ecu: null, malasEc: [], texto: '' };
  const PAPELES = [['', '—'], ['dato', 'dato'], ['incognita', 'incógnita'], ['no', 'no interviene']];
  function nuevoPlantear() {
    pl.Pr = P.aleatorio(P.LISTA_PLANTEAR, 'todos', pl.Pr && pl.Pr.id); prepararFigura(pl.Pr);
    Object.assign(pl, { paso: 1, intentos: [0, 0, 0, 0], marcas: {}, msj: null, valores: {}, papeles: {}, ecu: null, malasEc: [], texto: '' });
    pintarPlantear();
  }
  function pintarPlantear() {
    const Pr = pl.Pr;
    $('plTexto').innerHTML = Pr.texto;
    document.querySelectorAll('#plPasos li').forEach((li, i) => { li.classList.toggle('hecho', i + 1 < pl.paso || pl.paso === 4); li.classList.toggle('actual', i + 1 === pl.paso); });
    // paso 1: tabla de magnitudes
    const bloq = pl.paso > 1;
    $('plTabla').innerHTML = P.MAG.map(m => {
      const papel = bloq ? Pr.papeles[m] : (pl.papeles[m] || ''), val = bloq ? (Pr.papeles[m] === 'dato' ? n(Pr.completo[m], Math.abs(Pr.completo[m]) < 10 ? 2 : 1).replace(/,00$/, '') : '') : (pl.valores[m] || '');
      const marca = pl.marcas[m] ? `<span class="marca ${pl.marcas[m]}">${pl.marcas[m] === 'si' ? '✓' : '✗'}</span>` : '';
      return `<tr><th>${V(m)} <small>${P.NOMBRE[m]}</small></th>
        <td><select data-m="${m}" class="plPapel"${bloq ? ' disabled' : ''}>${PAPELES.map(([k, t]) => `<option value="${k}"${k === papel ? ' selected' : ''}>${t}</option>`).join('')}</select></td>
        <td><input data-m="${m}" class="plValor" inputmode="decimal" autocomplete="off" value="${val}"${bloq || papel !== 'dato' ? ' disabled' : ''} aria-label="Valor de ${m}"></td>
        <td class="u">${P.UNIDAD[m]}</td><td>${marca}</td></tr>`;
    }).join('');
    $('plTabla').querySelectorAll('.plPapel').forEach(s => s.addEventListener('change', () => { pl.papeles[s.dataset.m] = s.value; pl.marcas = {}; pintarPlantear(); }));
    $('plTabla').querySelectorAll('.plValor').forEach(i => i.addEventListener('input', () => { pl.valores[i.dataset.m] = i.value; }));
    $('plComprobar1').hidden = bloq;
    // paso 2: ecuaciones
    $('plPaso2').hidden = pl.paso < 2;
    $('plEcuaciones').innerHTML = P.ECUACIONES.map((e, i) => {
      const cls = pl.paso > 2 && Pr.validas.includes(i) && i === pl.ecu ? ' bien' : pl.malasEc.includes(i) ? ' mal' : '';
      return `<button class="opc ec${cls}" data-i="${i}"${pl.paso !== 2 || cls ? ' disabled' : ''}>${e.html}</button>`;
    }).join('');
    $('plEcuaciones').querySelectorAll('.opc').forEach(b => b.addEventListener('click', () => elegirEcuacion(Number(b.dataset.i))));
    // paso 3: resultado
    $('plPaso3').hidden = pl.paso < 3;
    $('plRotulo3').innerHTML = `${V(Pr.incognita)} =`;
    $('plUnidad3').textContent = Pr.unidad;
    $('plInput3').disabled = pl.paso > 3; $('plComprobar3').disabled = pl.paso > 3;
    if (pl.paso === 3 && document.activeElement !== $('plInput3')) $('plInput3').value = pl.texto;
    const c = $('plCorr'); c.hidden = !pl.msj; if (pl.msj) { c.className = 'correccion ' + pl.msj.clase; c.innerHTML = pl.msj.html; }
    const b = $('plMostrar'); if (b) b.addEventListener('click', mostrarPaso);
    esquema($('plFig'), Pr);
  }
  function comprobarPaso1() {
    const Pr = pl.Pr, marcas = {};
    let primero = null;
    for (const m of P.MAG) {
      const esp = Pr.papeles[m], dado = pl.papeles[m] || '';
      let bien = dado === esp, msj = null;
      if (!dado) msj = 'Elige el papel de cada magnitud: dato, incógnita o no interviene.';
      else if (!bien) msj = esp === 'incognita' ? `Lee otra vez la pregunta: ¿qué magnitud te piden? (${V(m)} no es ${dado === 'dato' ? 'un dato' : 'ajena al problema'}).` : (Pr.avisos[m] || `Revisa el papel de ${V(m)}.`);
      else if (esp === 'dato') {
        const x = leer(pl.valores[m] || ''), real = Pr.completo[m];
        if (!isFinite(x) || pl.valores[m] === undefined || pl.valores[m] === '') { bien = false; msj = `Escribe el valor de ${V(m)} (con su signo).`; }
        else if (!cercano(x, real, 0.01)) {
          bien = false;
          msj = real !== 0 && cercano(-x, real, 0.01) ? (Pr.avisos[m] || `Revisa el signo de ${V(m)}: arriba es positivo.`) : (real === 0 ? (Pr.avisos[m] || `Revisa el valor de ${V(m)}.`) : `Revisa el valor de ${V(m)} en el enunciado (y sus unidades).`);
        }
      }
      marcas[m] = bien ? 'si' : 'no';
      if (!bien && !primero) primero = msj;
    }
    pl.marcas = marcas;
    if (!primero) { pl.paso = 2; pl.msj = { clase: 'bien', html: '<b>Datos bien planteados.</b> Ahora elige la ecuación del Cuadernillo que conviene.' }; }
    else { pl.intentos[1]++; pl.msj = { clase: 'pista', html: `<b>Todavía no.</b> ${primero}` + (pl.intentos[1] >= 3 ? '<br><button class="boton mini" id="plMostrar">Mostrar los datos</button>' : '') }; }
    pintarPlantear();
  }
  function elegirEcuacion(i) {
    const Pr = pl.Pr, e = P.ECUACIONES[i];
    if (Pr.validas.includes(i)) {
      pl.ecu = i; pl.paso = 3;
      const otras = Pr.validas.filter(j => j !== i);
      pl.msj = { clase: 'bien', html: `<b>Bien:</b> contiene la incógnita y solo datos; no aparece ${V(e.falta)}.` + (otras.length ? ` También servía ${P.ECUACIONES[otras[0]].html}.` : '') + (Pr.raiz ? ' Ojo: es de segundo grado, tendrás que elegir la raíz con sentido físico.' : '') + ' Ahora calcula el resultado.' };
    } else {
      pl.malasEc.push(i); pl.intentos[2]++;
      const sobra = e.mags.find(m => Pr.papeles[m] === 'no');
      pl.msj = { clase: 'pista', html: !e.mags.includes(Pr.incognita) ? `<b>No conviene.</b> Esa ecuación no contiene la incógnita ${V(Pr.incognita)}.` : `<b>No conviene.</b> Esa ecuación contiene ${V(sobra)}, que no conoces ni te piden: tendrías dos incógnitas. Busca la que no tiene ${V(sobra)}.` };
    }
    pintarPlantear();
  }
  function comprobarPaso3() {
    const Pr = pl.Pr, txt = $('plInput3').value; pl.texto = txt;
    const x = leer(txt);
    if (!txt.trim() || !isFinite(x)) { pl.msj = { clase: 'pista', html: 'Escribe un número (con coma o punto decimal).' }; pintarPlantear(); return; }
    if (cercano(x, Pr.respuesta, Pr.tol)) { pl.paso = 4; pl.msj = { clase: 'bien', html: `<b>¡Correcto!</b>${Pr.resolucion}` }; }
    else {
      pl.intentos[3]++;
      let extra = Pr.pista;
      if (cercano(-x, Pr.respuesta, Pr.tol)) extra = Pr.incognita === 't' ? 'Un tiempo no puede ser negativo: de las dos raíces, elige la que tiene sentido físico.' : `El valor es correcto, pero revisa el signo: con arriba +, ${Pr.respuesta < 0 ? 'el resultado debe ser negativo' : 'el resultado debe ser positivo'}.`;
      pl.msj = { clase: 'pista', html: `<b>Todavía no.</b> ${extra}` + (pl.intentos[3] >= 2 ? '<br><button class="boton mini" id="plMostrar">Ver resolución</button>' : '') };
    }
    pintarPlantear();
  }
  // tras varios intentos: completa el paso en curso
  function mostrarPaso() {
    const Pr = pl.Pr;
    if (pl.paso === 1) { pl.paso = 2; pl.marcas = {}; pl.msj = { clase: 'solucion', html: 'Estos son los datos con su signo (arriba +). Ahora elige la ecuación.' }; }
    else if (pl.paso === 3) { pl.paso = 4; pl.msj = { clase: 'solucion', html: `<b>Resolución.</b>${Pr.resolucion}` }; }
    pintarPlantear();
  }
  $('plComprobar1').addEventListener('click', comprobarPaso1);
  $('plComprobar3').addEventListener('click', comprobarPaso3);
  $('plInput3').addEventListener('keydown', (e) => { if (e.key === 'Enter') comprobarPaso3(); });
  $('plNuevo').addEventListener('click', nuevoPlantear);

  /* ======================= Practicar ======================= */
  const pr = { grupo: 'todos', Pr: null, intentos: 0, resuelto: false, malas: [], msj: null, texto: '' };
  function pintarGrupos() {
    $('prGrupos').innerHTML = P.GRUPOS.map(([g, t]) => `<button class="nivel${g === pr.grupo ? ' activo' : ''}" data-g="${g}" aria-pressed="${g === pr.grupo}">${t}</button>`).join('');
    $('prGrupos').querySelectorAll('.nivel').forEach(b => b.addEventListener('click', () => { pr.grupo = b.dataset.g; pintarGrupos(); nuevoPracticar(); }));
  }
  function nuevoPracticar() {
    pr.Pr = P.aleatorio(P.LISTA, pr.grupo, pr.Pr && pr.Pr.id); prepararFigura(pr.Pr);
    Object.assign(pr, { intentos: 0, resuelto: false, malas: [], msj: null, texto: '' });
    pintarPracticar();
  }
  function pintarPracticar() {
    const Pr = pr.Pr;
    $('prTermino').textContent = Pr.termino;
    $('prGrupo').textContent = (P.GRUPOS.find(g => g[0] === Pr.grupo) || [, ''])[1];
    $('prTexto').innerHTML = Pr.texto;
    if (Pr.opciones) {
      $('prResp').innerHTML = Pr.opciones.map((o, j) => {
        const cls = pr.resuelto && o[1] ? ' bien' : pr.malas.includes(j) ? ' mal' : '';
        return `<button class="opc texto${cls}" data-j="${j}"${pr.resuelto || cls ? ' disabled' : ''}>${o[0]}</button>`;
      }).join('');
      $('prResp').querySelectorAll('.opc').forEach(b => b.addEventListener('click', () => elegirOpcion(Number(b.dataset.j))));
    } else {
      $('prResp').innerHTML = `<div class="valor-resp"><input id="prInput" inputmode="decimal" autocomplete="off" aria-label="Tu respuesta"${pr.resuelto ? ' disabled' : ''} value="${pr.texto}"><span>${Pr.unidad}</span><button class="boton mini primario" id="prComprobar"${pr.resuelto ? ' disabled' : ''}>Comprobar</button></div>`;
      $('prComprobar').addEventListener('click', comprobarPracticar);
      $('prInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') comprobarPracticar(); });
    }
    const c = $('prCorr'); c.hidden = !pr.msj; if (pr.msj) { c.className = 'correccion ' + pr.msj.clase; c.innerHTML = pr.msj.html; }
    const b = $('prVerRes'); if (b) b.addEventListener('click', () => { pr.resuelto = true; pr.msj = { clase: 'solucion', html: `<b>Resolución.</b>${Pr.resolucion}` }; pintarPracticar(); });
    esquema($('prFig'), Pr);
  }
  function comprobarPracticar() {
    const Pr = pr.Pr, txt = $('prInput').value; pr.texto = txt;
    const x = leer(txt);
    if (!txt.trim() || !isFinite(x)) { pr.msj = { clase: 'pista', html: 'Escribe un número (con coma o punto decimal).' }; pintarPracticar(); return; }
    if (cercano(x, Pr.respuesta, Pr.tol)) { pr.resuelto = true; pr.msj = { clase: 'bien', html: `<b>¡Correcto!</b>${Pr.resolucion}` }; }
    else {
      pr.intentos++;
      let extra = '';
      if (cercano(-x, Pr.respuesta, Pr.tol)) extra = ' El valor es correcto, pero revisa el signo (arriba +).';
      else if ([100, 1000, 0.01, 0.001].some(f => cercano(x * f, Pr.respuesta, Pr.tol))) extra = ' El número se parece, pero revisa las unidades (cm → m, ms → s).';
      pr.msj = { clase: 'pista', html: `<b>Todavía no.</b> ${Pr.pista}${extra}` + (pr.intentos >= 2 ? '<br><button class="boton mini" id="prVerRes">Ver resolución</button>' : '') };
    }
    pintarPracticar();
  }
  function elegirOpcion(j) {
    const Pr = pr.Pr, o = Pr.opciones[j];
    if (o[1]) { pr.resuelto = true; pr.msj = { clase: 'bien', html: `<b>¡Correcto!</b> ${Pr.explicacion}` }; }
    else { pr.malas.push(j); pr.msj = { clase: 'pista', html: `<b>No es así.</b> ${o[2]}` }; }
    pintarPracticar();
  }
  $('prNuevo').addEventListener('click', nuevoPracticar);

  /* ---------- Al mostrar cada pestaña ---------- */
  function mostrar(parte) {
    if (parte === 'construir') { if (!pl.Pr) nuevoPlantear(); else pintarPlantear(); }
    if (parte === 'practicar') { if (!pr.Pr) { pintarGrupos(); nuevoPracticar(); } else pintarPracticar(); }
  }
  new ResizeObserver(() => {
    if (!$('panel-construir').hidden && pl.Pr) esquema($('plFig'), pl.Pr);
    if (!$('panel-practicar').hidden && pr.Pr) esquema($('prFig'), pr.Pr);
  }).observe(document.body);
  window.ProblemasUI = { mostrar, pl, pr, nuevoPlantear, nuevoPracticar };
})();
