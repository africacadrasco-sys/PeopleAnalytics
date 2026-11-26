/*
 * PRUEBA DE PANTALLAS — recorre el juego completo con un DOM mínimo simulado
 *   node tools/probar-pantallas.js
 * Juega la campaña entera (6 misiones) en modo individual, 2 equipos y 3 equipos,
 * y comprueba que cada misión se desbloquea al completar la anterior.
 * No reemplaza la prueba en un navegador real (arrastre, foco, lectores de pantalla).
 */
"use strict";
const fs = require("fs"), path = require("path"), assert = require("assert");
const raiz = path.join(__dirname, "..");
const CLAVE = "eafit-people-analytics-lab-v1";
const fuentes = ["data/preguntas.js", "js/motor.js", "js/app.js"].map(r => fs.readFileSync(path.join(raiz, r), "utf8"));

function el() {
  const o = { attrs: {}, className: "", hidden: false, disabled: false, style: {}, _html: "", textContent: "", value: undefined,
    classList: { _s: new Set(), add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); },
      toggle(c) { this._s.has(c) ? this._s.delete(c) : this._s.add(c); }, contains(c) { return this._s.has(c); } },
    setAttribute(k, v) { this.attrs[k] = v; }, getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; },
    addEventListener(t, f) { (this._e = this._e || {})[t] = f; }, focus() {}, setPointerCapture() {},
    querySelector(sel) { return sel === "h1" && /<h1/.test(this._html) ? el() : null; } };
  Object.defineProperty(o, "innerHTML", { get() { return o._html; }, set(v) { o._html = v; } });
  return o;
}

function sesion(busqueda) {
  const els = {}, escuchas = {}, almacen = {}, relojes = [];
  const FIJOS = ["contenido", "vivo", "barra-facilitador", "btn-sonido", "btn-misiones", "btn-facilitador"];
  global.document = {
    getElementById(id) {
      if (FIJOS.includes(id)) { return els[id] || (els[id] = el()); }
      return els.contenido._html.includes('id="' + id + '"') ? el() : null;   // elementos pintados dentro de <main>
    },
    addEventListener(t, f) { escuchas[t] = f; }, documentElement: el(), elementsFromPoint() { return []; }
  };
  global.window = {
    localStorage: { getItem: k => (k in almacen ? almacen[k] : null), setItem: (k, v) => { almacen[k] = v; }, removeItem: k => { delete almacen[k]; } },
    scrollTo() {}, confirm: () => true, prompt: () => "3003", alert() {}, PointerEvent: function () {}
  };
  global.location = { search: busqueda || "", hash: "" };
  global.setTimeout = f => f();
  global.setInterval = f => { relojes.push(f); return relojes.length; };
  global.clearInterval = id => { relojes[id - 1] = null; };
  fuentes.forEach(src => (0, eval)(src));
  const main = els.contenido;
  const B = global.window.AA_BANCO;
  const api = {
    main, els, almacen, B,
    html: () => main._html,
    clic(accion, extra) {
      const b = el(); b.attrs = Object.assign({ "data-accion": accion }, extra || {});
      escuchas.click({ target: { closest: () => b } });
    },
    tecla(k) { escuchas.keydown({ key: String(k), preventDefault() {} }); },
    tic(veces) { for (let i = 0; i < veces; i++) { relojes.filter(Boolean).forEach(f => f()); } },
    item() { const m = /data-item="([^"]+)"/.exec(main._html); return m ? B.items.find(i => i.id === m[1]) : null; },
    abiertas: () => (main._html.match(/data-accion="presentar"/g) || []).length,
    guardado: () => JSON.parse(almacen[CLAVE])
  };
  return api;
}

