/**
 * Registro de docentes y envío de recursos gratuitos · IB Seven  (versión 3, 19 nov 2026)
 *
 * Recibe el formulario de materiales/noviembre-2026/ (uno o varios «recurso»), registra al docente en una sola fila
 * de la pestaña «Registros» (si ya existe su correo, la actualiza) y le envía los PDF sin marca de agua.
 * Qué se puede enviar se lee de la pestaña «Recursos» de la misma hoja: un recurso nuevo = una fila nueva,
 * sin tocar este código.
 *
 * Envío automático: «activarEnvioAutomatico» (una vez) crea un activador diario que manda a los docentes con
 * «Acepta novedades» = sí los recursos activos publicados después de su registro que aún no tienen (columna E de «Recursos»).
 *
 * Instalación: Extensiones → Apps Script de la hoja «IB Seven · Registros de docentes» (¡no la de la plataforma!), pegar
 * este archivo, guardar, ejecutar «instalar» y «activarEnvioAutomatico» una vez y publicar con Implementar →
 * Gestionar implementaciones → editar → Nueva versión.
 */

const AVISAR_A = 'ibseven.oficial@gmail.com';
const ENLACE_MATERIALES = 'https://fisica-ib-lab.github.io/laboratorio-fisica/materiales/';
const MAX_MB_POR_CORREO = 18;   // los adjuntos se reparten en varios correos si pasan de esto (límite de Gmail: 25 MB)

// Solo se usan la primera vez, para llenar la pestaña «Recursos» si está vacía.
const RECURSOS_INICIALES = [
  ['Prueba 1A NM · Noviembre 2026', '1cnVQugoPlXnbGrTeDh_RliYBz7S7JlkNgseRedb4Diw',
   'IB Seven · Física NM · Prueba 1A · Noviembre 2026 resuelta.pdf', 'sí'],
  ['Prueba 1B NM · Noviembre 2026', '1aBpI1PnMuUmCY0J5l6-IoyQJlIeW5FflBhLyVrgMbF0',
   'IB Seven · Física NM · Prueba 1B · Noviembre 2026 resuelta.pdf', 'sí'],
  ['Prueba 2 NM · Noviembre 2026', '1tBFer1MvkUyNWrrtdzV7zy4qq6ZdC-Isr_qrahgL8vA',
   'IB Seven · Física NM · Prueba 2 · Noviembre 2026 resuelta.pdf', 'sí'],
];
// Nombres antiguos que todavía pueden llegar de páginas guardadas en el navegador.
const ALIAS = { 'Prueba 1 NM · Noviembre 2026': 'Prueba 1A NM · Noviembre 2026' };

const COLUMNAS = ['Fecha de registro', 'Nombre', 'Correo', 'Colegio', 'País', 'Enseña', 'Acepta novedades',
                  'Recursos enviados', 'Celular', 'Última solicitud'];

function doPost(e) {
  const p = (e && e.parameter) || {};
  if (p.sitio) return respuesta_(true);                                   // robots
  const correo = String(p.correo || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) return respuesta_(false);

  const disponibles = recursos_();
  const pedidos = [...new Set(((e.parameters && e.parameters.recurso) || [p.recurso]).filter(Boolean)
                    .map(n => ALIAS[n] || n))].filter(n => disponibles[n]);
  if (!pedidos.length) return respuesta_(false);

  const bloqueo = LockService.getScriptLock();
  bloqueo.waitLock(20000);
  let nombre;
  try {
    nombre = registrar_(p, correo, pedidos);
  } finally {
    bloqueo.releaseLock();
  }

  enviar_(correo, String(nombre || 'colega').split(' ')[0], pedidos.map(n => disponibles[n]));

  const digitos = String(p.celular || '').replace(/\D/g, '');
  MailApp.sendEmail(AVISAR_A, 'Nuevo pedido: ' + pedidos.join(', '),
    [limpiar_(p.nombre) || nombre, correo, 'Celular: ' + (String(p.celular || '').trim() || '—'),
     digitos ? 'WhatsApp: https://wa.me/' + digitos : '', limpiar_(p.colegio), limpiar_(p.pais), limpiar_(p.nivel),
     'Novedades: ' + (p.novedades || '—'), '', 'Pidió: ' + pedidos.join(', ')].join('\n'));
  return respuesta_(true);
}

