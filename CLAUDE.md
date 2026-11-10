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

Referencia viva: la escena de `sims/A.1-tres-graficas/sim.js` (`dibujarEscena`) y su `miniatura.svg`.
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

## Fases (revisión del profesor entre cada una)

1. Portal + Explorar (3–4 situaciones). 2. Herramientas de gráficas. 3. Construir. 4. Practicar + desafío.
5. Verificación final, publicación, copia en Drive («03 Materiales finales/Laboratorio») y código QR.

## Publicación

Commits directos a `main` (GitHub Pages publica solo). Mensajes de commit en español.
Los alumnos no deben ver respuestas fuera de la corrección del ejercicio que están resolviendo.