/* Responde el reto visible. modo: "bien" | "mal" | "tiempo" */
function responder(s, modo, usarTeclado) {
  const it = s.item();
  assert.ok(it, "no hay reto en pantalla");
  assert.ok(!s.html().includes('class="retro '), "el reto ya estaba respondido");
  if (modo === "tiempo") { s.tic(60); }
  else if (it.tipo === "clasificar" || it.tipo === "opcion") {
    const ids = it.tipo === "clasificar" ? s.B.misiones.find(m => m.id === it.mision).categorias.map(c => c.id) : it.opciones.map(o => o.id);
    const resp = modo === "bien" ? it.correcta : ids.find(x => x !== it.correcta);
    if (usarTeclado && it.tipo === "clasificar") { s.tecla(ids.indexOf(resp) + 1); }
    else if (usarTeclado) {
      // en "opcion" el orden visible está barajado: se lee de la pantalla
      const visibles = [...s.html().matchAll(/data-accion="responder" data-respuesta="([^"]+)"/g)].map(m => m[1]);
      s.tecla(visibles.indexOf(resp) + 1);
    } else { s.clic("responder", { "data-respuesta": resp }); }
  } else if (it.tipo === "multi") {
    const marcar = modo === "bien" ? it.correcta : [it.opciones.find(o => !it.correcta.includes(o.id)).id];
    marcar.forEach(id => s.clic("marcar", { "data-id": id }));
    s.clic("comprobar");
  } else if (it.tipo === "ordenar") {
    if (modo === "bien") {
      for (let vueltas = 0; vueltas < 60; vueltas++) {            // ordena con los botones subir
        const fila = /data-orden="([^"]+)"/.exec(s.html())[1].split(",");
        const i = fila.findIndex((id, k) => id !== it.correcta[k]);
        if (i < 0) { break; }
        s.clic("mover", { "data-id": it.correcta[i], "data-dir": "-1" });
      }
      assert.strictEqual(/data-orden="([^"]+)"/.exec(s.html())[1], it.correcta.join(","), "no se pudo ordenar");
    }
    s.clic("comprobar");
  }
  const h = s.html();
  assert.ok(h.includes('class="retro '), it.id + ": falta la retroalimentación");
  assert.ok(h.includes("Fuente: ") && h.includes(it.explicacion.slice(0, 20).replace(/&/g, "&amp;")), it.id + ": falta explicación o fuente");
  if (modo === "bien") { assert.ok(h.includes("Correcto · +"), it.id + ": debía ser correcto"); }
  else { assert.ok(h.includes("La respuesta es:"), it.id + ": debía ser incorrecto"); }
  if (modo === "tiempo") { assert.ok(h.includes("Se acabó el tiempo")); }
  return it;
}