/** Una fila por docente: si el correo ya está, se completa esa fila; si no, se crea. Devuelve el nombre. */
function registrar_(p, correo, pedidos) {
  const hoja = hojaRegistros_();
  const ahora = new Date();
  const celda = hoja.getRange('C:C').createTextFinder(correo).matchCase(false).matchEntireCell(true).findNext();
  if (celda && celda.getRow() > 1) {
    const fila = celda.getRow();
    const v = hoja.getRange(fila, 1, 1, COLUMNAS.length).getValues()[0];
    const previos = String(v[7] || '').split(/\s*,\s*/).filter(Boolean).map(n => ALIAS[n] || n);
    const juntos = [...new Set(previos.concat(pedidos))];
    const nuevos = [v[0], limpiar_(p.nombre) || v[1], v[2], limpiar_(p.colegio) || v[3], limpiar_(p.pais) || v[4],
                    limpiar_(p.nivel) || v[5], p.novedades ? (p.novedades === 'sí' ? 'sí' : 'no') : v[6],
                    juntos.join(', '), limpiar_(p.celular) || v[8], ahora];
    hoja.getRange(fila, 1, 1, COLUMNAS.length).setValues([nuevos]);
    return String(nuevos[1]);
  }
  hoja.appendRow([ahora, limpiar_(p.nombre), correo, limpiar_(p.colegio), limpiar_(p.pais), limpiar_(p.nivel),
                  p.novedades === 'sí' ? 'sí' : 'no', pedidos.join(', '), limpiar_(p.celular), ahora]);
  return limpiar_(p.nombre);
}

/** Envía los PDF, juntando en un mismo correo los que quepan (≤ MAX_MB_POR_CORREO). novedad = envío automático. */
function enviar_(correo, nombre, lista, novedad) {
  const grupos = [];
  let actual = [], peso = 0;
  lista.forEach(r => {
    const pdf = DriveApp.getFileById(r.archivo).getAs('application/pdf').setName(r.pdf);
    const mb = pdf.getBytes().length / 1048576;
    if (actual.length && peso + mb > MAX_MB_POR_CORREO) { grupos.push(actual); actual = []; peso = 0; }
    actual.push({ r: r, pdf: pdf }); peso += mb;
  });
  if (actual.length) grupos.push(actual);

  grupos.forEach((g, i) => {
    const nombres = g.map(x => x.r.nombre);
    const parte = grupos.length > 1 ? ' (' + (i + 1) + ' de ' + grupos.length + ')' : '';
    MailApp.sendEmail({
      to: correo,
      name: 'IB Seven',
      replyTo: AVISAR_A,
      subject: (novedad ? 'Nuevo recurso gratuito: ' + nombres.join(', ') :
               nombres.length === 1 ? 'Tu ' + nombres[0] + ' resuelta' : 'Tus pruebas resueltas de Física NM') +
               ' · IB Seven' + parte,
      htmlBody:
        '<p>Hola, ' + nombre + ':</p>' +
        (novedad ? '<p>Publicamos nuevos recursos gratuitos de Física IB y, como te registraste para recibir novedades, ' +
                   'te los enviamos sin marca de agua:</p><ul>'
                 : '<p>Gracias por tu interés. Te adjuntamos, sin marca de agua:</p><ul>') +
        nombres.map(n => '<li><b>' + n + '</b></li>').join('') + '</ul>' +
        '<p>Cada presentación trae la resolución paso a paso de cada pregunta, el esquema de calificación y las respuestas.</p>' +
        (grupos.length > 1 ? '<p>Por el tamaño de los archivos, te llegan en ' + grupos.length + ' correos.</p>' : '') +
        '<p>También preparamos fichas, solucionarios y presentaciones por subtema de Física IB en español. ' +
        'Puedes hojear A.1 Cinemática completo aquí: <a href="' + ENLACE_MATERIALES + '">' + ENLACE_MATERIALES + '</a></p>' +
        '<p>Si tienes cualquier consulta, responde a este correo o escríbenos por WhatsApp al +51 936 467 998.</p>' +
        '<p>Un saludo,<br>IB Seven · Física IB</p>' +
        (novedad ? '<p style="color:#777;font-size:12px">Si prefieres no recibir más novedades, responde a este correo con la palabra BAJA.</p>' : ''),
      attachments: g.map(x => x.pdf),
    });
  });
}

/** Lee «Recursos»: Recurso | ID del archivo en Drive | Nombre del PDF | Activo (sí/no) | Publicado (fecha).
 *  Una fila nueva sin fecha de publicación recibe la fecha de hoy la primera vez que se lee. */
function recursos_() {
  const hoja = hojaRecursos_();
  const n = Math.max(hoja.getLastRow() - 1, 1);
  const filas = hoja.getRange(2, 1, n, 5).getValues();
  const mapa = {};
  filas.forEach((f, i) => {
    const nombre = String(f[0]).trim(), archivo = String(f[1]).trim();
    if (!nombre || !archivo) return;
    let publicado = fecha_(f[4]);
    if (!publicado) { publicado = new Date(); hoja.getRange(i + 2, 5).setValue(publicado); }
    if (String(f[3]).trim().toLowerCase() !== 'no')
      mapa[nombre] = { nombre: nombre, archivo: archivo, pdf: String(f[2]).trim() || ('IB Seven · ' + nombre + '.pdf'),
                       publicado: publicado };
  });
  return mapa;
}

