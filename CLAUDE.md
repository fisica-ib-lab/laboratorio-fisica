# Laboratorio de Física IB — instrucciones del proyecto

Sitio estático publicado con GitHub Pages (rama `main`, carpeta raíz):
https://fisica-ib-lab.github.io/laboratorio-fisica/

Autor: Guillermo Escalante (profesor de Física IB, PD, NM y NS). Todo en **español**, para alumnos de 16 a 18 años.
El sitio acompaña las fichas del proyecto «Material de trabajo 2027» (carpeta de Drive «Física IB — Materiales»).

## Estructura

- `index.html` — portal tipo PhET: barra lateral izquierda con temas A–E desplegables y sus subtemas (A.1 Cinemática…);
  a la derecha, tarjetas con miniatura, título y referencia a la ficha («A.1 · Ficha 1.3.4–1.3.6»); buscador;
  temas sin simulaciones en gris («próximamente»).
- Enlace fijo en el menú: **«Práctica de past papers»** → https://script.google.com/macros/s/AKfycbxDHmHfbRNaGnRdTrSKG6PamDaMl_wWhwGceZfeOowrxNBUlfYSZgq5N6ZK6btmq1Oo/exec
  (se abre en pestaña nueva; las apps de Apps Script no se pueden incrustar).
- `sims/<codigo>-<nombre>/index.html` — cada simulación es una página aparte con botón para volver al portal.
- `catalogo.js` (o `.json`) — lista de simulaciones que alimenta el portal; añadir una simulación = carpeta nueva + una entrada.
- Sin servidor, sin cuentas, sin guardar datos de alumnos. Debe funcionar en computadora, proyector y celular.

## Diseño (igual que las figuras de las fichas)

- Fondo blanco. Rótulos en «píldora» redondeada: relleno azul muy claro, borde azul, texto azul marino oscuro.
- Colores por función: azul = posición y estructura; **naranja** = desplazamiento; **verde** = velocidad; **rojo** = aceleración y Δv.
- Tipografía Calibri con alternativa métrica Carlito; variables en cursiva; flechas con punta triangular sólida y trazo grueso.
- Coma decimal, unidades del SI, convención de signos: derecha y arriba +, izquierda y abajo −. Nada en inglés.

## Estilo de las animaciones (obligatorio en todas las simulaciones y miniaturas)

Referencia viva: la escena de `sims/A.1-tres-graficas/dibujo.js` (`crearEscena`) y su `miniatura.svg`.
Ilustración plana de montaje de laboratorio, con «un poquito» de detalle y sin recargar.

- **Trazo y relleno:** objetos con contorno oscuro `#1F2A36` de 1,2–1,5 px y rellenos planos, sin degradados ni sombras.
  Metal: claro `#E4E9EF`, brillo `#F6F8FA`, medio `#8A97A6`, oscuro `#5A6B7D`; aparatos electrónicos en pizarra `#2F3E4E`
  con detalle dorado `#E2B045`; cuerpos móviles en azul claro `#B5CFEC` con franja `#2E74B5`; banderín ámbar `#F2B84B`.
- **Mesa de laboratorio:** franja clara `#EFE8DC` (3 px) sobre franja madera `#D3AC84` (5 px) a todo el ancho.
- **Material real de laboratorio:** pista de aluminio con escala grabada, patas niveladoras y tope; carrito de laboratorio
  con topes y ruedas con rayos; sensor genérico (de movimiento, fuerza, puerta fotoeléctrica…) con cable e interfaz con pantalla.
  Sin marcas ni logotipos (nada de «Vernier», «PASCO»…).
- **Movimiento natural:** las ruedas giran sin deslizar (ángulo = recorrido / radio); un elemento decorativo con resorte
  amortiguado (banderín, cable, cuerda) que reacciona al movimiento y se asienta al pausar; pulsos o luz del sensor solo
  mientras se reproduce. Lo decorativo nunca altera la física ni sugiere una fuerza que no existe; respetar
  `prefers-reduced-motion`.
- **Rótulos:** pocos, en gris `#5A6B7D` a 12 px con línea guía corta («sensor de movimiento»); se atenúan si un objeto pasa encima.
  Magnitudes en píldora con su color (verde *v*, rojo *a*, naranja desplazamiento, azul posición).
- **Tamaño:** dibujar a tamaño base y ampliar todo el dibujo hasta 1,5 veces en pantallas altas; en celular se quita lo
  accesorio (interfaz) y se conserva lo esencial.
