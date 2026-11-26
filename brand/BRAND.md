# BRAND.md — EAFIT People Analytics Lab

Estado: **borrador del Paso 0, pendiente de validación por Comunicaciones.**

## 0. Advertencia sobre la fuente

El manual de identidad de la Universidad EAFIT y el sitio www.eafit.edu.co **no pudieron consultarse** desde el entorno de trabajo (el sitio no está en la lista de hosts permitidos de la aplicación). Por eso:

- Este documento **no cita páginas del manual de marca**. Cada regla cita el documento de clase en el que se observó.
- Todo lo que aparece aquí es **identidad observada en los materiales del programa**, no norma oficial.
- No se incluyen valores CMYK ni Pantone, ni área de respeto, tamaño mínimo o lista de usos prohibidos del logo: esos datos solo existen en el manual y no se inventaron.

Este juego reutiliza la identidad levantada para «EAFIT Agent Academy» a partir de los materiales de la Clase 2 (tabla siguiente). La presentación de People Analytics de la Clase 3 es coherente con ella: franja inferior azul con la firma «Inspira Crea Transforma» a la izquierda y el logo a la derecha, y «Vigilada Mineducación» en portada (diapositivas 1, 2 y 11). Sus títulos usan otros azules y otra tipografía, que no se adoptaron.

Documentos observados (abreviaturas usadas abajo):

| Abrev. | Documento | Págs. |
|---|---|---|
| CAP | Prepara tu segunda clase_18 de Noviembre.pdf (Cápsula Clase 2) | 4 |
| PC | Guia_Agente_Prompt_Coach_Copilot_EAFIT.pdf | 6 |
| GEM | Crear_ChatBots_en_Gemini_GEM_Manual_Completo_EAFIT.pdf | 11 |
| CAT | Catalogo_de_agentes_TH_Copilot_EAFIT.docx | — |
| FAQ | Guia paso a paso_Asistente de preguntas frecuentes de TH_EAFIT.docx | — |

## 1. Paleta observada

Valores HEX leídos directamente de los archivos (estilos del DOCX y píxeles del logo incrustado).

| Token CSS | HEX | RGB | Uso observado | Dónde se observó |
|---|---|---|---|---|
| `--eafit-azul` | #223675 | 34, 54, 117 | Color del logo, portadas, títulos, bloques sólidos | Logo incrustado en CAT y CAP p. 1; títulos en CAP p. 2–3 |
| `--eafit-azul-profundo` | #16265C | 22, 38, 92 | Relleno de encabezados de ficha | CAT (relleno de celdas) |
| `--eafit-cian` | #0AA4D8 | 10, 164, 216 | Antetítulos, filetes, numeración de pasos, énfasis | CAP p. 2–4; PC p. 1; CAT |
| `--eafit-gris-texto` | #5A6273 | 90, 98, 115 | Texto secundario | CAT (color de texto) |
| `--eafit-fondo-1` | #EDF1F9 | 237, 241, 249 | Fondo de tarjetas | Píxeles de CAP p. 2 (coincide con la referencia del docente) |
| `--eafit-fondo-2` | #D7EEFA | 215, 238, 250 | Fondo de tarjetas destacadas | Píxeles de CAP p. 2 (coincide con la referencia del docente). GEM p. 1 usa un tono muy cercano, #D2ECF9, que no se adopta |
| `--eafit-fondo-3` | #F2F7FD | 242, 247, 253 | Fondo de cuerpo de ficha | CAT (relleno de celdas) |
| `--eafit-borde` | #DCE8F6 | 220, 232, 246 | Bordes y separadores | CAT (bordes de tabla) |
| `--eafit-blanco` | #FFFFFF | 255, 255, 255 | Fondo general, texto sobre azul | Todos |

CMYK y Pantone: **no disponibles** (requieren el manual).

### Contraste (WCAG 2.1, calculado)

| Texto | Fondo | Relación | Veredicto |
|---|---|---|---|
| #223675 | #FFFFFF | 11,34:1 | AA y AAA |
| #223675 | #EDF1F9 | 10,01:1 | AA y AAA |
| #223675 | #D7EEFA | 9,45:1 | AA y AAA |
| #FFFFFF | #16265C | 14,33:1 | AA y AAA |
| #5A6273 | #FFFFFF | 6,12:1 | AA |
| #5A6273 | #EDF1F9 | 5,41:1 | AA |
| #0AA4D8 | #16265C | 4,99:1 | AA |
| #0AA4D8 | #223675 | 3,95:1 | Solo texto grande (≥ 24 px, o ≥ 18,66 px en negrita) y elementos gráficos |
| #0AA4D8 | #FFFFFF | 2,87:1 | **No apto para texto.** Solo decorativo (filetes, íconos acompañados de texto) |

Regla derivada: el cian nunca lleva texto pequeño sobre blanco ni sobre azul #223675.

## 2. Tipografía observada

| Rol | Fuente | Dónde se observó |
|---|---|---|
| Títulos y cuerpo | Carlito (Regular, Bold, Italic, Bold Italic) | Fuentes incrustadas en CAP y PC |
| Títulos y cuerpo | Calibri (métricamente equivalente a Carlito) | Fuentes incrustadas en GEM; estilo base de CAT |
| Bloques de prompt | Consolas (monoespaciada) | CAT |

Propuesta para el juego: **Carlito incluida localmente** (licencia SIL Open Font License, se puede distribuir), con respaldo `Calibri, Arial, sans-serif`. Para bloques de prompt, pila monoespaciada del sistema (`Consolas, "Courier New", monospace`), sin descargar nada.

Tipografía institucional oficial y sus reemplazos web permitidos: **no verificados** (requieren el manual).

## 3. Logo

