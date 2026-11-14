/* Catálogo del laboratorio.
   Añadir una simulación = crear su carpeta en sims/ y añadir una entrada en «simulaciones».
   «ns: true» marca un subtema que es entero de NS. */

window.CATALOGO = {
  temas: [
    { codigo: "A", nombre: "Espacio, tiempo y movimiento", subtemas: [
      { codigo: "A.1", nombre: "Cinemática" },
      { codigo: "A.2", nombre: "Fuerzas y cantidad de movimiento" },
      { codigo: "A.3", nombre: "Trabajo, energía y potencia" },
      { codigo: "A.4", nombre: "Movimiento de cuerpos rígidos", ns: true },
      { codigo: "A.5", nombre: "Relatividad galileana y especial", ns: true }
    ]},
    { codigo: "B", nombre: "La perspectiva de partículas de la materia", subtemas: [
      { codigo: "B.1", nombre: "Transferencia de energía térmica" },
      { codigo: "B.2", nombre: "Efecto invernadero" },
      { codigo: "B.3", nombre: "Leyes de los gases" },
      { codigo: "B.4", nombre: "Termodinámica", ns: true },
      { codigo: "B.5", nombre: "Corriente y circuitos" }
    ]},
    { codigo: "C", nombre: "Ondas", subtemas: [
      { codigo: "C.1", nombre: "Movimiento armónico simple" },
      { codigo: "C.2", nombre: "Modelo de onda" },
      { codigo: "C.3", nombre: "Fenómenos ondulatorios" },
      { codigo: "C.4", nombre: "Ondas estacionarias y resonancia" },
      { codigo: "C.5", nombre: "Efecto Doppler" }
    ]},
    { codigo: "D", nombre: "Campos", subtemas: [
      { codigo: "D.1", nombre: "Campos gravitatorios" },
      { codigo: "D.2", nombre: "Campos eléctricos y magnéticos" },
      { codigo: "D.3", nombre: "Movimiento en campos electromagnéticos" },
      { codigo: "D.4", nombre: "Inducción", ns: true }
    ]},
    { codigo: "E", nombre: "Física nuclear y cuántica", subtemas: [
      { codigo: "E.1", nombre: "Estructura del átomo" },
      { codigo: "E.2", nombre: "Física cuántica", ns: true },
      { codigo: "E.3", nombre: "Desintegración radiactiva" },
      { codigo: "E.4", nombre: "Fisión" },
      { codigo: "E.5", nombre: "Fusión y estrellas" }
    ]}
  ],

  simulaciones: [
    {
      subtema: "A.1",
      titulo: "Un movimiento, tres gráficas",
      descripcion: "Explora el movimiento de un carrito y sus gráficas posición–tiempo, velocidad–tiempo y aceleración–tiempo; construye tu propio movimiento y practica con ejercicios que se corrigen al momento.",
      ficha: "A.1 · Ficha 1.3.4–1.3.6",
      ruta: "sims/A.1-tres-graficas/",
      miniatura: "sims/A.1-tres-graficas/miniatura.svg",
      palabras: "gráficas posición desplazamiento velocidad aceleración pendiente área carrito cinemática"
    },
    {
      subtema: "A.1",
      titulo: "Movimiento de proyectiles",
      descripcion: "Lanza una bola con un lanzador de laboratorio: componentes de la velocidad, tiempo de vuelo, alcance y altura máxima. Acierta al blanco y practica con ejercicios que se corrigen al momento.",
      ficha: "A.1 · Proyectiles",
      ruta: "sims/A.1-proyectiles/",
      miniatura: "sims/A.1-proyectiles/miniatura.svg",
      palabras: "proyectil proyectiles lanzamiento horizontal oblicuo parabólico tiro componentes alcance altura máxima tiempo de vuelo resistencia del aire cinemática"
    }
  ],

  enlaces: [
    {
      titulo: "Práctica de past papers",
      url: "https://script.google.com/macros/s/AKfycbxDHmHfbRNaGnRdTrSKG6PamDaMl_wWhwGceZfeOowrxNBUlfYSZgq5N6ZK6btmq1Oo/exec"
    }
  ]
};