- **Miniatura del catálogo:** SVG 320 × 200 con el mismo montaje arriba y las gráficas o el resultado abajo.

## Primera simulación: «Un movimiento, tres gráficas» (A.1)

Carrito en una pista con regla (origen y «derecha +»), flechas de v (verde) y a (roja) a escala, panel de valores en vivo
(t, s, v, a, distancia recorrida, desplazamiento); gráficas s–t, v–t y a–t sincronizadas con línea vertical común;
controles: reproducir/pausar, ±0,1 s, velocidad ×0,25–×2, barra de tiempo, clic en gráfica para saltar.

1. **Explorar**: reposo; v constante (+ y −); acelera desde reposo; frena hasta detenerse; carrito cuesta arriba que sube, se
   detiene y vuelve con a constante; auto entre semáforos; corredor de 100 m; tren entre estaciones; ida y vuelta.
   Herramientas: tangente en s–t (= v), secante arrastrable (v media), tangente en v–t (= a), área bajo v–t con signo
   (= Δs) y sin signo (= distancia), área bajo a–t (= Δv), huellas cada 1 s, modo predicción (ocultar y revelar), rótulos por tramo.
2. **Construir**: hasta 6 tramos (duración, a o v constante, s₀, u) con deslizadores; dibujar la v–t arrastrando puntos; tabla resumen.
3. **Practicar** (ejercicios aleatorios, solo corrección inmediata, sin puntaje): movimiento → v–t; s–t → v–t; v–t → a–t;
   calcular desplazamiento y distancia desde v–t (número + unidad, con tolerancia); calcular pendientes; elegir la descripción;
   desafío «iguala la gráfica». Distractores basados en errores típicos; explicación y botón «ver el movimiento».

**Rigor:** cinemática exacta por tramos (aceleración uniforme), s y v continuas. Antes de publicar, verificar con código
en todas las situaciones y en 1000 ejercicios aleatorios: pendiente s–t = v, pendiente v–t = a, área v–t = Δs,
área a–t = Δv, distancia = suma de recorridos, respuesta correcta = cálculo.

**Estado (13 nov 2026): simulación completa, pendiente de revisión del profesor.**
Archivos: `dibujo.js` (escena y gráficas), `sim.js` (Explorar niveles 1–3 y Construir), `ejercicios.js` (generador de
13 tipos de ejercicio, sin pantalla) y `practicar.js` (pantalla de Practicar). Herramientas de Explorar: «Pendiente»,
«Área», «Vel. media» (secante arrastrable en la s–t), «Huellas» (cada 1 s) y «Predecir» (oculta las gráficas hasta «Revelar»).
No queda nada pendiente del plan original.
Antes de publicar cambios: `node pruebas/verificar-cinematica.js` y `node pruebas/verificar-ejercicios.js` (0 fallos).

## Segunda simulación: «Movimiento de proyectiles» (A.1) — `sims/A.1-proyectiles/`

Montaje: lanzador sujeto al borde de la mesa (ángulo θ, rapidez u, altura h en una varilla con escala), regla sobre la mesa,
bola de acero y bandeja de arena. La escala es la misma en x y en y; la vista se acerca a cada lanzamiento.
Colores: componente horizontal naranja, vertical violeta, velocidad verde, g roja. Cámara lenta por defecto (×0,25).

1. **Explorar**: nivel 1 (lanzamiento horizontal junto a una bola soltada a la vez), nivel 2 (oblicuo desde la mesa, con
   lanzamientos anteriores en gris) y nivel 3 (desde una altura, con comparación **cualitativa** con resistencia del aire:
   la bola «con aire» nunca muestra valores). Cuatro gráficas: x–t, y–t, vx–t, vy–t. Casillas: componentes, velocidad,
   aceleración, huellas cada 0,1 s.
2. **Acierta al blanco** (pestaña Construir): bandeja en una posición al azar que siempre tiene solución en la cuadrícula
   de los deslizadores; intentos marcados; modo «Calcula primero» (rapidez fija).
3. **Practicar**: 12 tipos (calcular, interpretar, gráficas y trayectorias, «coloca la bandeja»), con pista según el error.

Archivos: `comun/proyectil.js` (física exacta; con aire, Runge–Kutta 4 con k = 0,30 m⁻¹), `comun/graficas.js` (dibujo común
para simulaciones nuevas), `escena.js`, `sim.js`, `ejercicios.js`, `practicar.js`.
Antes de publicar cambios: `node pruebas/verificar-proyectiles.js` y `node pruebas/verificar-ejercicios-proyectiles.js` (0 fallos).
**Estado (13 nov 2026): completa, pendiente de revisión del profesor.** Falta saber a qué apartados de la ficha A.1 corresponde
(la tarjeta dice «A.1 · Proyectiles»).

