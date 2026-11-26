/*
 * EMPAQUETADOR — genera la copia del juego en un solo archivo
 *   node tools/empaquetar.js
 * Crea:
 *   people-analytics-lab-un-solo-archivo.html   (para enviar por correo o chat)
 *   capturas/*.html                            (pantallas fijas para revisión)
 * El archivo único lleva dentro estilos, código, preguntas y logos.
 * No incluye la tipografía Carlito (pesa 1,3 MB): usa Calibri o Arial del equipo.
 */
"use strict";
var fs = require("fs");
var path = require("path");
var raiz = path.join(__dirname, "..");

function leer(r) { return fs.readFileSync(path.join(raiz, r), "utf8"); }
function dataUri(r) { return "data:image/png;base64," + fs.readFileSync(path.join(raiz, r)).toString("base64"); }
function sinCierre(js) { return js.replace(/<\/script/gi, "<\\/script"); }

var LOGOS = ["brand/logo-eafit-azul-sobre-blanco.png"];

function armar(demo) {
  var html = leer("index.html");
  var css = leer("css/estilos.css").replace(/@font-face\s*\{[^}]*\}\s*/g, "");
  var datos = leer("data/preguntas.js"), motor = leer("js/motor.js"), app = leer("js/app.js");

  LOGOS.forEach(function (l) {
    var uri = dataUri(l);
    html = html.split(l).join(uri);
    app = app.split(l).join(uri);
  });

  html = html.replace('<link rel="stylesheet" href="css/estilos.css">', function () { return "<style>\n" + css + "\n</style>"; });
  html = html.replace('<script src="data/preguntas.js"></script>', function () {
    return (demo ? "<script>window.AA_DEMO=" + JSON.stringify(demo) + ";</script>\n" : "") + "<script>\n" + sinCierre(datos) + "\n</script>";
  });
  html = html.replace('<script src="js/motor.js"></script>', function () { return "<script>\n" + sinCierre(motor) + "\n</script>"; });
  html = html.replace('<script src="js/app.js"></script>', function () { return "<script>\n" + sinCierre(app) + "\n</script>"; });

  if (/href="css\/|src="(js|data|brand)\//.test(html)) { throw new Error("Quedó una referencia a un archivo externo"); }
  return html;
}

var salida = "people-analytics-lab-un-solo-archivo.html";
fs.writeFileSync(path.join(raiz, salida), armar(null));
console.log("Creado " + salida + " (" + Math.round(fs.statSync(path.join(raiz, salida)).size / 1024) + " KB)");

var CAPTURAS = {
  "A-inicio": "inicio",
  "B-equipos": "config",
  "C-misiones": "misiones::3",
  "D-mision1-niveles": "m1",
  "E-mision2-cultura": "m2::2",
  "F-mision2-alerta": "m2:alerta",
  "G-mision3-habilidades": "m3:ok:3",
  "H-mision4-dimensiones": "m4",
  "I-mision5-evidencia": "m5::2",
  "J-reto-final": "m6::3",
  "K-resumen-mision": "m1:resumen:3",
  "L-resultados-finales": "resultados::3"
};
var dir = path.join(raiz, "capturas");
if (!fs.existsSync(dir)) { fs.mkdirSync(dir); }
fs.readdirSync(dir).forEach(function (f) { if (/\.html$/.test(f)) { fs.unlinkSync(path.join(dir, f)); } });
Object.keys(CAPTURAS).forEach(function (nombre) {
  fs.writeFileSync(path.join(dir, nombre + ".html"), armar(CAPTURAS[nombre]));
});
console.log("Creadas " + Object.keys(CAPTURAS).length + " pantallas en capturas/");