Qué hay disponible: el logo "UNIVERSIDAD EAFIT®" incrustado en los materiales de clase, en dos versiones de mapa de bits.

| Versión | Archivo de origen | Tamaño | Uso observado |
|---|---|---|---|
| Blanco sobre azul #223675 | CAT, `word/media/image1.png` | 975 × 440 px | Portadas y encabezados sobre azul (CAP p. 1 y 4; PC p. 1; GEM p. 1) |
| Azul #223675 sobre blanco | CAT, `word/media/image4.png` | 731 × 328 px | Pie de página sobre blanco (CAP p. 2–3; PC; GEM) |

Reglas que aplicaré, a falta del manual:

- Usar esos archivos tal cual: sin redibujar, recolorear, deformar, recortar ni añadir sombras o efectos.
- Versión blanca solo sobre azul #223675 (el archivo trae su propio fondo azul, así que el contenedor debe ser exactamente ese azul); versión azul solo sobre blanco.
- Mantener proporción original y un margen libre generoso alrededor.
- No ampliar por encima de su resolución nativa.

Limitaciones:

- **No son los archivos oficiales descargados de EAFIT**, sino copias incrustadas en documentos. En proyector 1920 × 1080 pueden verse suaves si se muestran grandes.
- Área de respeto, tamaño mínimo y usos prohibidos oficiales: **no verificados**.

## 4. Firma y pies institucionales

| Elemento | Texto exacto | Dónde se observó |
|---|---|---|
| Firma | Inspira Crea Transforma | CAP p. 1 y 4 (sola, sobre azul); pie de todas las páginas de CAP, PC y GEM |
| Pie institucional | Universidad EAFIT · www.eafit.edu.co · Inspira Crea Transforma | Pie de CAP p. 2–3, PC p. 1–6, GEM p. 1–11 |
| Leyenda legal | Vigilada Mineducación | Segunda línea del pie en CAP p. 2–3 |

Nota: en los materiales la firma aparece **sin puntos medios** ("Inspira Crea Transforma"). El encargo la escribe "Inspira · Crea · Transforma". Usaré la forma de los materiales salvo indicación contraria.

Aplicación en el juego:

- Logo: en la cabecera de todas las pantallas (versión azul sobre blanco). La versión blanca sobre azul no se usa en este juego.
- Firma: en la portada y en los resultados finales.
- Pie de todas las pantallas: "Universidad EAFIT · www.eafit.edu.co · Vigilada Mineducación".
- Pie discreto adicional: "Material de apoyo académico — Programa IA aplicada a Talento Humano".

## 5. Composición observada

- Portada y cierre a sangre en azul #223675 con texto blanco; páginas interiores en blanco (CAP p. 1–4).
- Antetítulo en cian, mayúsculas y con espaciado amplio entre letras, sobre un título en azul y negrita (CAP p. 2–3: "CONCEPTO BASE", "EL PASO A PASO", "ALCANCE REAL").
- Tarjetas rectangulares de fondo claro, sin sombras marcadas (CAP p. 2; PC p. 1).
- Pasos numerados con círculo cian y número blanco (CAP p. 2).
- Etiquetas de paso: rectángulo cian con texto blanco en mayúsculas (PC p. 1: "PASO 1").
- Filete cian fino sobre el pie de página (CAP, PC, GEM).
- Columnas comparativas con encabezado en mayúsculas (CAP p. 3).
- Bloque de cierre en azul sólido con lista de verificación (CAP p. 3: "Antes de la sesión").

Retícula oficial, uso de fotografía e iconografía institucional: **no verificados**. El juego no usará fotografías; los íconos serán trazos simples en azul o blanco.

## 6. Tono de voz observado

- Claro, directo y cercano, con frases cortas (CAP p. 2: "Dos o tres documentos buenos valen más que veinte sueltos").
- Inspirador en portada y cierre (CAP p. 4: cita sobre atreverse a transformar talento).
- Los materiales mezclan "usted" (CAP, CAT) y "tú" (PC, GEM, FAQ). El juego usará **"tú"**, como pide el encargo.
- Español de Colombia; términos preferidos: agente, mensaje, fuente de conocimiento, instrucciones.

## 7. Estados de interfaz (propuesta, pendiente de validación por Comunicaciones)

Los materiales no definen colores de acierto o error. Propuesta sin salir de la paleta:

| Estado | Tratamiento |
|---|---|
| Correcto | Borde y franja lateral cian, fondo #D7EEFA, ícono de visto bueno y la palabra "Correcto" en azul #223675 |
| Incorrecto | Borde azul #16265C de trazo discontinuo, fondo blanco, ícono de equis y la palabra "Para repasar" en azul #16265C |
| Alerta de riesgo (error crítico) | Bloque sólido azul #16265C con texto blanco, ícono de advertencia y la etiqueta "Alerta de riesgo" |
| Foco de teclado | Contorno de 3 px en azul #223675 sobre fondos claros y blanco sobre fondos azules |

El estado nunca se comunica solo con color: siempre lleva ícono y texto.

## 8. Decisiones que debe validar Comunicaciones

1. Toda la paleta de la sección 1 frente al manual oficial (y sus equivalentes CMYK/Pantone).
2. Carlito como tipografía del juego.
3. Uso de los logos incrustados en los materiales de clase, o su reemplazo por los archivos oficiales (ideal: SVG).
4. Área de respeto y tamaño mínimo del logo.
5. Grafía de la firma: "Inspira Crea Transforma" o "Inspira · Crea · Transforma".
6. Ubicación de "Vigilada Mineducación" en una pieza digital.
7. Estados de interfaz de la sección 7.
8. Nombre del juego en inglés ("EAFIT People Analytics Lab") junto a la marca.
