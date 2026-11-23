# Cómo se arma una buena defensa oral: lo que dice la investigación

> v1.0, 05/11/2026. Base de las decisiones de [GUION_PRESENTACION.md](GUION_PRESENTACION.md) y [GUION_DEMO.md](GUION_DEMO.md).

## Límites de esta investigación

- **No existe un ranking público de "mejores defensas"** de Ingeniería en Sistemas, ni en el país ni afuera, y tampoco encontré un análisis serio de defensas premiadas. Lo que sigue sale de guías y rúbricas oficiales de universidades y de referentes reconocidos sobre cómo dar una charla técnica.
- **No encontré el reglamento de la UCC.** Hay que pedírselo a la cátedra: es lo único que manda sobre todo esto.
- La guía de FIUBA es de **doctorado**: sirve como referencia de formato, no como norma para nosotros.
- Lo de Winston (MIT) viene de un **resumen** de su clase, no de la clase original.

## Recomendaciones

### Orden

1. **Empezar con un ejemplo, no con un índice.** Una diapositiva de "índice de la charla" no le enseña nada al tribunal, que ya sabe que va a haber introducción, métodos, resultados y conclusión. Rinde más abrir con un ejemplo concreto del problema y del resultado principal, como el tráiler de una película. *(Zanibbi, RIT; Tartu §4.2: "start immediately with examples"; Peyton Jones: el índice al principio "conveys near zero information")*
2. **Decir el mensaje central en los primeros 5 minutos:** el problema, por qué importa, qué tiene de nuevo el enfoque y un anticipo de los aportes. *(Winston, MIT)*
3. **El tribunal tiene 2 minutos de atención inicial.** La motivación ocupa el 20 % de la charla y la idea clave el 80 %. *(Peyton Jones, Microsoft Research)*
4. **Una sola idea clave**, profunda antes que amplia: "Si se olvidan de todo, acuérdense de esto". Se recorta todo lo que no la sostiene. *(Peyton Jones; Tartu: "one or two central points")*
5. **Estructura de cinco partes:** introducción y objetivo, enfoque, proceso de trabajo con las decisiones tomadas, resultados y conclusiones. *(Tartu §4.1)*
6. **Terminar con los aportes, no con "gracias".** La última diapositiva recuerda qué se aportó. *(Winston)*

### Qué tiene que mostrar una tesis de software

La guía de Tartu pide responder tres preguntas *(Tartu §1, tesis aplicadas)*:
- ¿En qué es mejor la solución que lo que ya existía?
- ¿Funcionó? ¿Con qué métodos se aseguró la calidad?
- ¿Qué tan bien funcionó, con resultados medidos?

Además, cada elección tecnológica se justifica contra sus alternativas y se describe la arquitectura.

### Cómo se evalúa

- Ejemplo de rúbrica (UPC, Barcelona): **50 % calidad técnica**, 20 % presentación oral (estructura, tiempo, calidad visual, comunicación), 20 % informe y 10 % autonomía. La demo es optativa, pero si se hace tiene que ser "relevante" y con el soporte adecuado.
- Bolzano (Italia): 10 minutos de exposición y 5 de discusión, y el tribunal puede reprobar por la defensa.
- UNT (Argentina, Ingeniería en Informática): el tribunal evalúa el desarrollo, el informe y la exposición, y **deben participar todos los integrantes del grupo**.
- Columbia y McGill (doctorado): el comité evalúa "impacto y profundidad". Hay que hablar en primera persona sobre el aporte propio y respaldar con datos cualquier afirmación comparativa, como "más rápido" o "escalable".

### Diapositivas y ensayo

- Ensayar con tiempo y con alguien que escuche; ensayar cambia la charla. *(Zanibbi)*
- Una diapositiva tiene que poder leerse desde el fondo de la sala. *(Peyton Jones)*
- Pocas palabras e imágenes que muestren relaciones. Empezar el borrador por las figuras. *(Zanibbi; Winston)*
- Diapositivas de respaldo después del cierre, para las preguntas, y llevar el informe impreso. *(Zanibbi; Columbia)*
- Cuando falta tiempo, se omite el caso general y no el ejemplo. *(Peyton Jones)*

