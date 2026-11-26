/*
 * APP — EAFIT People Analytics Lab
 * Pantallas y navegación. La lógica de puntaje vive en motor.js
 * y las preguntas en data/preguntas.js.
 *
 * Pantallas: inicio → configuración (individual o equipos) → misiones →
 *            presentación → juego → resumen → resultados finales → repaso
 */
(function () {
  "use strict";

  var Motor = window.AA_Motor;
  var BANCO = window.AA_BANCO;
  var J = BANCO.juego;       // textos generales del juego

  var main = document.getElementById("contenido");
  var vivo = document.getElementById("vivo");
  var barraFac = document.getElementById("barra-facilitador");
  var btnSonido = document.getElementById("btn-sonido");

  var progreso = Motor.cargar();
  var partida = null;        // partida en curso
  var respondida = null;     // resultado del reto que se acaba de responder
  var vista = {};            // estado de pantalla del reto actual (orden de opciones, marcadas, pista…)
  var config = { n: 1, nombres: ["Equipo 1", "Equipo 2", "Equipo 3"] };
  var reloj = { id: null, restante: 0, intervalo: null, pausado: false };
  var esFacilitador = /[?&]facilitador=1/.test(location.search) || location.hash === "#facilitador";

  /* ---------- utilidades ---------- */
  function e(texto) {
    return String(texto).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function anunciar(texto) { vivo.textContent = ""; setTimeout(function () { vivo.textContent = texto; }, 50); }

  function pintar(html, clase) {
    if (!partida || respondida) { detenerReloj(); }
    main.className = clase || "";
    main.innerHTML = html;
    window.scrollTo(0, 0);
    var h1 = main.querySelector("h1");
    if (h1) { h1.setAttribute("tabindex", "-1"); h1.focus({ preventScroll: true }); }
  }

  function itemPorId(id) {
    for (var i = 0; i < BANCO.items.length; i++) { if (BANCO.items[i].id === id) { return BANCO.items[i]; } }
    return null;
  }

  function opcionesDe(item) {
    return item.tipo === "clasificar" ? Motor.mision(BANCO, item.mision).categorias : item.opciones;
  }

  function textoOpcion(item, id) {
    var lista = opcionesDe(item);
    for (var i = 0; i < lista.length; i++) { if (lista[i].id === id) { return lista[i].texto; } }
    return id;
  }

  /* Texto legible de la respuesta correcta de cualquier ítem (repaso y clave). */
  function textoCorrecta(item) {
    var ids = Array.isArray(item.correcta) ? item.correcta : [item.correcta];
    return ids.map(function (id) { return textoOpcion(item, id); }).join(item.tipo === "ordenar" ? " → " : " · ");
  }

  /* ---------- sala: individual o por equipos ---------- */
  function equipos() { return progreso.sala ? progreso.sala.equipos : []; }
  function nJugadores() { return equipos().length > 1 ? equipos().length : 1; }
  function porEquipos() { return nJugadores() > 1; }
  function nombreDe(j) { return equipos()[j] || "Equipo " + (j + 1); }
  function abierta(m) { return esFacilitador || Motor.desbloqueada(BANCO, progreso, m.id); }

  /* ---------- íconos (trazos simples, heredan el color del texto) ---------- */
  var TRAZOS = {
    visto: '<path d="M4 12.5l5 5L20 6.5"/>',
    equis: '<path d="M6 6l12 12M18 6L6 18"/>',
    alerta: '<path d="M12 3.5l9.5 16.5h-19z"/><path d="M12 10v4.5M12 17.2v.3"/>',
    engranaje: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M18.5 5.5l-2.1 2.1M7.6 16.4l-2.1 2.1"/>',
    alto: '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
    insignia: '<circle cx="12" cy="9" r="6"/><path d="M8.5 14l-1.5 7 5-3 5 3-1.5-7"/>',
    candado: '<rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    bloque: '<rect x="4" y="5" width="16" height="14" rx="1.5"/><path d="M8 10h8M8 14h5"/>',
    reloj: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9.5 2.8h5"/>',
    arriba: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    abajo: '<path d="M12 5v14M6 13l6 6 6-6"/>'
  };
  function icono(nombre) {
    return '<svg class="icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + TRAZOS[nombre] + "</svg>";
  }

  /* ---------- sonido opcional (apagado por defecto) ---------- */
  var audio = null;
  function tono(frecuencia, duracion) {
    if (!progreso.sonido) { return; }
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      var o = audio.createOscillator(), g = audio.createGain();
      o.frequency.value = frecuencia; o.type = "sine";
      g.gain.setValueAtTime(0.08, audio.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duracion);
      o.connect(g); g.connect(audio.destination);
      o.start(); o.stop(audio.currentTime + duracion);
    } catch (err) { /* sin audio disponible: el juego sigue igual */ }
  }
  function pintarSonido() {
    btnSonido.setAttribute("aria-pressed", progreso.sonido ? "true" : "false");
    btnSonido.textContent = "Sonido: " + (progreso.sonido ? "encendido" : "apagado");
  }

  /* ---------- pantalla: inicio ---------- */
  function verInicio() {
    partida = null;
    pintar(
      '<section class="portada"><div class="contenedor">' +
        '<p class="antetitulo">' + e(J.antetitulo) + "</p>" +
        "<h1>" + e(J.nombre) + "</h1>" +
        '<p class="portada__texto">' + e(J.portada) + "</p>" +
        '<div class="acciones">' +
          (progreso.sala
            ? '<button type="button" class="boton boton--claro" data-accion="misiones">Continuar</button>' +
              '<button type="button" class="boton boton--contorno" data-accion="configurar">Partida nueva</button>'
            : '<button type="button" class="boton boton--claro" data-accion="configurar">Empezar</button>') +
        "</div>" +
        '<p class="portada__firma">Inspira Crea Transforma</p>' +
      "</div></section>" +
      '<section class="contenedor" aria-label="Datos del juego"><div class="datos">' +
        '<p class="dato"><strong>5 misiones y 1 reto final</strong><span>Cada misión completada desbloquea la siguiente.</span></p>' +
        '<p class="dato"><strong>Solo o por equipos</strong><span>Un jugador, o dos o tres equipos por turnos.</span></p>' +
        '<p class="dato"><strong>Sin registro</strong><span>El progreso se guarda solo en este dispositivo.</span></p>' +
      "</div></section>"
    );
  }

  /* ---------- pantalla: configuración de la sala ---------- */
  function verConfiguracion() {
    partida = null;
    var modos = [
      { n: 1, texto: "Un jugador", ayuda: "Juegas a tu ritmo." },
      { n: 2, texto: "Dos equipos", ayuda: "Responden por turnos." },
      { n: 3, texto: "Tres equipos", ayuda: "Responden por turnos." }
    ].map(function (m) {
      return '<button type="button" class="opcion' + (config.n === m.n ? " opcion--marcada" : "") + '" data-accion="modo" data-n="' + m.n +
        '" aria-pressed="' + (config.n === m.n ? "true" : "false") + '">' +
        '<span class="opcion__texto">' + m.texto + '</span><span class="opcion__ayuda">' + m.ayuda + "</span></button>";
    }).join("");

    var campos = "";
    if (config.n > 1) {
      for (var i = 0; i < config.n; i++) {
        campos += '<label class="campo"><span>Nombre del equipo ' + (i + 1) + "</span>" +
          '<input type="text" id="equipo-' + i + '" maxlength="18" autocomplete="off" value="' + e(config.nombres[i]) + '"></label>';
      }
      campos = '<div class="campos">' + campos + "</div>" +
        '<p class="nota">Usa nombres de equipo, no nombres de personas. No se envían a ningún lado.</p>';
    }

    pintar(
      '<div class="contenedor">' +
        '<p class="antetitulo">Antes de empezar</p>' +
        "<h1>¿Cómo van a jugar?</h1>" +
        '<div class="opciones opciones--fila" role="group" aria-label="Modo de juego">' + modos + "</div>" +
        campos +
        (progreso.sala && Object.keys(progreso.misiones).length ? '<p class="nota">Al comenzar una partida nueva se borra el progreso guardado.</p>' : "") +
        '<div class="acciones">' +
          '<button type="button" class="boton" data-accion="crear-sala">Comenzar</button>' +
          '<button type="button" class="boton boton--secundario" data-accion="inicio">Volver</button>' +
        "</div>" +
      "</div>"
    );
  }

  function leerNombres() {
    for (var i = 0; i < config.n; i++) {
      var campo = document.getElementById("equipo-" + i);
      var v = campo && typeof campo.value === "string" ? campo.value.trim().slice(0, 18) : "";
      config.nombres[i] = v || "Equipo " + (i + 1);
    }
  }

  function crearSala() {
    if (config.n > 1) { leerNombres(); }
    var sonido = progreso.sonido, sinReloj = progreso.sinReloj;
    progreso = Motor.progresoVacio();
    progreso.sonido = sonido; progreso.sinReloj = sinReloj;
    progreso.sala = { equipos: config.n > 1 ? config.nombres.slice(0, config.n) : [] };
    Motor.guardar(progreso);
    verMisiones();
  }

  /* ---------- tabla de posiciones (calculada en este dispositivo) ---------- */
  function tablaPosiciones(titulo) {
    if (!porEquipos()) { return ""; }
    var puntos = Motor.tabla(progreso, nJugadores());
    var filas = puntos.map(function (p, j) { return { nombre: nombreDe(j), puntos: p }; })
      .sort(function (a, b) { return b.puntos - a.puntos; })
      .map(function (f, i) {
        return "<tr><td>" + (i + 1) + '.</td><th scope="row">' + e(f.nombre) + "</th><td>" + f.puntos + " puntos</td></tr>";
      }).join("");
    return '<table class="tabla"><caption>' + titulo + "</caption><tbody>" + filas + "</tbody></table>";
  }

  /* ---------- pantalla: misiones ---------- */
  function verMisiones() {
    if (!progreso.sala) { return verConfiguracion(); }
    partida = null; respondida = null;
    pintarFacilitador();
    var insignias = 0;
    var tarjetas = BANCO.misiones.map(function (m, i) {
      var p = progreso.misiones[m.id];
      var libre = abierta(m);
      if (p && p.insignia) { insignias += 1; }
      var estado;
      if (!libre) { estado = icono("candado") + "Completa la misión " + i + " para desbloquearla"; }
      else if (p && p.insignia) { estado = icono("insignia") + "Insignia: " + e(m.insignia) + " · " + p.mejor + " puntos"; }
      else if (p && p.completada) { estado = icono("visto") + "Completada · " + p.mejor + " puntos · insignia pendiente"; }
      else if (p) { estado = icono("alerta") + "Detenida por alertas: inténtala de nuevo"; }
      else { estado = "Lista para jugar"; }
      return '<li class="mision' + (libre ? "" : " mision--bloqueada") + '">' +
        '<span class="mision__numero" aria-hidden="true">' + (i + 1) + "</span>" +
        "<h2>" + (i === BANCO.misiones.length - 1 ? "Reto final · " : "") + e(m.titulo) + "</h2>" +
        '<p class="mision__resumen">' + e(m.resumen) + "</p>" +
        '<div class="mision__pie"><span class="mision__estado">' + estado + "</span>" +
        (libre ? '<button type="button" class="boton' + (p && p.completada ? " boton--secundario" : "") + '" data-accion="presentar" data-mision="' + m.id + '">' +
          (p ? "Jugar de nuevo" : "Jugar") + '<span class="solo-lectores">: ' + e(m.titulo) + "</span></button>" : "") +
        "</div></li>";
    }).join("");

    pintar(
      '<div class="contenedor">' +
        '<p class="antetitulo">' + e(J.lugar) + "</p>" +
        "<h1>Misiones</h1>" +
        '<p class="marcador">' +
          (porEquipos() ? "" : "<span>Puntaje total: " + Motor.puntajeTotal(progreso) + "</span>") +
          "<span>Insignias: " + insignias + " de " + BANCO.misiones.length + "</span></p>" +
        tablaPosiciones("Tabla de posiciones") +
        '<ol class="lista-misiones">' + tarjetas + "</ol>" +
        '<div class="acciones">' +
          (Motor.todasCompletas(BANCO, progreso) ? '<button type="button" class="boton" data-accion="resultados">Ver resultados finales</button>' : "") +
          (progreso.fallados.length ? '<button type="button" class="boton boton--secundario" data-accion="repaso">Repasa estos conceptos (' + progreso.fallados.length + ")</button>" : "") +
          '<button type="button" class="boton boton--texto" data-accion="borrar">Borrar mi progreso</button>' +
        "</div>" +
      "</div>"
    );
  }

  /* ---------- pantalla: presentación de la misión ---------- */
  function verPresentacion(misionId) {
    var m = Motor.mision(BANCO, misionId);
    if (!m || !abierta(m)) { return verMisiones(); }
    var n = Motor.indiceMision(BANCO, misionId) + 1;
    pintar(
      '<div class="contenedor">' +
        '<p class="antetitulo">Misión ' + n + " de " + BANCO.misiones.length + "</p>" +
        "<h1>" + e(m.titulo) + "</h1>" +
        '<p class="intro__instruccion">' + e(m.instruccion) + "</p>" +
        '<ul class="reglas">' +
          (porEquipos() ? "<li><strong>Turnos:</strong> en cada reto responde un equipo. Empieza " + e(nombreDe((n - 1) % nJugadores())) + ".</li>" : "") +
          "<li><strong>Puntos y racha:</strong> cada acierto suma 100 puntos, y los aciertos seguidos dan puntos extra.</li>" +
          "<li><strong>Alertas de riesgo:</strong> hay " + Motor.ALERTAS + (porEquipos() ? " para toda la sala" : "") +
            ". Se pierde una con cada error crítico, " + e(J.ejemploCritico) + ". Sin alertas, la misión se detiene.</li>" +
          (m.segundos ? "<li><strong>Reloj:</strong> " + m.segundos + " segundos por pregunta. <strong>Comodines:</strong> un 50/50 y una pista del facilitador.</li>" : "") +
          "<li><strong>Insignia:</strong> «" + e(m.insignia) + "», con 70 % de aciertos o más.</li>" +
        "</ul>" +
        '<div class="acciones">' +
          '<button type="button" class="boton" data-accion="jugar" data-mision="' + m.id + '">Comenzar</button>' +
          (m.segundos ? '<button type="button" class="boton boton--secundario" data-accion="sin-reloj" aria-pressed="' + (progreso.sinReloj ? "true" : "false") + '">' +
            (progreso.sinReloj ? "Reloj: apagado" : "Reloj: encendido") + "</button>" : "") +
          '<button type="button" class="boton boton--secundario" data-accion="misiones">Volver a misiones</button>' +
        "</div>" +
      "</div>"
    );
  }

  /* ---------- juego ---------- */
  function iniciar(misionId, rng) {
    var m = Motor.mision(BANCO, misionId);
    if (!m || !abierta(m)) { return verMisiones(); }
    partida = Motor.crearPartida(BANCO, misionId, rng, {
      jugadores: nJugadores(),
      inicio: Motor.indiceMision(BANCO, misionId)   // el equipo que empieza rota de misión en misión
    });
    respondida = null; vista = {};
    verItem();
  }

  /* Reloj del reto final */
  function detenerReloj() { if (reloj.intervalo) { clearInterval(reloj.intervalo); reloj.intervalo = null; } }
  function pintarReloj() {
    var t = document.getElementById("reloj-texto"), b = document.getElementById("reloj-barra");
    var total = Motor.mision(BANCO, partida.misionId).segundos;
    if (t) { t.textContent = reloj.restante + " s" + (reloj.pausado ? " (en pausa)" : ""); }
    if (b) { b.style.width = Math.round((reloj.restante / total) * 100) + "%"; }
  }
  function tic() {
    if (!partida || respondida || reloj.pausado) { return; }
    reloj.restante -= 1;
    pintarReloj();
    if (reloj.restante === 5) { anunciar("Quedan 5 segundos."); }
    if (reloj.restante <= 0) { responder(null); }
  }
  function prepararReloj(item) {
    var m = Motor.mision(BANCO, item.mision);
    if (!m.segundos || progreso.sinReloj) { detenerReloj(); return false; }
    if (reloj.id !== item.id) { reloj.id = item.id; reloj.restante = m.segundos; reloj.pausado = false; }
    if (!reloj.intervalo) { reloj.intervalo = setInterval(tic, 1000); }
    return true;
  }

  function cabeceraPartida(item) {
    var total = partida.items.length;
    // Al responder, el motor ya avanzó el índice: por eso el reto visible es "indice".
    var hechas = partida.indice;
    var actual = respondida ? partida.indice : partida.indice + 1;
    var m = Motor.mision(BANCO, partida.misionId);
    var quien = respondida ? respondida.jugador : Motor.turno(partida);
    var j = partida.jugadores[quien];
    var conReloj = !respondida && prepararReloj(item);

    var turnos = "";
    if (porEquipos()) {
      turnos = '<div class="turnos">' + partida.jugadores.map(function (x, k) {
        return '<p class="turno' + (k === quien ? " turno--activo" : "") + '">' +
          (k === quien ? '<span class="turno__etiqueta">' + (respondida ? "Respondió" : "Turno de") + "</span>" : "") +
          "<strong>" + e(nombreDe(k)) + "</strong><span>" + x.puntos + " puntos</span></p>";
      }).join("") + "</div>";
    }

    var comodines = "";
    if (m.segundos && !respondida) {
      comodines = '<div class="comodines">' +
        (conReloj ? '<p class="reloj">' + icono("reloj") + '<span id="reloj-texto" role="timer">' + reloj.restante + ' s</span>' +
          '<span class="reloj__pista"><span class="reloj__barra" id="reloj-barra" style="width:' + Math.round((reloj.restante / m.segundos) * 100) + '%"></span></span></p>' : "") +
        '<button type="button" class="boton boton--secundario boton--chico" data-accion="comodin-mitad"' + (partida.comodines.mitad && item.opciones.length >= 4 ? "" : " disabled") + ">Comodín 50/50</button>" +
        '<button type="button" class="boton boton--secundario boton--chico" data-accion="comodin-pista"' + (partida.comodines.pista ? "" : " disabled") + ">Pista del facilitador</button>" +
      "</div>";
    }

    return '<p class="antetitulo">' + e(m.titulo) + "</p>" + turnos +
      '<div class="estado">' +
        "<span>Reto " + Math.min(actual, total) + " de " + total + "</span>" +
        (porEquipos() ? "" : "<span>Puntos: " + j.puntos + "</span>") +
        "<span>Racha: " + j.racha + "</span>" +
        '<span class="estado__alertas">' + icono("alerta") + "Alertas de riesgo: " + partida.alertas + " de " + Motor.ALERTAS + "</span>" +
      "</div>" +
      '<div class="progreso" role="progressbar" aria-label="Avance de la misión" aria-valuemin="0" aria-valuemax="' + total +
        '" aria-valuenow="' + hechas + '"><div class="progreso__barra" style="width:' + Math.round((hechas / total) * 100) + '%"></div></div>' +
      comodines;
  }

  function verItem() {
    pintarFacilitador();
    var item = respondida ? respondida.item : Motor.itemActual(partida);
    if (!item) { return verResumen(); }
    if (vista.id !== item.id) { vista = { id: item.id }; }
    DIBUJANTES[item.tipo](item);
    if (respondida) {
      var sig = document.getElementById("btn-siguiente");
      if (sig) { sig.focus({ preventScroll: false }); }
    }
  }

  /* Marco común de todos los retos */
  function marco(item, cuerpo, ayuda) {
    var r = respondida;
    var contexto = "";
    if (item.ficha) { contexto += '<p class="ficha">' + icono("bloque") + "Ficha: <strong>" + e(item.ficha) + "</strong></p>"; }
    if (item.chat) {
      contexto += '<div class="chat" role="group" aria-label="Conversación con el asistente">' +
        '<p class="burbuja burbuja--usuario"><span class="burbuja__quien">Empleado</span>' + e(item.chat.pregunta) + "</p>" +
        '<p class="burbuja burbuja--agente"><span class="burbuja__quien">Asistente (caso ficticio)</span>' + e(item.chat.respuesta) + "</p>" +
        (item.chat.nota ? '<p class="nota">' + e(item.chat.nota) + "</p>" : "") + "</div>";
    }
    pintar(
      '<div class="contenedor" data-item="' + item.id + '">' +
        cabeceraPartida(item) +
        '<h1 class="solo-lectores">Reto ' + (r ? partida.indice : partida.indice + 1) + "</h1>" +
        contexto + cuerpo +
        (vista.pista && !r ? '<p class="pista"><strong>Pista:</strong> ' + e(vista.pista) + "</p>" : "") +
        (r ? retro(r) : (ayuda ? '<p class="ayuda-teclado">' + ayuda + "</p>" : "")) +
        (esFacilitador && !r ? '<p class="clave" id="clave" hidden>Clave: ' + e(textoCorrecta(item)) + ". " + e(item.explicacion) + "</p>" : "") +
      "</div>"
    );
  }

  /* --- tipo "clasificar": una tarjeta y varias categorías de destino --- */
  function dibujarClasificar(item) {
    var m = Motor.mision(BANCO, item.mision);
    var r = respondida;
    var destinos = m.categorias.map(function (c, i) {
      var clase = "destino", marca = "";
      if (r) {
        if (c.id === item.correcta) { clase += " destino--era"; marca = icono("visto") + " Respuesta correcta"; }
        else if (c.id === r.elegida) { clase += " destino--elegido-mal"; marca = icono("equis") + " Respuesta elegida"; }
        else { clase += " destino--apagado"; }
      }
      return '<button type="button" class="' + clase + '" data-accion="responder" data-respuesta="' + c.id + '"' + (r ? " disabled" : "") + ">" +
        icono(c.icono || "bloque") +
        '<span class="destino__texto">' + e(c.texto) + "</span>" +
        (r ? (marca ? '<span class="destino__marca">' + marca + "</span>" : "")
           : (c.ayuda ? '<span class="destino__ayuda">' + e(c.ayuda) + "</span>" : "") +
             '<span class="destino__tecla" aria-hidden="true">' + (i + 1) + "</span>") +
        "</button>";
    }).join("");

    marco(item,
      '<div class="tarjeta' + (r ? "" : " tarjeta--arrastrable") + '" id="tarjeta">' +
        '<span class="tarjeta__etiqueta">' + e(m.etiqueta || "Tarjeta") + "</span>" +
        e(item.enunciado) +
      "</div>" +
      '<div class="destinos destinos--' + m.categorias.length + '" role="group" aria-label="¿A dónde va?">' + destinos + "</div>",
      "Toca una opción, arrastra la tarjeta o usa las teclas 1 a " + m.categorias.length + "."
    );
    if (!r) { activarArrastre(document.getElementById("tarjeta")); }
  }

  /* --- tipo "opcion": una sola respuesta correcta --- */
  function ordenVisible(item) {
    if (!vista.orden) { vista.orden = Motor.barajar(item.opciones.map(function (o) { return o.id; }), Math.random); }
    return vista.orden;
  }

  function dibujarOpcion(item) {
    var r = respondida;
    var ocultas = vista.ocultas || [];
    var botones = ordenVisible(item).map(function (id, i) {
      var clase = "opcion", marca = "", apagada = ocultas.indexOf(id) >= 0;
      if (r) {
        if (id === item.correcta) { clase += " opcion--era"; marca = icono("visto") + " Respuesta correcta"; }
        else if (id === r.elegida) { clase += " opcion--elegido-mal"; marca = icono("equis") + " Respuesta elegida"; }
        else { clase += " opcion--apagada"; }
      } else if (apagada) { clase += " opcion--apagada"; marca = "Descartada por el 50/50"; }
      return '<button type="button" class="' + clase + '" data-accion="responder" data-respuesta="' + id + '"' + (r || apagada ? " disabled" : "") + ">" +
        '<span class="opcion__tecla" aria-hidden="true">' + (i + 1) + "</span>" +
        '<span class="opcion__texto">' + e(textoOpcion(item, id)) + "</span>" +
        (marca ? '<span class="opcion__marca">' + marca + "</span>" : "") + "</button>";
    }).join("");
    marco(item,
      '<p class="pregunta">' + e(item.enunciado) + "</p>" +
      '<div class="opciones" role="group" aria-label="Opciones de respuesta">' + botones + "</div>",
      "Toca una opción o usa las teclas 1 a " + item.opciones.length + "."
    );
  }

  /* --- tipo "multi": varias respuestas correctas --- */
  function dibujarMulti(item) {
    var r = respondida;
    vista.marcadas = vista.marcadas || {};
    var botones = ordenVisible(item).map(function (id) {
      var clase = "opcion", marca = "", sel = !!vista.marcadas[id], era = item.correcta.indexOf(id) >= 0;
      if (r) {
        if (era && sel) { clase += " opcion--era"; marca = icono("visto") + " Bien marcada"; }
        else if (era) { clase += " opcion--era"; marca = icono("alerta") + " Faltó marcarla"; }
        else if (sel) { clase += " opcion--elegido-mal"; marca = icono("equis") + " No aplicaba"; }
        else { clase += " opcion--apagada"; }
      } else if (sel) { clase += " opcion--marcada"; }
      return '<button type="button" class="' + clase + '" data-accion="marcar" data-id="' + id + '" aria-pressed="' + (sel ? "true" : "false") + '"' + (r ? " disabled" : "") + ">" +
        '<span class="opcion__casilla" aria-hidden="true">' + icono("visto") + "</span>" +
        '<span class="opcion__texto">' + e(textoOpcion(item, id)) + "</span>" +
        (marca ? '<span class="opcion__marca">' + marca + "</span>" : "") + "</button>";
    }).join("");
    marco(item,
      '<p class="pregunta">' + e(item.enunciado) + "</p>" +
      '<div class="opciones" role="group" aria-label="Marca todas las que apliquen">' + botones + "</div>" +
      (r ? "" : '<div class="acciones"><button type="button" class="boton" data-accion="comprobar">Comprobar</button></div>'),
      "Marca todas las que apliquen y luego pulsa «Comprobar»."
    );
  }

  /* --- tipo "ordenar": poner los pasos en orden con los botones subir y bajar --- */
  function dibujarOrdenar(item) {
    var r = respondida;
    if (!vista.fila) {
      var ids = item.opciones.map(function (o) { return o.id; }), intentos = 0;
      do { vista.fila = Motor.barajar(ids, Math.random); intentos++; }
      while (intentos < 10 && vista.fila.join() === item.correcta.join());
    }
    var filas = vista.fila.map(function (id, i) {
      var bien = r && item.correcta[i] === id;
      return '<li class="paso' + (r ? (bien ? " paso--bien" : " paso--mal") : "") + '">' +
        '<span class="paso__numero" aria-hidden="true">' + (i + 1) + "</span>" +
        '<span class="paso__texto">' + e(textoOpcion(item, id)) +
          (r ? '<span class="opcion__marca">' + (bien ? icono("visto") + " En su lugar" : icono("equis") + " Va en otra posición") + "</span>" : "") + "</span>" +
        (r ? "" :
          '<span class="paso__botones">' +
            '<button type="button" class="boton boton--secundario boton--icono" id="subir-' + id + '" data-accion="mover" data-id="' + id + '" data-dir="-1"' + (i === 0 ? " disabled" : "") +
              ' aria-label="Subir: ' + e(textoOpcion(item, id)) + '">' + icono("arriba") + "</button>" +
            '<button type="button" class="boton boton--secundario boton--icono" id="bajar-' + id + '" data-accion="mover" data-id="' + id + '" data-dir="1"' + (i === vista.fila.length - 1 ? " disabled" : "") +
              ' aria-label="Bajar: ' + e(textoOpcion(item, id)) + '">' + icono("abajo") + "</button>" +
          "</span>") +
        "</li>";
    }).join("");
    marco(item,
      '<p class="pregunta">' + e(item.enunciado) + "</p>" +
      '<ol class="pasos" data-orden="' + vista.fila.join(",") + '">' + filas + "</ol>" +
      (r ? "" : '<div class="acciones"><button type="button" class="boton" data-accion="comprobar">Comprobar</button></div>'),
      "Usa las flechas para subir o bajar cada paso y luego pulsa «Comprobar»."
    );
  }

  var DIBUJANTES = { clasificar: dibujarClasificar, opcion: dibujarOpcion, multi: dibujarMulti, ordenar: dibujarOrdenar };

  /* Bloque de retroalimentación: nunca solo color; siempre ícono y texto. */
  function retro(r) {
    var clase, titulo;
    if (r.correcta) {
      clase = "retro--ok";
      titulo = icono("visto") + "Correcto · +" + r.puntos + " puntos" + (r.racha > 1 ? " · racha de " + r.racha : "");
    } else if (r.alerta) {
      clase = "retro--alerta";
      titulo = icono("alerta") + "Alerta de riesgo · quedan " + partida.alertas;
    } else {
      clase = "retro--mal";
      titulo = r.sinTiempo ? icono("reloj") + "Se acabó el tiempo" : icono("equis") + "Para repasar";
    }
    return '<div class="retro ' + clase + '">' +
      '<p class="retro__titulo">' + titulo + "</p>" +
      (r.correcta ? "" : "<p>La respuesta es: <strong>" + e(textoCorrecta(r.item)) + "</strong>.</p>") +
      "<p>" + e(r.item.explicacion) + "</p>" +
      '<p class="retro__fuente">Fuente: ' + e(r.item.fuente) + "</p>" +
      '<div class="acciones"><button type="button" class="boton' + (r.alerta ? " boton--claro" : "") + '" id="btn-siguiente" data-accion="siguiente">' +
        (r.fin ? "Ver resultado" : (porEquipos() ? "Siguiente turno" : "Siguiente")) + "</button></div>" +
    "</div>";
  }

  function responder(respuesta) {
    if (!partida || respondida) { return; }
    detenerReloj();
    var r = Motor.responder(partida, respuesta);
    if (!r) { return; }
    r.elegida = respuesta;
    respondida = r;
    tono(r.correcta ? 880 : 220, r.correcta ? 0.15 : 0.3);
    anunciar(r.correcta ? "Correcto. Más " + r.puntos + " puntos." :
      (r.sinTiempo ? "Se acabó el tiempo. " : r.alerta ? "Alerta de riesgo. " : "Para repasar. ") +
      "La respuesta es " + textoCorrecta(r.item) + ". " + r.item.explicacion);
    verItem();
  }

  function siguiente() {
    if (!partida) { return; }
    respondida = null;
    if (partida.terminada) { verResumen(); } else { verItem(); }
  }

  /* Arrastrar la tarjeta hasta un destino (los botones son la alternativa). */
  function activarArrastre(tarjeta) {
    if (!tarjeta || !window.PointerEvent) { return; }
    var inicio = null, encima = null;

    function destinoEn(x, y) {
      var lista = document.elementsFromPoint(x, y);
      for (var i = 0; i < lista.length; i++) {
        var d = lista[i].closest ? lista[i].closest(".destino") : null;
        if (d) { return d; }
      }
      return null;
    }
    function marcar(d) {
      if (encima && encima !== d) { encima.classList.remove("destino--encima"); }
      encima = d;
      if (d) { d.classList.add("destino--encima"); }
    }

    tarjeta.addEventListener("pointerdown", function (ev) {
      if (ev.button) { return; }
      inicio = { x: ev.clientX, y: ev.clientY, movio: false };
      tarjeta.classList.remove("tarjeta--regresa");
      tarjeta.setPointerCapture(ev.pointerId);
    });
    tarjeta.addEventListener("pointermove", function (ev) {
      if (!inicio) { return; }
      var dx = ev.clientX - inicio.x, dy = ev.clientY - inicio.y;
      if (!inicio.movio && Math.abs(dx) + Math.abs(dy) < 8) { return; }
      inicio.movio = true;
      tarjeta.classList.add("tarjeta--moviendo");
      tarjeta.style.transform = "translate(" + dx + "px," + dy + "px)";
      marcar(destinoEn(ev.clientX, ev.clientY));
    });
    function soltar(ev) {
      if (!inicio) { return; }
      var d = inicio.movio ? destinoEn(ev.clientX, ev.clientY) : null;
      inicio = null;
      marcar(null);
      tarjeta.classList.remove("tarjeta--moviendo");
      if (d && ev.type === "pointerup") { responder(d.getAttribute("data-respuesta")); return; }
      tarjeta.classList.add("tarjeta--regresa");
      tarjeta.style.transform = "";
    }
    tarjeta.addEventListener("pointerup", soltar);
    tarjeta.addEventListener("pointercancel", soltar);
  }

  /* ---------- pantalla: resumen de la misión ---------- */
  function verResumen() {
    var r = Motor.resumen(partida);
    var m = Motor.mision(BANCO, partida.misionId);
    var i = Motor.indiceMision(BANCO, m.id);
    var proxima = BANCO.misiones[i + 1];
    Motor.guardar(Motor.registrar(progreso, r));
    partida = null; respondida = null;
    pintarFacilitador();
    if (r.insignia) { tono(660, 0.15); setTimeout(function () { tono(990, 0.25); }, 160); }

    var bloqueInsignia = r.insignia
      ? '<div class="insignia">' + icono("insignia") + '<p><span>Insignia desbloqueada</span><span class="insignia__nombre">' + e(m.insignia) + "</span></p></div>"
      : '<div class="insignia insignia--pendiente">' + icono("candado") + '<p><span>Insignia pendiente</span><span class="insignia__nombre">' + e(m.insignia) + "</span>" +
        "<span>" + (r.porAlertas ? "Se agotaron las alertas de riesgo. Repasa y vuelve a intentarlo." : "Se necesita 70 % de aciertos. Puedes repetir la misión cuando quieras.") + "</span></p></div>";

    var desbloqueo = "";
    if (r.completada && proxima) {
      desbloqueo = '<p class="aviso">' + icono("visto") + "Misión " + (i + 2) + " desbloqueada: <strong>" + e(proxima.titulo) + "</strong></p>";
    } else if (r.porAlertas && !progreso.misiones[m.id].completada) {
      desbloqueo = '<p class="aviso aviso--pendiente">' + icono("candado") + "Para desbloquear la siguiente misión hay que llegar al final de esta.</p>";
    }

    var cifras;
    if (porEquipos()) {
      cifras = '<table class="tabla"><caption>Resultado de la misión</caption><tbody>' +
        r.jugadores.map(function (j, k) {
          return '<tr><th scope="row">' + e(nombreDe(k)) + "</th><td>" + j.puntos + " puntos</td><td>" + j.aciertos + " de " + j.total + " aciertos</td></tr>";
        }).join("") + "</tbody></table>" +
        '<p class="marcador"><span>Sala: ' + r.aciertos + " de " + r.total + " aciertos</span><span>Alertas sin usar: " + r.alertas + " de " + Motor.ALERTAS + "</span></p>";
    } else {
      cifras = '<div class="cifras">' +
        '<p class="cifra"><strong>' + r.puntos + "</strong><span>puntos</span></p>" +
        '<p class="cifra"><strong>' + r.aciertos + " de " + r.total + "</strong><span>aciertos</span></p>" +
        '<p class="cifra"><strong>' + r.mejorRacha + "</strong><span>mejor racha</span></p>" +
        '<p class="cifra"><strong>' + r.alertas + " de " + Motor.ALERTAS + "</strong><span>alertas de riesgo sin usar</span></p>" +
      "</div>";
    }

    var principal = "";
    if (r.completada && proxima) {
      principal = '<button type="button" class="boton" data-accion="presentar" data-mision="' + proxima.id + '">Ir a la misión ' + (i + 2) + "</button>";
    } else if (r.completada && Motor.todasCompletas(BANCO, progreso)) {
      principal = '<button type="button" class="boton" data-accion="resultados">Ver resultados finales</button>';
    }

    pintar(
      '<div class="contenedor">' +
        '<p class="antetitulo">' + e(m.titulo) + "</p>" +
        "<h1>" + (r.porAlertas ? "Misión detenida" : "Misión cumplida") + "</h1>" +
        bloqueInsignia + desbloqueo + cifras +
        '<div class="acciones">' + principal +
          (r.fallados.length ? '<button type="button" class="boton boton--secundario" data-accion="repaso">Repasa estos conceptos (' + progreso.fallados.length + ")</button>" : "") +
          '<button type="button" class="boton boton--secundario" data-accion="jugar" data-mision="' + m.id + '">Jugar de nuevo</button>' +
          '<button type="button" class="boton boton--secundario" data-accion="misiones">Volver a misiones</button>' +
        "</div>" +
      "</div>"
    );
  }

  /* ---------- pantalla: resultados finales ---------- */
  function verResultados() {
    partida = null; respondida = null;
    pintarFacilitador();
    var insignias = BANCO.misiones.map(function (m) {
      var p = progreso.misiones[m.id];
      var ok = p && p.insignia;
      return '<li class="logro' + (ok ? "" : " logro--pendiente") + '">' + icono(ok ? "insignia" : "candado") +
        "<span><strong>" + e(m.insignia) + "</strong><span>" + (ok ? "Insignia ganada" : "Insignia pendiente") + " · " + e(m.titulo) + "</span></span></li>";
    }).join("");

    var c = Motor.conceptosGlobal(progreso);
    function lista(dominado) {
      var filas = Object.keys(BANCO.conceptos).filter(function (k) { return c[k] && c[k].dominado === dominado; }).map(function (k) {
        return "<li><strong>" + e(BANCO.conceptos[k]) + "</strong> · " + c[k].ok + " de " + c[k].total + " aciertos</li>";
      }).join("");
      return filas ? '<ul class="conceptos">' + filas + "</ul>" : '<p class="nota">' + (dominado ? "Todavía ninguno: repasa y vuelve a jugar." : "Ninguno. ¡Excelente!") + "</p>";
    }

    pintar(
      '<div class="contenedor">' +
        '<p class="antetitulo">' + e(J.lugar) + "</p>" +
        "<h1>Resultados finales</h1>" +
        (porEquipos() ? tablaPosiciones("Tabla de posiciones de la sala")
          : '<p class="marcador"><span>Puntaje total: ' + Motor.puntajeTotal(progreso) + "</span></p>") +
        "<h2>Insignias</h2>" + '<ul class="logros">' + insignias + "</ul>" +
        '<div class="dos-columnas">' +
          "<div><h2>Conceptos dominados</h2>" + lista(true) + "</div>" +
          "<div><h2>Conceptos por repasar</h2>" + lista(false) + "</div>" +
        "</div>" +
        '<p class="cierre">' + e(J.cierre) + "</p>" +
        '<div class="acciones">' +
          (progreso.fallados.length ? '<button type="button" class="boton" data-accion="repaso">Repasa estos conceptos (' + progreso.fallados.length + ")</button>" : "") +
          '<button type="button" class="boton boton--secundario" data-accion="misiones">Volver a misiones</button>' +
        "</div>" +
        '<p class="firma">Inspira Crea Transforma</p>' +
      "</div>"
    );
  }

  /* ---------- pantalla: repaso de errores ---------- */
  function verRepaso() {
    partida = null; respondida = null;
    var lista = progreso.fallados.map(itemPorId).filter(Boolean).map(function (it) {
      return "<li>" +
        (it.chat ? '<p class="repaso__fuente">Empleado: «' + e(it.chat.pregunta) + "» · Asistente: «" + e(it.chat.respuesta) + "»</p>" : "") +
        '<p class="repaso__enunciado">' + e(it.enunciado) + "</p>" +
        "<p>Respuesta: <strong>" + e(textoCorrecta(it)) + "</strong></p>" +
        "<p>" + e(it.explicacion) + "</p>" +
        '<p class="repaso__fuente">Fuente: ' + e(it.fuente) + "</p></li>";
    }).join("");
    pintar(
      '<div class="contenedor">' +
        '<p class="antetitulo">Para volver a mirar</p>' +
        "<h1>Repasa estos conceptos</h1>" +
        (lista ? '<ul class="repaso">' + lista + "</ul>" : "<p>No hay conceptos pendientes. ¡Buen trabajo!</p>") +
        '<div class="acciones"><button type="button" class="boton" data-accion="misiones">Volver a misiones</button></div>' +
      "</div>"
    );
  }

  /* ---------- modo facilitador (?facilitador=1 o botón del pie con PIN) ---------- */
  function pintarFacilitador() {
    if (!esFacilitador) { return; }
    barraFac.hidden = false;
    var enJuego = !!partida && !respondida;
    var conReloj = enJuego && Motor.mision(BANCO, partida.misionId).segundos && !progreso.sinReloj;
    barraFac.innerHTML = "<strong>Modo facilitador</strong>" +
      '<button type="button" class="boton boton--claro" data-accion="fac-proyector" aria-pressed="' +
        (document.documentElement.classList.contains("proyector") ? "true" : "false") + '">Vista proyector</button>' +
      (enJuego ? '<button type="button" class="boton boton--claro" data-accion="fac-clave">Ver respuesta</button>' +
                 '<button type="button" class="boton boton--claro" data-accion="fac-saltar">Saltar reto</button>' : "") +
      (conReloj ? '<button type="button" class="boton boton--claro" data-accion="fac-pausa" aria-pressed="' + (reloj.pausado ? "true" : "false") + '">' +
        (reloj.pausado ? "Reanudar reloj" : "Pausar reloj") + "</button>" : "") +
      (partida ? '<button type="button" class="boton boton--claro" data-accion="fac-reiniciar">Reiniciar misión</button>' : "") +
      (!partida ? "<span>Todas las misiones están desbloqueadas.</span>" : "");
  }

  function pedirPin() {
    if (esFacilitador) { return; }
    var pin = window.prompt("PIN del facilitador:");
    if (pin === null) { return; }
    if (String(pin).trim() === String(BANCO.facilitador.pin)) {
      esFacilitador = true;
      if (partida) { verItem(); } else { pintarFacilitador(); if (progreso.sala) { verMisiones(); } }
      anunciar("Modo facilitador activado.");
    } else { window.alert("PIN incorrecto."); }
  }

  /* ---------- acciones (un solo escucha para toda la página) ---------- */
  var ACCIONES = {
    inicio: verInicio,
    configurar: verConfiguracion,
    modo: function (b) { if (config.n > 1) { leerNombres(); } config.n = parseInt(b.getAttribute("data-n"), 10) || 1; verConfiguracion(); },
    "crear-sala": crearSala,
    misiones: verMisiones,
    presentar: function (b) { verPresentacion(b.getAttribute("data-mision")); },
    jugar: function (b) { iniciar(b.getAttribute("data-mision")); },
    "sin-reloj": function (b) {
      progreso.sinReloj = !progreso.sinReloj; Motor.guardar(progreso);
      b.setAttribute("aria-pressed", progreso.sinReloj ? "true" : "false");
      b.textContent = progreso.sinReloj ? "Reloj: apagado" : "Reloj: encendido";
    },
    responder: function (b) { responder(b.getAttribute("data-respuesta")); },
    marcar: function (b) {
      if (!partida || respondida) { return; }
      var id = b.getAttribute("data-id");
      vista.marcadas = vista.marcadas || {};
      if (vista.marcadas[id]) { delete vista.marcadas[id]; } else { vista.marcadas[id] = true; }
      b.setAttribute("aria-pressed", vista.marcadas[id] ? "true" : "false");
      b.classList.toggle("opcion--marcada");
    },
    mover: function (b) {
      if (!partida || respondida || !vista.fila) { return; }
      var id = b.getAttribute("data-id"), dir = parseInt(b.getAttribute("data-dir"), 10);
      var i = vista.fila.indexOf(id), j = i + dir;
      if (i < 0 || j < 0 || j >= vista.fila.length) { return; }
      vista.fila[i] = vista.fila[j]; vista.fila[j] = id;
      verItem();
      // el foco sigue al paso que se movió
      var mismo = document.getElementById((dir < 0 ? "subir-" : "bajar-") + id);
      var otro = document.getElementById((dir < 0 ? "bajar-" : "subir-") + id);
      var destino = mismo && !mismo.disabled ? mismo : otro;
      if (destino) { destino.focus(); }
      anunciar("Ahora está en la posición " + (j + 1) + ".");
    },
    comprobar: function () {
      var item = partida && Motor.itemActual(partida);
      if (!item || respondida) { return; }
      if (item.tipo === "multi") {
        var ids = Object.keys(vista.marcadas || {});
        if (!ids.length) { anunciar("Marca al menos una opción."); return; }
        responder(ids);
      } else if (item.tipo === "ordenar") { responder(vista.fila.slice()); }
    },
    "comodin-mitad": function () {
      var ocultas = partida && !respondida ? Motor.usarMitad(partida) : null;
      if (ocultas) { vista.ocultas = ocultas; verItem(); anunciar("Se descartaron dos opciones."); }
    },
    "comodin-pista": function () {
      var pista = partida && !respondida ? Motor.usarPista(partida) : null;
      if (pista) { vista.pista = pista; verItem(); anunciar("Pista: " + pista); }
    },
    siguiente: siguiente,
    resultados: verResultados,
    repaso: verRepaso,
    borrar: function () {
      if (window.confirm("¿Borrar el progreso, los puntajes y las insignias de este dispositivo?")) {
        progreso = Motor.borrar(); pintarSonido(); verInicio(); anunciar("Progreso borrado.");
      }
    },
    "fac-proyector": function () { document.documentElement.classList.toggle("proyector"); pintarFacilitador(); },
    "fac-clave": function () { var c = document.getElementById("clave"); if (c) { c.hidden = !c.hidden; } },
    "fac-saltar": function () { if (partida && !respondida) { detenerReloj(); Motor.saltar(partida); siguiente(); } },
    "fac-pausa": function () { reloj.pausado = !reloj.pausado; pintarReloj(); pintarFacilitador(); },
    "fac-reiniciar": function () { if (partida) { detenerReloj(); reloj.id = null; iniciar(partida.misionId); } }
  };

  document.addEventListener("click", function (ev) {
    var b = ev.target.closest ? ev.target.closest("[data-accion]") : null;
    if (!b || b.disabled) { return; }
    var accion = ACCIONES[b.getAttribute("data-accion")];
    if (accion) { accion(b); }
  });

  // Teclas 1–9 para responder los retos de clasificar y de opción única
  document.addEventListener("keydown", function (ev) {
    if (!partida || respondida || ev.ctrlKey || ev.metaKey || ev.altKey) { return; }
    var item = Motor.itemActual(partida);
    if (!item) { return; }
    var n = parseInt(ev.key, 10), ids;
    if (item.tipo === "clasificar") { ids = opcionesDe(item).map(function (c) { return c.id; }); }
    else if (item.tipo === "opcion") { ids = ordenVisible(item); }
    else { return; }
    if (n >= 1 && n <= ids.length && (vista.ocultas || []).indexOf(ids[n - 1]) < 0) { ev.preventDefault(); responder(ids[n - 1]); }
  });

  document.getElementById("btn-misiones").addEventListener("click", function () { detenerReloj(); verMisiones(); });
  document.getElementById("btn-facilitador").addEventListener("click", pedirPin);
  btnSonido.addEventListener("click", function () {
    progreso.sonido = !progreso.sonido;
    Motor.guardar(progreso); pintarSonido(); tono(660, 0.12);
  });

  /* ---------- arranque ---------- */
  pintarSonido();
  pintarFacilitador();

  /* Estados fijos para las pantallas de revisión (carpeta capturas/).
     Formato: "vista" o "mN:estado:equipos". No se usan en el juego normal. */
  var demo = window.AA_DEMO;
  if (demo) {
    var partes = demo.split(":"), dVista = partes[0], dEstado = partes[1] || "", dN = parseInt(partes[2], 10) || 1;
    var s = 7;
    var fijo = function () { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
    var real = Math.random; Math.random = fijo;
    progreso = Motor.progresoVacio();
    progreso.sala = { equipos: dN > 1 ? ["Equipo Cian", "Equipo Azul", "Equipo Blanco"].slice(0, dN) : [] };
    progreso.sinReloj = false;
    Motor.guardar = function () { return false; };
    var completar = function (id, fallos) {
      var p = Motor.crearPartida(BANCO, id, fijo, { jugadores: dN, inicio: Motor.indiceMision(BANCO, id) });
      while (!p.terminada) { var it = Motor.itemActual(p); Motor.responder(p, p.indice < fallos && !it.critico ? null : it.correcta); }
      Motor.registrar(progreso, Motor.resumen(p));
    };
    var previas = function (hasta) { BANCO.misiones.slice(0, hasta).forEach(function (m, k) { completar(m.id, k % 3); }); };

    if (dVista === "inicio") { progreso.sala = null; verInicio(); }
    else if (dVista === "config") { progreso.sala = null; config.n = 3; verConfiguracion(); }
    else if (dVista === "misiones") { previas(2); verMisiones(); }
    else if (dVista === "resultados") { previas(6); verResultados(); }
    else {
      var idx = Motor.indiceMision(BANCO, dVista);
      previas(idx);
      setInterval = function () { return 1; };     // reloj quieto en las capturas
      iniciar(dVista, fijo);
      var saltos = parseInt(partes[3], 10) || 0;
      for (var q = 0; q < saltos; q++) { Motor.responder(partida, Motor.itemActual(partida).correcta); }
      if (dEstado === "ok") { verItem(); responder(Motor.itemActual(partida).correcta); }
      else if (dEstado === "alerta") {
        while (partida.indice < partida.items.length - 1 && !Motor.itemActual(partida).critico) { Motor.responder(partida, Motor.itemActual(partida).correcta); }
        verItem();
        var actual = Motor.itemActual(partida);
        responder(opcionesDe(actual).map(function (o) { return o.id; }).filter(function (id) { return id !== actual.correcta; })[0]);
      }
      else if (dEstado === "resumen") {
        while (!partida.terminada) { var x = Motor.itemActual(partida); Motor.responder(partida, partida.indice === 3 && !x.critico ? null : x.correcta); }
        verResumen();
      }
      else { verItem(); }
    }
    Math.random = real;
  } else {
    verInicio();
  }
})();