function campana(n) {
  const s = sesion("");
  assert.ok(s.html().includes("EAFIT People Analytics Lab") && s.html().includes("Inspira Crea Transforma"));
  s.clic("configurar");
  assert.ok(s.html().includes("¿Cómo van a jugar?"));
  s.clic("modo", { "data-n": String(n) });
  if (n > 1) { assert.strictEqual((s.html().match(/id="equipo-/g) || []).length, n); }
  s.clic("crear-sala");
  assert.ok(s.html().includes("Misiones"));
  assert.strictEqual(s.guardado().sala.equipos.length, n > 1 ? n : 0);
  if (n > 1) { assert.ok(s.html().includes("Tabla de posiciones") && s.html().includes("Equipo " + n)); }

  const tipos = {};
  s.B.misiones.forEach((m, idx) => {
    // Solo están abiertas las misiones hasta la actual
    assert.strictEqual(s.abiertas(), idx + 1, "n=" + n + ": antes de " + m.id + " debía haber " + (idx + 1) + " misiones abiertas");
    assert.strictEqual((s.html().match(/para desbloquearla/g) || []).length, s.B.misiones.length - idx - 1);
    // Intentar entrar a una misión bloqueada no funciona
    if (idx + 1 < s.B.misiones.length) {
      s.clic("jugar", { "data-mision": s.B.misiones[idx + 1].id });
      assert.ok(!s.item() && s.html().includes("Misiones"), "se pudo abrir una misión bloqueada");
    }
    s.clic("presentar", { "data-mision": m.id });
    assert.ok(s.html().includes("Comenzar") && s.html().includes(m.instruccion.slice(0, 25)));
    s.clic("jugar", { "data-mision": m.id });

    let k = 0, turnosVistos = [];
    while (s.item() && !s.html().includes("Misión cumplida")) {
      const it = s.item();
      tipos[it.tipo] = (tipos[it.tipo] || 0) + 1;
      if (n > 1) {
        const t = /turno--activo"><span class="turno__etiqueta">Turno de<\/span><strong>([^<]+)</.exec(s.html());
        assert.ok(t, "falta el aviso de turno");
        turnosVistos.push(t[1]);
      }
      if (it.chat) { assert.ok(s.html().includes("burbuja--agente")); }
      if (it.ficha) { assert.ok(s.html().includes("Ficha: ")); }
      if (m.segundos) { assert.ok(s.html().includes('id="reloj-texto"'), "falta el reloj"); }
      // un fallo no crítico por misión; en el reto final, además, uno por tiempo
      let modo = "bien";
      if (k === 1 && !it.critico) { modo = "mal"; }
      if (m.segundos && k === 3 && !it.critico) { modo = "tiempo"; }
      if (m.segundos && k === 0) {
        s.clic("comodin-mitad"); assert.strictEqual((s.html().match(/Descartada por el 50\/50/g) || []).length, 2);
        s.clic("comodin-pista"); assert.ok(s.html().includes("<strong>Pista:</strong>"));
      }
      responder(s, modo, k % 2 === 0);
      k++;
      s.clic("siguiente");
      assert.ok(k <= 20, "la misión no termina");
    }
    const h = s.html();
    assert.ok(h.includes("Misión cumplida"), m.id + " no terminó bien");
    if (n > 1) {
      for (let q = 1; q < turnosVistos.length; q++) { assert.notStrictEqual(turnosVistos[q], turnosVistos[q - 1], "el turno no rotó"); }
      assert.strictEqual(new Set(turnosVistos).size, n);
      assert.ok(h.includes("Resultado de la misión"));
    }
    const g = s.guardado();
    assert.ok(g.misiones[m.id].completada, m.id + " no quedó completada");
    if (idx + 1 < s.B.misiones.length) {
      assert.ok(h.includes("Misión " + (idx + 2) + " desbloqueada"), "falta el aviso de desbloqueo");
      assert.ok(h.includes('data-accion="presentar" data-mision="' + s.B.misiones[idx + 1].id + '"'));
    } else {
      assert.ok(h.includes("Ver resultados finales"));
    }
    s.clic("misiones");
  });

  assert.strictEqual(s.abiertas(), 6);
  assert.deepStrictEqual(Object.keys(tipos).sort(), ["clasificar", "multi", "opcion", "ordenar"].filter(t => tipos[t]).sort());
  assert.ok(tipos.clasificar && tipos.opcion, "faltó jugar algún tipo de reto");
  s.clic("resultados");
  const h = s.html();
  assert.ok(h.includes("Resultados finales") && h.includes("Conceptos dominados") && h.includes("Conceptos por repasar"));
  assert.strictEqual((h.match(/<li class="logro/g) || []).length, 6);
  if (n > 1) { assert.ok(h.includes("Tabla de posiciones de la sala")); }
  s.clic("repaso");
  assert.ok(s.html().includes("Repasa estos conceptos") && s.html().includes("Respuesta: "));
  s.clic("borrar");
  assert.ok(!(CLAVE in s.almacen) && s.html().includes("Empezar"));
  return tipos;
}

const vistos = {};
[1, 2, 3].forEach(n => { for (let v = 0; v < 8; v++) { const t = campana(n); Object.keys(t).forEach(k => { vistos[k] = (vistos[k] || 0) + t[k]; }); } });
["clasificar", "opcion", "multi", "ordenar"].forEach(t => assert.ok(vistos[t] > 0, "nunca se jugó un reto de tipo " + t));

// Misión detenida por alertas: no desbloquea la siguiente.
// La misión 2 sortea sus tarjetas, así que se repite hasta que salgan tres críticas antes del final.
(function () {
  let detenidas = 0;
  for (let intento = 0; intento < 60; intento++) {
    const s = sesion("");
    s.clic("configurar"); s.clic("crear-sala");
    s.clic("jugar", { "data-mision": "m1" });
    while (s.item()) { responder(s, "bien", false); s.clic("siguiente"); }
    s.clic("misiones");
    assert.strictEqual(s.abiertas(), 2);
    s.clic("jugar", { "data-mision": "m2" });
    let k = 0;
    while (s.item() && k < 20) {
      const it = s.item();
      responder(s, it.critico ? "mal" : "bien", false);
      if (it.critico) { assert.ok(s.html().includes("Alerta de riesgo")); }
      s.clic("siguiente"); k++;
    }
    const detenida = s.html().includes("Misión detenida");
    if (detenida) { assert.ok(s.html().includes("hay que llegar al final")); detenidas++; }
    s.clic("misiones");
    assert.strictEqual(s.abiertas(), detenida ? 2 : 3, "una misión detenida no debe desbloquear la siguiente");
  }
  assert.ok(detenidas > 0, "nunca se probó una misión detenida");
})();

// Facilitador: por dirección y por PIN; todas las misiones abiertas; clave y saltar
(function () {
  const s = sesion("?facilitador=1");
  s.clic("configurar"); s.clic("crear-sala");
  assert.strictEqual(s.abiertas(), 6);
  s.clic("jugar", { "data-mision": "m6" });
  assert.ok(s.els["barra-facilitador"]._html.includes("Ver respuesta") && s.els["barra-facilitador"]._html.includes("Pausar reloj"));
  assert.ok(s.html().includes('id="clave" hidden>Clave: '));
  const antes = s.item().id;
  s.clic("fac-saltar");
  assert.notStrictEqual(s.item().id, antes);
  s.clic("fac-pausa"); s.tic(60);
  assert.ok(!s.html().includes("Se acabó el tiempo"), "el reloj en pausa no debe correr");

  const s2 = sesion("");
  s2.clic("configurar"); s2.clic("crear-sala");
  assert.strictEqual(s2.abiertas(), 1);
  s2.els["btn-facilitador"]._e.click();
  assert.strictEqual(s2.abiertas(), 6, "el PIN debe activar el modo facilitador");
})();

// Reloj apagado: el reto final no se vence
(function () {
  const s = sesion("?facilitador=1");
  s.clic("configurar"); s.clic("crear-sala");
  s.clic("presentar", { "data-mision": "m6" });
  s.clic("sin-reloj");
  s.clic("jugar", { "data-mision": "m6" });
  assert.ok(!s.html().includes('id="reloj-texto"'));
  s.tic(100);
  assert.ok(!s.html().includes("Se acabó el tiempo"));
})();

console.log("Prueba de pantallas superada: 24 campañas completas (individual, 2 y 3 equipos), desbloqueo en cadena, " +
  "turnos, reloj, comodines, alertas, facilitador y PIN. Retos jugados por tipo: " + JSON.stringify(vistos));