## Tercera simulación: «Ecuaciones del movimiento y caída libre» (A.1) — `sims/A.1-caida-libre/`

Montaje vertical: varilla con escala, electroimán que suelta la bola o lanzador vertical, puerta fotoeléctrica móvil con
cable e interfaz que muestra los tiempos de paso. Arriba +; s se mide desde el punto de salida (naranja).

**Hecho (13 nov 2026): solo Explorar**, pendiente de revisión del profesor. Nivel 1 caída desde el reposo (huellas cada 0,1 s
con las distancias 1 : 3 : 5), nivel 2 lanzamiento hacia arriba, nivel 3 tabla de las cuatro ecuaciones del Cuadernillo
(✓/✗ de s, u, v, a, t) con los valores de cada instante sustituidos.
**Falta:** pestaña «Plantear problemas» (marcar datos e incógnita → ecuación que conviene) y «Practicar»; ahora dicen «próximamente».
Usa `comun/proyectil.js` (θ = 90° o u = 0). Verificación: `node pruebas/verificar-caida-libre.js`.
La tarjeta dice «A.1 · Aceleración uniforme» (falta saber los apartados de la ficha).

## Cuarta simulación: «Diagramas de cuerpo libre y segunda ley» (A.2) — `sims/A.2-fuerzas/`

Plan aprobado por el profesor (16 nov 2026). Siete montajes con selector: bloque en la mesa tirado por un dinamómetro
(fuerza constante, que crece poco a poco o que se suelta en 1 s; ángulo opcional), plano inclinado (con velocidad inicial
hacia arriba opcional), persona sobre una balanza en un ascensor (viaje de subida/bajada o aceleración constante, hasta caída
libre), máquina de Atwood con la polea colgada de un dinamómetro (marca 2F_T), bloque con masa colgante, cuerpo colgado de
dos cuerdas con un dinamómetro en cada una, y esfera de acero o vidrio en glicerina o aceite de ricino (Stokes, Re < 1).

Convenciones: símbolos **F_g** (peso), F_N, F_f, F_T, F_H, F_b, F_d con subíndice recto; colores por fuerza en `escena.js`
(`FZ`). **Todas las flechas salen del borde del cuerpo y están alineadas con su centro** (si se prolongan, pasan por el centro),
como en las figuras del profesor; las componentes salen del mismo punto. Dos fuerzas con la misma dirección y sentido sobre
el mismo cuerpo (empuje y arrastre) se separan 5 px para que no se pisen. Igual en el panel «Diagrama de cuerpo libre»
(modelo de partícula). La **fuerza neta va en un recuadro aparte, nunca dentro del diagrama**. Tabla «quién la ejerce → sobre quién».
Rigor: F_f estático = lo necesario para el reposo, ≤ μs F_N; al llegar a v = 0 el bloque se detiene y se vuelve a evaluar
(no retrocede); μd ≤ μs forzado en los controles; F_H sen θ ≤ 0,95 mg (el bloque no se despega).

Archivos: `comun/dinamica.js` (física, sin pantalla), `niveles.js` (situaciones y preguntas, sin pantalla), `escena.js`
(montajes, diagrama, barras, triángulo de fuerzas), `sim.js`.
Verificación: `node pruebas/verificar-dinamica.js` (≈2,4 millones de comprobaciones contra fórmulas analíticas) y
`node pruebas/verificar-niveles-fuerzas.js` (cada situación hace lo que dicen las preguntas y cada respuesta numérica
coincide con lo que mide la simulación). Las dos con 0 fallos antes de publicar.

**Hecho: etapas 1, 2, 3 (16 nov 2026) y 4 (17 nov 2026)**, pendientes de revisión del profesor.
- Etapa 1: los siete montajes en «Laboratorio libre» (selector de montajes y todos los deslizadores).
- Etapa 2: Explorar por niveles (34 preguntas): 1 Equilibrio y primera ley (riel sin rozamiento, velocidad constante con
  rozamiento, ascensor a velocidad constante, dos cuerdas, velocidad terminal); 2 Rozamiento (F_f estático = lo necesario,
  salto de μs F_N a μd F_N, soltar y frenar sin retroceder); 3 Plano y ascensor (normal mg cos θ, sentido del rozamiento,
  ángulo límite, fuerza con ángulo, balanza al arrancar y frenar, caída libre); 4 Sistemas unidos (Atwood, polea con
  dinamómetro, masas iguales, bloque con masa colgante, masa límite). Tarjeta de pregunta en el lateral (en celular, antes
  del montaje): opciones con comentario por error y explicación al acertar; valores con ±2 % calculados con los deslizadores
  actuales, pista y «Ver resolución» tras dos errores. «oculta» esconde el dato que daría la respuesta (μd, μs, ángulo límite).
