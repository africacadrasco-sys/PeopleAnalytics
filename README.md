# EAFIT People Analytics Lab

Juego web de repaso de People Analytics para el programa IA aplicada a Talento Humano (Universidad EAFIT). Refuerza la Parte 1 de la Clase 3 y sus dos lecturas: cultura del dato, niveles de madurez analítica, habilidades clave, las nueve dimensiones y el enfoque sistémico.

Son cinco misiones y un reto final. Se juega con un jugador o con dos o tres equipos por turnos. Cada misión completada desbloquea la siguiente.

Material de apoyo académico. No recopila datos personales, no usa analítica y no hace llamadas a internet.

## Cómo abrirlo

- **En tu equipo:** doble clic en `index.html`. No necesita instalación ni servidor.
- **Para enviarlo por correo o chat:** usa `people-analytics-lab-un-solo-archivo.html`, que lleva todo adentro.

## Cómo se juega

1. En la portada, pulsa «Empezar» y elige **un jugador**, **dos equipos** o **tres equipos**. Los equipos pueden ponerse nombre.
2. Solo la Misión 1 está abierta. Al llegar al final de una misión se desbloquea la siguiente, aunque no se gane la insignia.
3. Por equipos, en cada reto responde un equipo y el turno rota. Cada equipo lleva su puntaje y su racha; la tabla de posiciones está en la pantalla de misiones y en los resultados finales.
4. Hay 3 alertas de riesgo por misión (compartidas por la sala). Se pierde una con cada error crítico, como tratar «usar los datos para culpar» como una buena práctica. Sin alertas, la misión se detiene y hay que repetirla para desbloquear la siguiente.
5. La insignia de cada misión se gana con 70 % de aciertos o más.
6. El reto final tiene 25 segundos por pregunta y dos comodines para toda la partida: un 50/50 y una pista. El reloj se puede apagar en la presentación del reto.

| Misión | Qué se hace | Retos por partida |
|---|---|---|
| 1. ¿En qué nivel estamos? | Ubicar pistas en los 4 niveles de madurez analítica | 12 |
| 2. Cultura del dato o señal de alerta | Distinguir prácticas de cultura del dato de señales de alerta | 12 |
| 3. El equipo ideal | Asignar habilidades a ciencia de datos, consultoría o ciencias del comportamiento | 12 |
| 4. Las nueve dimensiones | Ubicar dimensiones en fundamentos, recursos o valor, y preguntas del modelo | 12 |
| 5. De la intuición a la evidencia | Qué es People Analytics, el caso de Juan y el enfoque sistémico | 10 |
| 6. Sala de decisiones | Preguntas relámpago de todo, con reloj y comodines | 10 |

Con tres equipos, las misiones 5 y 6 juegan 9 retos para que todos tengan los mismos turnos.

## Modo facilitador

Dos formas de activarlo:

- Agrega `?facilitador=1` al final de la dirección, por ejemplo `https://tu-juego.vercel.app/?facilitador=1`.
- O pulsa «Facilitador» en el pie de página y escribe el PIN: **3003**. Se cambia en `data/preguntas.js` (busca `pin`). No es una medida de seguridad; solo evita activarlo por accidente.

Con el modo activo:

- Todas las misiones quedan desbloqueadas.
- **Vista proyector:** agranda toda la tipografía.
- **Ver respuesta:** muestra la clave y la explicación del reto actual.
- **Saltar reto:** pasa al siguiente sin sumar ni restar.
- **Pausar reloj** (reto final) y **Reiniciar misión**.

La guía de una página para la clase está en `GUIA-FACILITADOR.md`.

## Qué hay en la carpeta

| Ruta | Qué es |
|---|---|
| `index.html` | Página del juego |
| `css/estilos.css` | Estilos y tokens de marca (colores y tipografía de `brand/BRAND.md`) |
| `js/motor.js` | Lógica: selección de retos, turnos, puntos, alertas, desbloqueo, progreso |
| `js/app.js` | Pantallas y navegación |
| `data/preguntas.js` | **Banco de preguntas** (lo único que necesitas editar) |
| `brand/` | `BRAND.md` y el logo |
| `assets/fonts/` | Tipografía Carlito y su licencia |
| `tools/` | Validador, pruebas y empaquetador |
| `capturas/` | Pantallas fijas de cada misión, para revisión |
| `CONTENIDO.md` | Mapa de conceptos y matriz concepto → ítems |
| `GUIA-FACILITADOR.md` | Cómo usar el juego en clase en 20 minutos |

## Cómo editar las preguntas

1. Abre `data/preguntas.js` con cualquier editor de texto. Las instrucciones de cada campo están al inicio del archivo.
2. Cambia textos, agrega o quita ítems. Cada ítem necesita `id` único, `correcta`, `explicacion` y `fuente`.
3. Si tienes Node.js instalado, comprueba y regenera el archivo único:

```
node tools/validar.js
node tools/probar.js
node tools/probar-pantallas.js
node tools/empaquetar.js
```

Sin Node.js el juego funciona igual; solo no se actualiza el archivo único.

## Cómo publicarlo: GitHub + Vercel

La carpeta es un sitio estático, sin paso de compilación.

Es un juego distinto de «EAFIT Agent Academy»: va en su propio repositorio y tendrá su propio enlace.

1. En github.com crea un repositorio nuevo, por ejemplo `people-analytics-lab`, y elige «uploading an existing file».
2. Arrastra **el contenido** de esta carpeta, no la carpeta en sí. El `index.html` debe quedar en la raíz del repositorio.
3. Pulsa «Commit changes».
4. En vercel.com elige «Add New… → Project», importa el repositorio, deja todo como viene (Framework Preset: «Other», sin comando de build) y pulsa «Deploy».

También funciona en GitHub Pages, SharePoint o una memoria USB.

## Privacidad

El puntaje, las insignias y los nombres de equipo se guardan solo en el navegador de cada dispositivo (`localStorage`). El botón «Borrar mi progreso», en la pantalla de misiones, lo elimina. «Partida nueva», en la portada, también empieza de cero.

## Marca

La identidad es la misma de «EAFIT Agent Academy»: se tomó de los materiales de clase, no del manual oficial, que no se pudo consultar. Las decisiones que debe validar Comunicaciones están en `brand/BRAND.md`, sección 8.