/** Fecha desde la hoja: objeto Date o texto «dd/mm/aaaa hh:mm». */
function fecha_(v) {
  if (v instanceof Date && !isNaN(v)) return v;
  const m = String(v || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  return m ? new Date(+m[3], +m[2] - 1, +m[1], +(m[4] || 0), +(m[5] || 0)) : null;
}

/** Envío automático: a cada docente con novedades = sí, los recursos publicados después de su registro que le faltan. */
function enviarNovedades() {
  const disponibles = recursos_();
  const hoja = hojaRegistros_();
  const n = hoja.getLastRow();
  if (n < 2) return;
  const datos = hoja.getRange(2, 1, n - 1, COLUMNAS.length).getValues();
  const avisados = [];
  for (let i = 0; i < datos.length; i++) {
    const v = datos[i];
    const correo = String(v[2] || '').trim();
    const registro = fecha_(v[0]);
    if (!correo || correo.toLowerCase() === AVISAR_A || String(v[6]).trim().toLowerCase() !== 'sí' || !registro) continue;
    const tiene = String(v[7] || '').split(/\s*,\s*/).filter(Boolean).map(x => ALIAS[x] || x);
    const faltan = Object.values(disponibles).filter(r => tiene.indexOf(r.nombre) < 0 && r.publicado > registro);
    if (!faltan.length) continue;
    if (MailApp.getRemainingDailyQuota() < faltan.length + 3) break;      // sigue mañana
    enviar_(correo, String(v[1] || 'colega').split(' ')[0], faltan, true);
    hoja.getRange(i + 2, 8).setValue([...new Set(tiene.concat(faltan.map(r => r.nombre)))].join(', '));
    hoja.getRange(i + 2, 10).setValue(new Date());
    avisados.push(v[1] + ' (' + correo + '): ' + faltan.map(r => r.nombre).join(', '));
  }
  if (avisados.length)
    MailApp.sendEmail(AVISAR_A, 'Envío automático: ' + avisados.length + ' docentes', avisados.join('\n'));
}

/** Ejecutar una vez: crea el envío automático diario (≈ 8 a. m.) y hace el primer envío ahora. */
function activarEnvioAutomatico() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'enviarNovedades')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('enviarNovedades').timeBased().everyDays(1).atHour(8).create();
  enviarNovedades();
  SpreadsheetApp.getActiveSpreadsheet().toast('Envío automático activado (todos los días ≈ 8 a. m.).');
}

function hojaRecursos_() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = libro.getSheetByName('Recursos');
  if (!hoja) {
    hoja = libro.insertSheet('Recursos');
    hoja.appendRow(['Recurso (igual que en la página)', 'ID del archivo en Drive', 'Nombre del PDF', 'Activo',
                    'Publicado (para el envío automático)']);
    hoja.setFrozenRows(1);
    hoja.getRange('1:1').setFontWeight('bold');
    RECURSOS_INICIALES.forEach(r => hoja.appendRow(r.concat([new Date()])));
    hoja.autoResizeColumns(1, 5);
  }
  return hoja;
}

function hojaRegistros_() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = libro.getSheetByName('Registros');
  if (!hoja) {
    hoja = libro.insertSheet('Registros');
    hoja.setFrozenRows(1);
  }
  const titulos = hoja.getRange(1, 1, 1, COLUMNAS.length);
  if (titulos.getValues()[0].join('|') !== COLUMNAS.join('|')) titulos.setValues([COLUMNAS]).setFontWeight('bold');
  return hoja;
}

function limpiar_(t) {
  return String(t || '').trim().replace(/^[=+\-@]/, "'$&").slice(0, 200);   // evita fórmulas (y conserva el + del celular)
}

function respuesta_(ok) {
  return ContentService.createTextOutput(JSON.stringify({ ok: ok })).setMimeType(ContentService.MimeType.JSON);
}

/** Ejecutar una vez después de pegar el código: crea la pestaña «Recursos», ordena «Registros» y pide los permisos. */
function instalar() {
  hojaRecursos_();
  hojaRegistros_();
  Object.values(recursos_()).forEach(r => DriveApp.getFileById(r.archivo).getName());
  SpreadsheetApp.getActiveSpreadsheet().toast('Listo: pestañas «Recursos» y «Registros» preparadas.');
}

/** Prueba: te envía a ti las tres presentaciones y deja la fila de prueba en «Registros». */
function probar() {
  doPost({
    parameter: { nombre: 'Prueba', correo: AVISAR_A, colegio: 'Colegio de prueba', pais: 'Perú',
                 nivel: 'Física NM y NS', novedades: 'sí', celular: '+51 999999999' },
    parameters: { recurso: RECURSOS_INICIALES.map(r => r[0]) },
  });
}