- Etapa 3 (16 nov 2026): **Construir**, pendiente de revisión del profesor.
  Reto 1 «Diagrama de cuerpo libre» (12 situaciones: bloque en reposo, tirado, después de soltar, quieto/subiendo/bajando
  en el plano, persona en el ascensor que arranca hacia abajo, masa colgante, bloque unido a la masa colgante, dos cuerdas,
  esfera en glicerina, bloque sobre un carrito que acelera). Zona de trabajo con el cuerpo aislado (y el montaje al lado);
  las fichas se arrastran desde el banco (o se tocan) y la flecha se gira y alarga arrastrando su punta (cuadrícula de 5°);
  se quita soltándola sobre el cuerpo, con «Quitar flecha» o Supr. Banco con las siete fuerzas + distractores («fuerza del
  movimiento», «de inercia», «neta» y otros por situación). Las fuerzas correctas salen del modelo en ese instante
  (`construir-corrector.js`), salvo el carrito. Corrección en orden: distractor → sobra/repetida → falta (pista gradual:
  «falta una fuerza» → de contacto/a distancia → cuál) → dirección (±10°). «Ver solución» tras tres intentos.
  Reto 2 «Parejas de tercera ley» (9 preguntas): construir la pareja (quién, sobre quién, tipo, sentido, módulo) con los
  cuatro criterios marcados ✓/✗, y preguntas de opción (peso y normal, choque camión–auto, balanza del ascensor, Atwood).
  Archivos: `construir-datos.js`, `construir-corrector.js` (sin pantalla) y `construir.js`.
  Verificación: `node pruebas/verificar-construir-fuerzas.js` (0 fallos).
  Longitudes (17 nov 2026, pedido del profesor): además de cuáles y su dirección, se corrigen las longitudes, juzgadas a lo
  largo de la dirección correcta: en equilibrio las flechas se compensan (|ΣL| ≤ 25 % de la más larga); si acelera, la suma
  apunta hacia la aceleración (≥ 8 %) y en perpendicular se compensan (≤ 25 %). «Ver solución» dibuja longitudes proporcionales.
- Etapa 4 (17 nov 2026): **Practicar**, pendiente de revisión del profesor. 19 tipos de ejercicio con datos al azar
  (`practicar-ejercicios.js`, sin pantalla) y término de instrucción del IB (Calcula, Determina, Explica): aceleración en la
  mesa, con fuerza oblicua y en el plano; ¿desliza o no? y valor del rozamiento; normal con fuerza oblicua; μd con velocidad
  constante; ángulo límite y μs a partir del ángulo; lectura de la balanza (sube/baja, acelera/frena); Atwood (a, F_T,
  dinamómetro de la polea); masa colgante (a, F_T); tensión en dos cuerdas; constante elástica (figura propia del resorte);
  velocidad terminal y viscosidad; y «Explica» (8 preguntas de razonamiento con comentario por opción). Filtros por grupo.
  Figura = montaje sin fuerzas ni lecturas (`sinLecturas`); al resolverlo se ven las fuerzas. ±2 %, pista (también para
  signo y unidades sin convertir), «Ver resolución» paso a paso tras dos errores. Sin puntaje.
  Verificación: `node pruebas/verificar-practicar-fuerzas.js` (1000 ejercicios por tipo: la respuesta coincide con lo que mide
  el modelo con los mismos datos; 0 fallos).
**Simulación A.2 completa (etapas 1–4)**, pendiente de revisión del profesor.

## Materiales para docentes — `materiales/`

