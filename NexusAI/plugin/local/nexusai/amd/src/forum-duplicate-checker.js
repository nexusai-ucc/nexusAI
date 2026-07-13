// This file is part of the NexusAI plugin for Moodle.
//
// Detector de posts similares para el formulario de foro (Épica 06 — F-08/F-09).
//
// Cómo funciona:
//   1. Se carga solo en páginas mod-forum-post (nueva discusión o respuesta).
//   2. Monitorea el campo "Asunto" con debounce de 800ms.
//   3. Cuando el asunto tiene >= 10 chars, llama a local_nexusai_forum_search_similar.
//   4. Si encuentra posts similares (similarity >= 0.75), muestra un banner
//      amarillo encima de los botones de envío con un preview del post similar.
//   5. No bloquea el envío — el alumno puede publicar de todas formas.

define(['core/ajax'], function(Ajax) {

    var DEBOUNCE_MS   = 800;
    var MIN_CHARS     = 10;
    var BANNER_ID     = 'nexusai-similar-banner';
    var debounceTimer = null;
    var lastQuery     = '';

    /**
     * Crea e inserta el banner de aviso sobre los botones del formulario.
     * Si ya existe, lo actualiza.
     *
     * @param {Array} posts Lista de {forum_post_id, discussion_id, similarity, preview}
     * @param {string} wwwroot Raíz del sitio Moodle para construir URLs.
     * @param {number} courseid ID del curso actual.
     */
    function showBanner(posts, wwwroot, courseid) {
        var existing = document.getElementById(BANNER_ID);
        if (existing) {
            existing.parentNode.removeChild(existing);
        }
        if (!posts || posts.length === 0) {
            return;
        }

        var top = posts[0];
        var pct = Math.round(top.similarity * 100);
        var discussionUrl = wwwroot + 'mod/forum/discuss.php?d=' + top.discussion_id;

        var banner = document.createElement('div');
        banner.id = BANNER_ID;
        banner.setAttribute('role', 'alert');
        banner.style.cssText = [
            'background:#fffbeb',
            'border:1px solid #f59e0b',
            'border-radius:6px',
            'padding:10px 14px',
            'margin-bottom:12px',
            'font-size:13px',
            'color:#92400e',
            'line-height:1.5',
        ].join(';');

        var previewText = top.preview.length > 120
            ? top.preview.substring(0, 120) + '...'
            : top.preview;

        banner.innerHTML =
            '<strong>⚠️ NexusAI:</strong> Ya existe una discusión similar (' + pct + '% de similitud):<br>' +
            '<em style="color:#78350f">"' + escapeHtml(previewText) + '"</em><br>' +
            '<a href="' + escapeHtml(discussionUrl) + '" target="_blank" ' +
            'style="color:#d97706;font-weight:600">Ver discusión →</a>' +
            (posts.length > 1 ? ' &nbsp;·&nbsp; <span style="color:#a16207">y ' + (posts.length - 1) + ' más</span>' : '') +
            '<button type="button" onclick="document.getElementById(\'' + BANNER_ID + '\').style.display=\'none\'" ' +
            'style="float:right;background:none;border:none;cursor:pointer;font-size:16px;color:#92400e;padding:0;line-height:1" ' +
            'aria-label="Cerrar aviso">✕</button>';

        // Insertar antes del contenedor de botones de envío.
        var submitRow = document.querySelector('.fitem_actionbuttons, #id_submitbutton, [data-fieldtype="submit"]');
        if (submitRow) {
            submitRow.parentNode.insertBefore(banner, submitRow);
        } else {
            // Fallback: al final del formulario.
            var form = document.querySelector('form#mformforum, form[action*="forum/post.php"]');
            if (form) {
                form.appendChild(banner);
            }
        }
    }

    function hideBanner() {
        var existing = document.getElementById(BANNER_ID);
        if (existing) {
            existing.parentNode.removeChild(existing);
        }
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g,  '&amp;')
            .replace(/</g,  '&lt;')
            .replace(/>/g,  '&gt;')
            .replace(/"/g,  '&quot;')
            .replace(/'/g,  '&#39;');
    }

    /**
     * Llama al backend via core/ajax y muestra el banner si hay similares.
     *
     * @param {string} text     Texto a comparar (asunto del post).
     * @param {number} courseid ID del curso.
     * @param {string} wwwroot  Raíz del sitio.
     */
    function checkSimilar(text, courseid, wwwroot) {
        Ajax.call([{
            methodname: 'local_nexusai_forum_search_similar',
            args: {
                text:     text,
                courseid: courseid,
                topk:     3,
            },
        }])[0].then(function(response) {
            showBanner(response.similar_posts || [], wwwroot, courseid);
        }).catch(function() {
            // Fallo silencioso — no interrumpir al alumno.
        });
    }

    return {
        /**
         * Punto de entrada invocado por before_footer_listener.php.
         *
         * @param {Object} params  {courseid, wwwroot}
         */
        init: function(params) {
            var courseid = params.courseid;
            var wwwroot  = params.wwwroot || '/';
            // eslint-disable-next-line no-console
            console.log('[NexusAI] forum-duplicate-checker init, courseid=' + courseid);

            // Intentar attach inmediato (DOMContentLoaded ya puede haber pasado).
            if (document.readyState !== 'loading') {
                tryAttach(courseid, wwwroot);
            } else {
                document.addEventListener('DOMContentLoaded', function() {
                    tryAttach(courseid, wwwroot);
                });
            }

            // En Moodle 5.x el formulario puede abrirse lazy/modal después del load.
            // Observamos el DOM y nos enganchamos cuando aparece el input de asunto.
            var observer = new MutationObserver(function() {
                tryAttach(courseid, wwwroot);
            });
            observer.observe(document.body, {childList: true, subtree: true});
        },
    };

    function tryAttach(courseid, wwwroot) {
        // Moodle 5.x puede usar name="subject" o id="id_subject".
        var subjectInput = document.querySelector(
            'input[name="subject"]:not([data-nexusai-attached]),' +
            'input[id="id_subject"]:not([data-nexusai-attached])'
        );
        if (!subjectInput) {
            return;
        }
        // Marcar para no duplicar el listener si MutationObserver vuelve a llamar.
        subjectInput.setAttribute('data-nexusai-attached', '1');
        // eslint-disable-next-line no-console
        console.log('[NexusAI] forum-duplicate-checker attached to subject input', subjectInput);

        subjectInput.addEventListener('input', function() {
            var text = subjectInput.value.trim();

            clearTimeout(debounceTimer);
            hideBanner();

            if (text.length < MIN_CHARS || text === lastQuery) {
                return;
            }

            debounceTimer = setTimeout(function() {
                lastQuery = text;
                // eslint-disable-next-line no-console
                console.log('[NexusAI] checking similar for: ' + text);
                checkSimilar(text, courseid, wwwroot);
            }, DEBOUNCE_MS);
        });
    }
});
