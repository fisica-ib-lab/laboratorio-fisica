/* Vista de docente: solo con el enlace «?docentes» y solo mientras esa pestaña siga abierta.
   Los alumnos ven el laboratorio sin nada de docentes (pero con Past papers). */
(function () {
  // Solo dura mientras la pestaña esté abierta (sessionStorage): al cerrarla, el sitio vuelve a la vista de alumnos.
  // «?alumnos» en el enlace quita la vista de docente al instante.
  var q = location.search;
  var conEnlace = /[?&]docentes(=|&|$)/.test(q) || /\/materiales\//.test(location.pathname);
  var quitar = /[?&]alumnos?(=|&|$)/.test(q);
  try { localStorage.removeItem('ibseven-docente'); } catch (e) {}
  var docente = conEnlace;
  try {
    if (quitar) sessionStorage.removeItem('ibseven-docente');
    else if (conEnlace) sessionStorage.setItem('ibseven-docente', '1');
    docente = !quitar && (conEnlace || sessionStorage.getItem('ibseven-docente') === '1');
  } catch (e) {}
  if (docente) document.documentElement.classList.add('docente');
})();

/* Para docentes, los enlaces a la plataforma de past papers abren el modo invitado (muestra de A.1). */
document.addEventListener('DOMContentLoaded', function () {
  if (!document.documentElement.classList.contains('docente')) return;
  document.querySelectorAll('a[href*="script.google.com/macros"]').forEach(function (a) {
    if (a.href.indexOf('invitado') < 0) a.href = a.href + (a.href.indexOf('?') < 0 ? '?' : '&') + 'invitado=1';
  });
});