`materiales/index.html` (página de venta) muestra las tres piezas incrustadas en filas alternadas (descripción angosta | visor ancho, `ver/?…&incrustado`) y enlaza al visor `materiales/ver/?sub=A.1&doc=alumno|docente|presentacion&p=N`:
fichas como cuaderno (doble página con giro de hoja; una página en celular) y diapositivas como presentación (tira de miniaturas,
las ocultas marcadas «Solución»). Ficha del alumno, versión docente y presentación **completas**, en imágenes WebP con marca de
agua grabada («IB Seven · Física IB» en diagonal y línea de contacto); el profesor quiere que se vean enteras y en alta resolución.
Imágenes y datos en `materiales/<subtema>/` (`datos.js` con páginas, secciones y diapositivas ocultas). Se generan desde los
archivos de «03 Materiales finales/Tema A» con LibreOffice (necesita `libreoffice-math` para las ecuaciones) → PDF → 170 ppp.
Imágenes nuevas: `python3 herramientas/vista-previa.py ARCHIVO.pdf materiales/<código>/<doc>` (WebP con marca «IB Seven · Física IB»
y abajo solo «Muestra · IB Seven», **sin nombres ni Telegram**; las de A.1 se corrigieron así el 17 nov 2026).
El visor carga cada `datos.js` con una etiqueta `<script>` propia en `ver/index.html`; cada material puede definir `volver`,
`accion` (botón amarillo), y en cada documento `marcadas`, `marcaCorta` y `marcaLarga` (por defecto, soluciones ocultas).

**Catálogo (17 nov 2026):** todo el Tema A figura como completo. Cada fila se despliega con lo que trae el subtema
(`materiales/contenido.js`: páginas, apartados, ejemplos, práctica y preguntas tipo examen, sacados de la ficha del alumno final).
«Ver completo» solo en A.1 (objeto `MUESTRA` del script). Añadir un subtema listo = una entrada en `contenido.js`.

**Voz de empresa:** los textos públicos hablan como IB Seven («te enviamos», «escríbenos»), nunca en primera persona del profesor
ni con su nombre.

**Recursos gratuitos «Física NM · Noviembre 2026» — `materiales/noviembre-2026/`** (la antigua `prueba1-noviembre-2026/`
redirige aquí): pestañas Prueba 1A, 1B y 2 sobre un visor incrustado (`ver/?sub=N26-P1A|N26-P1B|N26-P2&doc=presentacion`,
imágenes en `materiales/N26-*`; `?prueba=1a|1b|2` abre una pestaña) y, debajo, un **registro único** con casillas para elegir
qué recibir. El navegador recuerda al docente (`localStorage` «ibseven-registro-recursos»; no usar «ibseven-docente», que
borra `comun/docentes.js`) y marca «ya enviado»; si vuelve, solo pulsa enviar. Recurso nuevo = imágenes con
`herramientas/vista-previa.py` + `datos.js` (secciones por OCR) + una entrada en `RECURSOS` de la página + una fila en la
pestaña «Recursos» de la hoja (nombre idéntico, ID de Drive, nombre del PDF, Activo). El formulario envía a la aplicación web
de Apps Script `herramientas/registro-docentes.gs` (versión 2: una fila por docente en «Registros», junta los PDF en correos
de ≤ 18 MB, aviso al profesor con enlace de WhatsApp; versión 3: `enviarNovedades` diario ≈ 8 a. m. con los recursos publicados después del registro, columna E «Publicado» de «Recursos»); su URL va en `REGISTRO_URL` (hoja «IB Seven · Registros de docentes»
de ibseven.oficial). Anuncio verde «Gratis para docentes» en el portal (vista de docentes) y tarjeta en la página de materiales.

## Fases (revisión del profesor entre cada una)

1. Portal + Explorar (3–4 situaciones). 2. Herramientas de gráficas. 3. Construir. 4. Practicar + desafío.
5. Verificación final, publicación, copia en Drive («03 Materiales finales/Laboratorio») y código QR.

## Publicación

Toda página nueva lleva `<link rel="icon" type="image/png" href="…/favicon.png?v=1">` (ruta relativa a la raíz).

Commits directos a `main` (GitHub Pages publica solo). Mensajes de commit en español.
**Antes de cada commit que se publique: `node herramientas/sellar-version.js`.** Pone `?v=AAAAMMDDhhmm` en todos los .js y .css
locales de las páginas, para que los navegadores descarguen los archivos nuevos en vez de usar la copia guardada (GitHub Pages
deja que el navegador guarde cada archivo unos 10 minutos; con el sello, a lo sumo la página tarda eso en renovarse).
Archivo nuevo de .js o .css enlazado desde una página: el sello se le pone solo al ejecutar el script.
Los alumnos no deben ver respuestas fuera de la corrección del ejercicio que están resolviendo.
