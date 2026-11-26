// Guías del sitio (instalación y tutorial): botón «Copiar» en los bloques de
// código y clips quietos con «reducir movimiento». Sin dependencias.
(function () {
  var en = document.documentElement.lang === 'en';
  var label = en ? 'Copy' : 'Copiar';
  var done = en ? 'Copied' : 'Copiado';

  // Los bloques con class="out" son ejemplos (una respuesta, un .env de
  // muestra): sin botón, para no pegar valores de ejemplo.
  document.querySelectorAll('.prose pre:not(.out)').forEach(function (pre) {
    if (!navigator.clipboard) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy';
    btn.textContent = label;
    btn.addEventListener('click', function () {
      // Copia solo los comandos: las líneas de comentario (# …) quedan afuera.
      var text = pre.querySelector('code').innerText
        .split('\n')
        .filter(function (line) { return !/^\s*#/.test(line); })
        .join('\n')
        .trim();
      navigator.clipboard.writeText(text).then(function () {
        btn.textContent = done;
        setTimeout(function () { btn.textContent = label; }, 1600);
      });
    });
    var box = document.createElement('div');
    box.className = 'codeblock';
    pre.parentNode.insertBefore(box, pre);
    box.appendChild(pre);
    box.appendChild(btn);
  });

  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('video').forEach(function (v) { v.removeAttribute('autoplay'); v.pause(); });
  }
})();