### La demo

- Una demo en vivo de pocas funciones convence más que capturas, siempre con un video de respaldo. *(guías de capstone)*
- La falla más común: el backend no estaba corriendo o apuntaba a `localhost`. Hay que usar un servidor real o tener el video. *(guías de capstone)*
- Armar el entorno antes de que llegue el tribunal y practicar con un tribunal simulado que haga preguntas difíciles.
- Con un QR, mostrarlo **antes** de hablar de él y explicar en una frase cómo usarlo, porque no todos saben escanear. *(Mentimeter)*
- El wifi de los eventos suele fallar: preparar un respaldo y no depender de él. *(practicantes)*

## Cómo lo aplicamos

| Recomendación | En nuestra defensa |
|---|---|
| Ejemplo primero | La apertura compara la misma pregunta en un chat general y en NexusAI |
| Mensaje en 5 minutos | Problema, idea central y aportes antes del minuto 8 |
| Una idea clave | "La IA responde con el material del curso, y lo que no sabe se lo avisa al docente" |
| Tres preguntas de Tartu | Bloques "Decisiones", "Calidad" y "Resultados" |
| La técnica pesa 50 % | 8 minutos técnicos, más que la demo sola |
| Demo relevante | Cada interacción del público prueba algo concreto ([GUION_DEMO.md](GUION_DEMO.md)) |
| Hablan todos | Bloques repartidos entre los tres |
| Cierre con aportes | La última diapositiva son los aportes |
| Servidor real y respaldo | Moodle público y plan B en 4 niveles |

## Fuentes

- Zanibbi, R. (2014). *Preparing Defense Talks for Proposals, Projects and Theses*. RIT. https://www.cs.rit.edu/~rlaz/files/DefenseTalkAdvice.pdf
- University of Tartu, Institute of Computer Science (2026). *Guidelines for preparing and grading of graduation theses*. https://cs.ut.ee/sites/default/files/2026-02/2026_02_03_CSI_Guidelines_for_preparing_and_grading_of_graduation_theses.docx%20%281%29.pdf
- Peyton Jones, S. *How to give a good research talk* (handout). https://john.cs.olemiss.edu/~hcc/researchMethods/notes/PeytonJones/Giving_talk_handout.pdf
- Winston, P. (2018). *How to Speak*. MIT OpenCourseWare. https://ocw.mit.edu/courses/res-tll-005-how-to-speak-january-iap-2018/ · Resumen usado: https://muratbuffalo.blogspot.com/2020/01/how-to-speak-by-patrick-winston.html
- UPC EETAC. *Rubric for Bachelor's Theses (TFG)*. https://eetac.upc.edu/en/study/bachelors-and-masters-theses/rubric-tfgs
- unibz. *Defence and evaluation — Computer Science*. https://guide.unibz.it/en/graduation/engineering/bachelor-final-exam/defence-and-evaluation-computer-science
- UNT FACET. *Reglamento de Proyecto Final, Ingeniería en Informática* (Res. 1554/19). https://www.facet.unt.edu.ar/ingenieriainformatica/wp-content/uploads/sites/75/2023/09/Anexo-7-CD-1554-19-Reglamento-Proyecto-Final.pdf
- Schulzrinne, H. *Hints for PhD Defenses* (copia McGill). https://cim.mcgill.ca/~dudek/defense-hints.html
- FIUBA. *Desarrollo de la defensa de tesis* (doctorado, ~45 min). https://cms.fi.uba.ar/uploads/Defensa_de_tesis_Desarrollo_de_la_defensa_2020_25ebe5463a.pdf
- Measured. *How to do great live demos*. https://dev.to/measuredco/how-to-do-great-live-demos-and-why-theyre-important-to-get-right-24lc
- Mentimeter. *Show QR code*. https://help.mentimeter.com/presenting-with-mentimeter/presentation-functions/show-qr-code
