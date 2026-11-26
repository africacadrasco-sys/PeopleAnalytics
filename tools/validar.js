/*
 * VALIDADOR DEL BANCO — ejecútalo después de editar data/preguntas.js
 *   node tools/validar.js
 * Revisa que cada ítem tenga respuesta correcta, explicación y fuente,
 * que no haya ids repetidos y que cada concepto A–G tenga al menos 3 ítems.
 */
"use strict";
var path = require("path");
var BANCO = require(path.join(__dirname, "..", "data", "preguntas.js"));
var Motor = require(path.join(__dirname, "..", "js", "motor.js"));

var errores = [];
var TIPOS = ["clasificar", "opcion", "multi", "ordenar"];
var CONCEPTOS = ["A", "B", "C", "D", "E", "F", "G"];
var vistos = {};
var porConcepto = {};
var porMision = {};

function falla(id, mensaje) { errores.push(id + ": " + mensaje); }

BANCO.items.forEach(function (it) {
  var id = it.id || "(sin id)";
  if (!it.id) { falla(id, "falta id"); }
  if (vistos[id]) { falla(id, "id repetido"); }
  vistos[id] = true;

  var m = Motor.mision(BANCO, it.mision);
  if (!m) { falla(id, "misión desconocida: " + it.mision); return; }
  if (CONCEPTOS.indexOf(it.concepto) < 0) { falla(id, "concepto debe ser A–G"); }
  if (TIPOS.indexOf(it.tipo) < 0) { falla(id, "tipo desconocido: " + it.tipo); return; }
  if (!it.enunciado || it.enunciado.length < 10) { falla(id, "falta enunciado"); }
  if (!it.explicacion || it.explicacion.length < 15) { falla(id, "falta explicación"); }
  if (!it.fuente) { falla(id, "falta fuente"); }

  var opciones = it.tipo === "clasificar" ? (m.categorias || []) : (it.opciones || []);
  var ids = opciones.map(function (o) { return o.id; });
  if (ids.length < 2) { falla(id, "necesita al menos 2 opciones"); }
  ids.forEach(function (x, i) { if (ids.indexOf(x) !== i) { falla(id, "opción repetida: " + x); } });
  opciones.forEach(function (o) { if (!o.texto) { falla(id, "opción sin texto"); } });

  if (it.tipo === "multi" || it.tipo === "ordenar") {
    if (!Array.isArray(it.correcta) || !it.correcta.length) { falla(id, "correcta debe ser una lista"); }
    else {
      it.correcta.forEach(function (c) { if (ids.indexOf(c) < 0) { falla(id, "correcta no existe en opciones: " + c); } });
      if (it.tipo === "ordenar" && it.correcta.length !== ids.length) { falla(id, "ordenar debe incluir todas las opciones"); }
      if (it.tipo === "multi" && it.correcta.length === ids.length) { falla(id, "multi no puede tener todas correctas"); }
    }
  } else if (ids.indexOf(it.correcta) < 0) {
    falla(id, "la respuesta correcta no existe entre las opciones");
  }

  if (it.mision === "m6" && !it.pista) { falla(id, "el reto final necesita pista (comodín)"); }
  if (it.chat && (!it.chat.pregunta || !it.chat.respuesta)) { falla(id, "chat incompleto"); }

  porConcepto[it.concepto] = (porConcepto[it.concepto] || 0) + 1;
  porMision[it.mision] = (porMision[it.mision] || 0) + 1;
});

CONCEPTOS.forEach(function (c) {
  if ((porConcepto[c] || 0) < 3) { errores.push("Concepto " + c + ": tiene " + (porConcepto[c] || 0) + " ítems (mínimo 3)"); }
});
BANCO.misiones.forEach(function (m) {
  if (!porMision[m.id]) { errores.push("Misión " + m.id + ": no tiene ítems"); }
  if (!m.insignia || !m.instruccion) { errores.push("Misión " + m.id + ": falta insignia o instrucción"); }
});
if (BANCO.items.length < 45) { errores.push("El banco tiene menos de 45 ítems"); }

console.log("Ítems: " + BANCO.items.length);
console.log("Por misión:  " + JSON.stringify(porMision));
console.log("Por concepto: " + JSON.stringify(porConcepto));
if (errores.length) {
  console.log("\nERRORES (" + errores.length + "):\n- " + errores.join("\n- "));
  process.exit(1);
}
console.log("\nBanco válido: todos los ítems tienen respuesta correcta, explicación y fuente.");
