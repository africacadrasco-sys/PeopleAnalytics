/*
 * PRUEBAS DEL MOTOR — simula partidas sin navegador
 *   node tools/probar.js
 */
"use strict";
var path = require("path");
var assert = require("assert");
var BANCO = require(path.join(__dirname, "..", "data", "preguntas.js"));
var Motor = require(path.join(__dirname, "..", "js", "motor.js"));

// generador pseudoaleatorio con semilla, para que las pruebas se puedan repetir
function semilla(s) { return function () { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; }
var partidas = 0;

// 1. Misiones por categoría: misma cantidad de tarjetas en cada categoría, sin repetidos
BANCO.misiones.filter(function (m) { return m.seleccion && m.seleccion.porCategoria; }).forEach(function (m) {
  for (var i = 1; i <= 200; i++) {
    var p1 = Motor.crearPartida(BANCO, m.id, semilla(i));
    var cuenta = {}, ids = {};
    p1.items.forEach(function (it) { cuenta[it.correcta] = (cuenta[it.correcta] || 0) + 1; assert.ok(!ids[it.id]); ids[it.id] = 1; });
    m.categorias.forEach(function (c) { assert.strictEqual(cuenta[c.id], m.seleccion.porCategoria, m.id + " " + c.id); });
  }
});

// 2. Partida perfecta individual: puntaje con bono de racha, insignia y misión completada
(function () {
  var p = Motor.crearPartida(BANCO, "m1", semilla(7));
  var esperado = 0;
  for (var k = 0; k < 12; k++) {
    esperado += 100 + Math.min(20 * k, 100);
    assert.ok(Motor.responder(p, Motor.itemActual(p).correcta).correcta);
  }
  var r = Motor.resumen(p);
  assert.strictEqual(r.puntos, esperado);
  assert.ok(r.insignia && r.completada && !r.porAlertas && r.alertas === 3 && r.mejorRacha === 12);
  partidas++;
})();

// 3. Tres errores críticos detienen la misión: ni insignia ni desbloqueo de la siguiente
(function () {
  var detenidas = 0;
  for (var s = 1; s <= 200; s++) {
    var p = Motor.crearPartida(BANCO, "m2", semilla(s));
    var criticos = p.items.filter(function (it) { return it.critico; }).length;
    while (!p.terminada) { var it = Motor.itemActual(p); Motor.responder(p, it.critico ? "__mal__" : it.correcta); }
    var r = Motor.resumen(p);
    var prog = Motor.registrar(Motor.progresoVacio(), r);
    // la última tarjeta puede gastar la tercera alerta: ahí la misión sí llegó al final
    if (r.porAlertas) {
      detenidas++;
      assert.ok(r.alertas === 0 && !r.insignia && !r.completada);
      assert.ok(!Motor.desbloqueada(BANCO, prog, "m3"));
    } else {
      assert.ok(r.completada && Motor.desbloqueada(BANCO, prog, "m3"));
      assert.ok(criticos < 3 || r.alertas === 0);
    }
    partidas++;
  }
  assert.ok(detenidas > 20, "casi nunca se detiene por alertas: " + detenidas);
})();

// 4. Tamaño de cada misión, individual y por equipos (turnos parejos)
function tamanos(n) {
  var t = {};
  BANCO.misiones.forEach(function (m) { t[m.id] = Motor.crearPartida(BANCO, m.id, semilla(5), { jugadores: n }).items.length; });
  return t;
}
assert.deepStrictEqual(tamanos(1), { m1: 12, m2: 12, m3: 12, m4: 12, m5: 10, m6: 10 });
assert.deepStrictEqual(tamanos(2), { m1: 12, m2: 12, m3: 12, m4: 12, m5: 10, m6: 10 });
assert.deepStrictEqual(tamanos(3), { m1: 12, m2: 12, m3: 12, m4: 12, m5: 9, m6: 9 });

// 5. Desbloqueo en cadena: cada misión completada abre la siguiente, y solo esa
[1, 2, 3].forEach(function (n) {
  var prog = Motor.progresoVacio();
  BANCO.misiones.forEach(function (m, idx) {
    BANCO.misiones.forEach(function (x, k) {
      assert.strictEqual(Motor.desbloqueada(BANCO, prog, x.id), k <= idx, "n=" + n + " antes de " + m.id + ": " + x.id);
    });
    assert.ok(!Motor.todasCompletas(BANCO, prog));
    var p = Motor.crearPartida(BANCO, m.id, semilla(idx + n), { jugadores: n, inicio: idx });
    while (!p.terminada) { Motor.responder(p, p.indice % 4 === 1 && !Motor.itemActual(p).critico ? null : Motor.itemActual(p).correcta); }
    var r = Motor.resumen(p);
    assert.ok(r.completada);
    Motor.registrar(prog, r);
    partidas++;
  });
  assert.ok(Motor.todasCompletas(BANCO, prog));
  var t = Motor.tabla(prog, n), suma = 0, total = 0;
  t.forEach(function (x) { suma += x; });
  Object.keys(prog.misiones).forEach(function (k) { total += prog.misiones[k].mejor; });
  assert.strictEqual(suma, total, "la tabla debe sumar lo mismo que las misiones");
  var c = Motor.conceptosGlobal(prog);
  "ABCDEFG".split("").forEach(function (l) { assert.ok(c[l] && c[l].total > 0, "concepto sin jugar: " + l); });
});

// 6. Por equipos: los turnos rotan y cada equipo lleva su propio puntaje y racha
[2, 3].forEach(function (n) {
  for (var s = 1; s <= 150; s++) {
    var rng = semilla(s * 17 + n);
    var inicio = s % n;
    var p = Motor.crearPartida(BANCO, "m1", rng, { jugadores: n, inicio: inicio });
    var esperado = [], racha = [], turnos = [];
    for (var j = 0; j < n; j++) { esperado.push(0); racha.push(0); turnos.push(0); }
    var k = 0;
    while (!p.terminada) {
      var quien = Motor.turno(p);
      assert.strictEqual(quien, (inicio + k) % n);
      var it = Motor.itemActual(p), acierta = rng() < 0.75;
      var r = Motor.responder(p, acierta ? it.correcta : "__mal__");
      assert.strictEqual(r.jugador, quien);
      turnos[quien]++;
      if (acierta) { racha[quien]++; esperado[quien] += 100 + Math.min(20 * (racha[quien] - 1), 100); } else { racha[quien] = 0; }
      k++;
    }
    var res = Motor.resumen(p);
    assert.deepStrictEqual(res.jugadores.map(function (x) { return x.puntos; }), esperado);
    if (!res.porAlertas) { turnos.forEach(function (t) { assert.strictEqual(t, 12 / n); }); }
    partidas++;
  }
});

// 7. Partidas al azar en todas las misiones y modos: el motor nunca se rompe
BANCO.misiones.forEach(function (m) {
  [1, 2, 3].forEach(function (n) {
    for (var s = 1; s <= 100; s++) {
      var rng = semilla(s * 31 + n);
      var p = Motor.crearPartida(BANCO, m.id, rng, { jugadores: n, inicio: s });
      var pasos = 0;
      while (!p.terminada) {
        var it = Motor.itemActual(p), acierta = rng() < 0.7;
        var r = Motor.responder(p, acierta ? it.correcta : (Array.isArray(it.correcta) ? [] : null));
        assert.strictEqual(r.correcta, acierta);
        assert.ok(++pasos <= 40);
      }
      var res = Motor.resumen(p);
      assert.ok(res.total === p.respuestas.length && res.aciertos <= res.total);
      partidas++;
    }
  });
});

// 8. Comodines del reto final: una vez cada uno; el 50/50 nunca oculta la correcta
(function () {
  for (var s = 1; s <= 100; s++) {
    var p = Motor.crearPartida(BANCO, "m6", semilla(s));
    var it = Motor.itemActual(p);
    var ocultas = Motor.usarMitad(p, semilla(s));
    assert.ok(ocultas.length === 2 && ocultas.indexOf(it.correcta) < 0 && ocultas[0] !== ocultas[1]);
    assert.strictEqual(Motor.usarMitad(p), null);
    assert.strictEqual(Motor.usarPista(p), it.pista);
    assert.strictEqual(Motor.usarPista(p), null);
  }
})();

// 9. Saltar no cuenta; el progreso guarda lo mejor y una misión detenida no pisa una completa
(function () {
  var p = Motor.crearPartida(BANCO, "m1", semilla(9));
  Motor.saltar(p);
  Motor.responder(p, Motor.itemActual(p).correcta);
  assert.strictEqual(Motor.resumen(p).total, 1);
  var prog = Motor.progresoVacio(); prog.fallados = ["m1-01", "m3-02"];
  var base = { misionId: "m1", conceptos: {}, aciertos: 3, total: 4 };
  Motor.registrar(prog, Object.assign({}, base, { puntos: 300, insignia: true, completada: true, jugadores: [{ puntos: 300 }], fallados: ["m1-12"] }));
  Motor.registrar(prog, Object.assign({}, base, { puntos: 100, insignia: false, completada: false, jugadores: [{ puntos: 100 }], fallados: [] }));
  assert.ok(prog.misiones.m1.mejor === 300 && prog.misiones.m1.insignia && prog.misiones.m1.completada);
  assert.deepStrictEqual(prog.misiones.m1.porJugador, [300]);
  assert.deepStrictEqual(prog.fallados, ["m3-02"]);
  assert.ok(Motor.desbloqueada(BANCO, prog, "m2") && !Motor.desbloqueada(BANCO, prog, "m3"));
  assert.strictEqual(Motor.guardar(prog), false);          // sin localStorage (Node) no falla
  assert.deepStrictEqual(Motor.cargar(), Motor.progresoVacio());
})();

console.log("Pruebas del motor superadas (" + partidas + " partidas simuladas: individual, 2 y 3 equipos).");
