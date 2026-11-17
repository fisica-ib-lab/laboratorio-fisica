/**
 * Registro de docentes y envío de recursos gratuitos · IB Seven
 *
 * Recibe el formulario de materiales/prueba1-noviembre-2026/, guarda una fila en la hoja «Registros»
 * y envía al docente el PDF de la presentación como adjunto (así el correo queda comprobado).
 *
 * Cómo instalarlo (una sola vez):
 *  1. En Google Drive: Nuevo → Hojas de cálculo. Nómbrala «IB Seven · Registros de docentes».
 *  2. En esa hoja: Extensiones → Apps Script. Borra lo que haya y pega este archivo completo. Guarda.
 *  3. Implementar → Nueva implementación → tipo «Aplicación web».
 *     Ejecutar como: «Yo». Quién tiene acceso: «Cualquier usuario». Implementar y aceptar los permisos.
 *  4. Copia la URL de la aplicación web (termina en /exec) y pégala en REGISTRO_URL de
 *     materiales/prueba1-noviembre-2026/index.html.
 *
 * Para un recurso nuevo: añade una entrada en RECURSOS con el ID del archivo de Drive
 * (Presentaciones de Google, Documentos o PDF) y usa ese nombre en el campo oculto «recurso» del formulario.
 * Límite de Gmail personal: unos 100 correos al día.
 */

const RECURSOS = {
  'Prueba 1 NM · Noviembre 2026': {
    archivo: '1cnVQugoPlXnbGrTeDh_RliYBz7S7JlkNgseRedb4Diw',      // «Noviembre 2026 Fisica Prueba 1 NM» (Presentaciones de Google)
    nombrePdf: 'IB Seven · Física NM · Prueba 1 · Noviembre 2026 resuelta.pdf',
    asunto: 'Tu Prueba 1 NM de noviembre de 2026 resuelta · IB Seven',
  },
};
const AVISAR_A = 'ibseven.oficial@gmail.com';   // recibe un aviso por cada registro nuevo
const ENLACE_MATERIALES = 'https://fisica-ib-lab.github.io/laboratorio-fisica/materiales/';

function doPost(e) {
  const p = (e && e.parameter) || {};
  if (p.sitio) return respuesta_(true);                      // robots
  const correo = String(p.correo || '').trim();
  const recurso = RECURSOS[p.recurso];
  if (!recurso || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) return respuesta_(false);

  const bloqueo = LockService.getScriptLock();
  bloqueo.waitLock(20000);
  try {
    const hoja = hoja_();
    hoja.appendRow([new Date(), limpiar_(p.nombre), correo, limpiar_(p.colegio), limpiar_(p.pais),
                    limpiar_(p.nivel), p.novedades === 'sí' ? 'sí' : 'no', p.recurso, limpiar_(p.celular)]);
  } finally {
    bloqueo.releaseLock();
  }

  const pdf = DriveApp.getFileById(recurso.archivo).getAs('application/pdf').setName(recurso.nombrePdf);
  const nombre = limpiar_(p.nombre).split(' ')[0] || 'colega';
  MailApp.sendEmail({
    to: correo,
    name: 'IB Seven',
    replyTo: AVISAR_A,
    subject: recurso.asunto,
    htmlBody:
      '<p>Hola, ' + nombre + ':</p>' +
      '<p>Gracias por tu interés. Te adjuntamos la presentación <b>' + p.recurso + '</b>, con la resolución paso a paso ' +
      'de cada pregunta, el esquema de calificación y la clave de respuestas.</p>' +
      '<p>También preparamos fichas, solucionarios y presentaciones por subtema de Física IB en español. ' +
      'Puedes hojear A.1 Cinemática completo aquí: <a href="' + ENLACE_MATERIALES + '">' + ENLACE_MATERIALES + '</a></p>' +
      '<p>Si tienes cualquier consulta, responde a este correo o escríbenos por Telegram: @Ibsevenoficial.</p>' +
      '<p>Un saludo,<br>IB Seven · Física IB</p>',
    attachments: [pdf],
  });
  const digitos = String(p.celular || '').replace(/\D/g, '');
  MailApp.sendEmail(AVISAR_A, 'Nuevo registro: ' + p.recurso,
    [limpiar_(p.nombre), correo, 'Celular: ' + (String(p.celular || '').trim() || '—'),
     digitos ? 'WhatsApp: https://wa.me/' + digitos : '', limpiar_(p.colegio), limpiar_(p.pais), limpiar_(p.nivel),
     'Novedades: ' + p.novedades].join('\n'));
  return respuesta_(true);
}

function hoja_() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = libro.getSheetByName('Registros');
  if (!hoja) {
    hoja = libro.insertSheet('Registros');
    hoja.appendRow(['Fecha', 'Nombre', 'Correo', 'Colegio', 'País', 'Enseña', 'Acepta novedades', 'Recurso', 'Celular']);
    hoja.setFrozenRows(1);
    hoja.getRange('1:1').setFontWeight('bold');
  }
  if (!hoja.getRange('I1').getValue()) hoja.getRange('I1').setValue('Celular').setFontWeight('bold');
  return hoja;
}

function limpiar_(t) {
  return String(t || '').trim().replace(/^[=+\-@]/, "'$&").slice(0, 200);   // evita fórmulas (y conserva el + del celular)
}

function respuesta_(ok) {
  return ContentService.createTextOutput(JSON.stringify({ ok: ok })).setMimeType(ContentService.MimeType.JSON);
}

/** Para probar desde el editor: Ejecutar → probar (te llega el correo a ti). */
function probar() {
  doPost({ parameter: { nombre: 'Prueba', correo: AVISAR_A, colegio: 'Colegio de prueba', pais: 'Perú',
                        nivel: 'Física NM y NS', novedades: 'sí', celular: '+51 999 999 999', recurso: 'Prueba 1 NM · Noviembre 2026' } });
}
