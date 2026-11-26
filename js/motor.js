/*
 * MOTOR — EAFIT People Analytics Lab
 * Lógica pura del juego (sin pantalla): selección de ítems, turnos,
 * puntaje, rachas, alertas de riesgo, desbloqueo de misiones y progreso.
 * No depende del navegador, así que también se prueba con Node.
 */
(function (raiz) {
  "use strict";

  var PUNTOS_BASE = 100;      // por respuesta correcta
  var BONO_RACHA = 20;        // por cada acierto seguido adicional
  var BONO_RACHA_MAX = 100;
  var ALERTAS = 3;            // "alertas de riesgo" por misión (compartidas por la sala)
  var UMBRAL_INSIGNIA = 0.7;  // 70 % de aciertos para ganar la insignia
  var UMBRAL_DOMINIO = 0.7;   // 70 % para dar un concepto por dominado
  var CLAVE = "eafit-people-analytics-lab-v1";

  /* ---------- utilidades ---------- */
  function barajar(lista, rng) {
    var a = lista.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function mision(banco, id) {
    for (var i = 0; i < banco.misiones.length; i++) {
      if (banco.misiones[i].id === id) { return banco.misiones[i]; }
    }
    return null;
  }

  function indiceMision(banco, id) {
    for (var i = 0; i < banco.misiones.length; i++) { if (banco.misiones[i].id === id) { return i; } }
    return -1;
  }

  function itemsDe(banco, misionId) {
    return banco.items.filter(function (it) { return it.mision === misionId; });
  }

  /* ---------- selección de ítems para una partida ---------- */
  function seleccionar(banco, misionId, rng) {
    var m = mision(banco, misionId);
    var todos = itemsDe(banco, misionId);
    var sel = m.seleccion || { todas: true };
    var salida = [];

    if (sel.porCategoria) {
      // misma cantidad de ítems por cada categoría (misión 1)
      m.categorias.forEach(function (c) {
        var grupo = todos.filter(function (it) { return it.correcta === c.id; });
        salida = salida.concat(barajar(grupo, rng).slice(0, sel.porCategoria));
      });
      return barajar(salida, rng);
    }

    if (sel.grupos) {
      // un caso completo (grupo) y luego preguntas sueltas (misión 2)
      var nombres = [];
      todos.forEach(function (it) {
        if (it.grupo && nombres.indexOf(it.grupo) < 0) { nombres.push(it.grupo); }
      });
      barajar(nombres, rng).slice(0, sel.grupos).forEach(function (g) {
        salida = salida.concat(barajar(todos.filter(function (it) { return it.grupo === g; }), rng));
      });
      var sueltas = todos.filter(function (it) { return !it.grupo; });
      return salida.concat(barajar(sueltas, rng).slice(0, sel.sueltas || sueltas.length));
    }

    if (sel.cantidad) { return barajar(todos, rng).slice(0, sel.cantidad); }
    return todos.slice(); // todas, en el orden del banco (misión 4)
  }

  /* ---------- partida ----------
     cfg.jugadores: 1 (individual) o 2–3 (equipos por turnos)
     cfg.inicio:    quién responde el primer reto (rota de misión en misión) */
  function crearPartida(banco, misionId, rng, cfg) {
    rng = rng || Math.random;
    cfg = cfg || {};
    var n = Math.max(1, cfg.jugadores || 1);
    var m = mision(banco, misionId);
    var items = seleccionar(banco, misionId, rng);
    // Por equipos, todos reciben la misma cantidad de turnos
    // (salvo en las misiones que juegan el banco completo, como la 4).
    if (n > 1 && !(m.seleccion && m.seleccion.todas)) {
      items = items.slice(0, items.length - (items.length % n));
    }
    var jugadores = [];
    for (var i = 0; i < n; i++) { jugadores.push({ puntos: 0, racha: 0, mejorRacha: 0, aciertos: 0, total: 0 }); }
    return {
      misionId: misionId,
      items: items,
      indice: 0,
      jugadores: jugadores,
      inicio: (cfg.inicio || 0) % n,
      alertas: ALERTAS,
      comodines: { mitad: true, pista: true },   // reto final
      respuestas: [],   // { id, concepto, correcta, critico, omitida, jugador }
      terminada: false,
      porAlertas: false
    };
  }

  function itemActual(p) { return p.terminada ? null : p.items[p.indice]; }
  function turno(p) { return (p.inicio + p.indice) % p.jugadores.length; }

  function igualLista(a, b, ordenImporta) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) { return false; }
    var x = ordenImporta ? a : a.slice().sort();
    var y = ordenImporta ? b : b.slice().sort();
    for (var i = 0; i < x.length; i++) { if (x[i] !== y[i]) { return false; } }
    return true;
  }

  function esCorrecta(item, respuesta) {
    if (item.tipo === "multi") { return igualLista(respuesta, item.correcta, false); }
    if (item.tipo === "ordenar") { return igualLista(respuesta, item.correcta, true); }
    return respuesta === item.correcta;
  }

  function avanzar(p) {
    p.indice += 1;
    if (p.indice >= p.items.length || p.alertas <= 0) {
      p.terminada = true;
      p.porAlertas = p.alertas <= 0 && p.indice < p.items.length;
    }
  }

  /* Registra la respuesta al ítem actual (null = se acabó el tiempo). */
  function responder(p, respuesta) {
    var item = itemActual(p);
    if (!item) { return null; }
    var quien = turno(p);
    var j = p.jugadores[quien];
    var ok = esCorrecta(item, respuesta);
    var ganados = 0;
    var alerta = false;

    j.total += 1;
    if (ok) {
      j.aciertos += 1;
      j.racha += 1;
      if (j.racha > j.mejorRacha) { j.mejorRacha = j.racha; }
      ganados = PUNTOS_BASE + Math.min(BONO_RACHA * (j.racha - 1), BONO_RACHA_MAX);
      j.puntos += ganados;
    } else {
      j.racha = 0;
      if (item.critico) { p.alertas -= 1; alerta = true; }
    }

    p.respuestas.push({ id: item.id, concepto: item.concepto, correcta: ok, critico: alerta, omitida: false, jugador: quien });
    avanzar(p);
    return { correcta: ok, puntos: ganados, alerta: alerta, racha: j.racha, item: item, jugador: quien,
             sinTiempo: respuesta === null, fin: p.terminada };
  }

  /* Modo facilitador: saltar no suma ni resta y no cuenta en el resumen. */
  function saltar(p) {
    var item = itemActual(p);
    if (!item) { return; }
    p.respuestas.push({ id: item.id, concepto: item.concepto, correcta: false, critico: false, omitida: true, jugador: turno(p) });
    avanzar(p);
  }

  /* Comodín 50/50: devuelve los ids de dos opciones incorrectas para ocultar. */
  function usarMitad(p, rng) {
    var item = itemActual(p);
    if (!item || !p.comodines.mitad || item.tipo !== "opcion" || item.opciones.length < 4) { return null; }
    p.comodines.mitad = false;
    var malas = item.opciones.filter(function (o) { return o.id !== item.correcta; }).map(function (o) { return o.id; });
    return barajar(malas, rng || Math.random).slice(0, 2);
  }

  /* Comodín pista: devuelve la pista del ítem actual. */
  function usarPista(p) {
    var item = itemActual(p);
    if (!item || !p.comodines.pista || !item.pista) { return null; }
    p.comodines.pista = false;
    return item.pista;
  }

  function resumen(p) {
    var jugadas = p.respuestas.filter(function (r) { return !r.omitida; });
    var aciertos = jugadas.filter(function (r) { return r.correcta; }).length;
    var total = jugadas.length;
    var porcentaje = total ? aciertos / total : 0;
    var conceptos = {};
    jugadas.forEach(function (r) {
      if (!conceptos[r.concepto]) { conceptos[r.concepto] = { ok: 0, total: 0 }; }
      conceptos[r.concepto].total += 1;
      if (r.correcta) { conceptos[r.concepto].ok += 1; }
    });
    var puntos = 0, mejorRacha = 0;
    p.jugadores.forEach(function (j) { puntos += j.puntos; if (j.mejorRacha > mejorRacha) { mejorRacha = j.mejorRacha; } });
    return {
      misionId: p.misionId,
      puntos: puntos,
      jugadores: p.jugadores.map(function (j) { return { puntos: j.puntos, aciertos: j.aciertos, total: j.total, mejorRacha: j.mejorRacha }; }),
      aciertos: aciertos,
      total: total,
      porcentaje: porcentaje,
      mejorRacha: mejorRacha,
      alertas: p.alertas,
      porAlertas: p.porAlertas,
      completada: !p.porAlertas && p.terminada,
      insignia: !p.porAlertas && total > 0 && porcentaje >= UMBRAL_INSIGNIA,
      conceptos: conceptos,
      fallados: jugadas.filter(function (r) { return !r.correcta; }).map(function (r) { return r.id; })
    };
  }

  /* ---------- progreso (solo en este dispositivo) ----------
     sala: null (sin configurar) o { equipos: [] } individual / { equipos: ["A","B"] } */
  function progresoVacio() { return { misiones: {}, fallados: [], sonido: false, sinReloj: false, sala: null }; }

  function almacen() {
    try { return raiz.localStorage || null; } catch (e) { return null; }
  }

  function cargar() {
    var a = almacen();
    if (!a) { return progresoVacio(); }
    try {
      var d = JSON.parse(a.getItem(CLAVE));
      if (d && d.misiones && Array.isArray(d.fallados)) {
        if (!d.sala || !Array.isArray(d.sala.equipos)) { d.sala = null; }
        return d;
      }
    } catch (e) { /* dato dañado: se empieza de cero */ }
    return progresoVacio();
  }

  function guardar(progreso) {
    var a = almacen();
    if (!a) { return false; }
    try { a.setItem(CLAVE, JSON.stringify(progreso)); return true; } catch (e) { return false; }
  }

  function borrar() {
    var a = almacen();
    if (a) { try { a.removeItem(CLAVE); } catch (e) { /* nada */ } }
    return progresoVacio();
  }

  /* Mezcla el resumen de una partida en el progreso guardado. */
  function registrar(progreso, r) {
    var previo = progreso.misiones[r.misionId] || { mejor: 0, insignia: false, completada: false, jugadas: 0 };
    var cuenta = r.completada || !previo.porJugador;   // una misión detenida no pisa un resultado completo
    progreso.misiones[r.misionId] = {
      mejor: Math.max(previo.mejor, r.puntos),
      insignia: previo.insignia || r.insignia,
      completada: previo.completada || r.completada,
      jugadas: previo.jugadas + 1,
      aciertos: r.aciertos,
      total: r.total,
      porJugador: cuenta ? r.jugadores.map(function (j) { return j.puntos; }) : previo.porJugador,
      conceptos: cuenta ? r.conceptos : previo.conceptos
    };
    // los fallados de esta misión se reemplazan por los de la última partida
    var prefijo = r.misionId + "-";
    progreso.fallados = progreso.fallados
      .filter(function (id) { return id.indexOf(prefijo) !== 0; })
      .concat(r.fallados);
    return progreso;
  }

  /* Una misión se desbloquea cuando la anterior se completó (llegó al final). */
  function desbloqueada(banco, progreso, misionId) {
    var i = indiceMision(banco, misionId);
    if (i <= 0) { return i === 0; }
    var anterior = progreso.misiones[banco.misiones[i - 1].id];
    return !!(anterior && anterior.completada);
  }

  function todasCompletas(banco, progreso) {
    return banco.misiones.every(function (m) { return progreso.misiones[m.id] && progreso.misiones[m.id].completada; });
  }

  /* Puntos por jugador o equipo, sumando la última partida completa de cada misión. */
  function tabla(progreso, n) {
    var t = [];
    for (var i = 0; i < n; i++) { t.push(0); }
    Object.keys(progreso.misiones).forEach(function (k) {
      (progreso.misiones[k].porJugador || []).forEach(function (pts, j) { if (j < n) { t[j] += pts; } });
    });
    return t;
  }

  function puntajeTotal(progreso) {
    var t = 0;
    Object.keys(progreso.misiones).forEach(function (k) { t += progreso.misiones[k].mejor || 0; });
    return t;
  }

  /* Conceptos A–G sumando todas las misiones: { A: { ok, total, dominado } } */
  function conceptosGlobal(progreso) {
    var c = {};
    Object.keys(progreso.misiones).forEach(function (k) {
      var cs = progreso.misiones[k].conceptos || {};
      Object.keys(cs).forEach(function (letra) {
        if (!c[letra]) { c[letra] = { ok: 0, total: 0 }; }
        c[letra].ok += cs[letra].ok; c[letra].total += cs[letra].total;
      });
    });
    Object.keys(c).forEach(function (letra) { c[letra].dominado = c[letra].ok / c[letra].total >= UMBRAL_DOMINIO; });
    return c;
  }

  var Motor = {
    ALERTAS: ALERTAS, UMBRAL_INSIGNIA: UMBRAL_INSIGNIA,
    barajar: barajar, mision: mision, indiceMision: indiceMision, itemsDe: itemsDe, seleccionar: seleccionar,
    crearPartida: crearPartida, itemActual: itemActual, turno: turno, esCorrecta: esCorrecta,
    responder: responder, saltar: saltar, usarMitad: usarMitad, usarPista: usarPista, resumen: resumen,
    progresoVacio: progresoVacio, cargar: cargar, guardar: guardar, borrar: borrar, registrar: registrar,
    desbloqueada: desbloqueada, todasCompletas: todasCompletas, tabla: tabla,
    puntajeTotal: puntajeTotal, conceptosGlobal: conceptosGlobal
  };

  if (typeof module !== "undefined" && module.exports) { module.exports = Motor; }
  raiz.AA_Motor = Motor;
})(typeof window !== "undefined" ? window : globalThis);
