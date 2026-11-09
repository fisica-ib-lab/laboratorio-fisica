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
