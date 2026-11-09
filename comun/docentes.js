/* Muestra los accesos para docentes solo a quien entra con el enlace «?docentes» (o ya entró así antes).
   Los alumnos ven el laboratorio sin anuncios. */
(function () {
  var conEnlace = /[?&]docentes(=|&|$)/.test(location.search) || /\/materiales\//.test(location.pathname);
  try {
    if (conEnlace) localStorage.setItem('ibseven-docente', '1');
    if (conEnlace || localStorage.getItem('ibseven-docente')) document.documentElement.classList.add('docente');
  } catch (e) {
    if (conEnlace) document.documentElement.classList.add('docente');
  }
})();

/* Para docentes, los enlaces a la plataforma de past papers abren el modo invitado (muestra de A.1). */
document.addEventListener('DOMContentLoaded', function () {
  if (!document.documentElement.classList.contains('docente')) return;
  document.querySelectorAll('a[href*="script.google.com/macros"]').forEach(function (a) {
    if (a.href.indexOf('invitado') < 0) a.href = a.href + (a.href.indexOf('?') < 0 ? '?' : '&') + 'invitado=1';
  });
});
