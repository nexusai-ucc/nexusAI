// This file is part of the NexusAI plugin for Moodle.
//
// Sugerencia de respuesta con IA en formularios de reply de foro (Épica 06 — F-11).
//
// Cómo funciona:
//   1. Se carga en páginas mod-forum-discuss (vista de discusión).
//   2. Usa MutationObserver para detectar cuando aparece el formulario de reply.
//   3. Inyecta un botón "✨ Sugerir respuesta" junto al área de texto.
//   4. Al clickear llama a local_nexusai_forum_suggest_reply con el post al que
//      se está respondiendo.
//   5. Muestra la sugerencia en un panel con botón "Usar esta respuesta".

define(['core/ajax', 'core/notification'], function(Ajax, Notification) {

    var BTN_ID   = 'nexusai-suggest-reply-btn';
    var PANEL_ID = 'nexusai-reply-suggestion-panel';

    var discussionid, courseid;

    /**
     * Escapa HTML para evitar XSS al insertar texto del LLM en el DOM.
     */
    function escapeHtml(str) {
        return String(str)
            .replace(/&/g,  '&amp;')
            .replace(/</g,  '&lt;')
            .replace(/>/g,  '&gt;')
            .replace(/"/g,  '&quot;');
    }

    /**
     * Extrae el post_id del link de reply que desencadenó la apertura del form.
     * Moodle usa href="../post.php?reply=POSTID" o action="post.php?reply=POSTID".
     *
     * @param {Element} formEl  El formulario de reply detectado.
     * @returns {number|null}
     */
    function extractReplyPostId(formEl) {
        // 1. Buscar en el action del form.
        var form = formEl.tagName === 'FORM' ? formEl : formEl.querySelector('form');
        if (form) {
            var action = form.getAttribute('action') || '';
            var m = action.match(/[?&]reply=(\d+)/);
            if (m) {
                return parseInt(m[1], 10);
            }
        }

        // 2. Buscar input hidden name="reply" dentro del form.
        var hiddenReply = (form || formEl).querySelector('input[name="reply"]');
        if (hiddenReply && hiddenReply.value) {
            return parseInt(hiddenReply.value, 10);
        }

        // 3. Fallback: buscar el post padre en el DOM y leer su data-post-id / id="pXXX".
        var postEl = formEl.closest('[id^="p"]');
        if (postEl) {
            var pid = postEl.id.replace(/^p/, '');
            if (/^\d+$/.test(pid)) {
                return parseInt(pid, 10);
            }
        }

        return null;
    }

    /**
     * Muestra el panel con la sugerencia del LLM bajo el formulario.
     *
     * @param {string}  suggestedReply
     * @param {boolean} hasMaterial
     * @param {Element} formEl          Formulario de reply (para saber dónde insertar).
     */
    function showSuggestionPanel(suggestedReply, hasMaterial, formEl) {
        // Remover panel anterior si existe.
        var old = document.getElementById(PANEL_ID);
        if (old) {
            old.parentNode.removeChild(old);
        }

        var materialNote = hasMaterial
            ? '<span style="font-size:11px;color:#166534;margin-left:8px">📚 Con material del curso</span>'
            : '';

        var panel = document.createElement('div');
        panel.id = PANEL_ID;
        panel.style.cssText = [
            'background:#f0fdf4',
            'border:1px solid #86efac',
            'border-radius:8px',
            'padding:12px 16px',
            'margin-top:10px',
            'font-size:13px',
            'color:#14532d',
            'line-height:1.6',
            'position:relative',
        ].join(';');

        panel.innerHTML =
            '<button type="button" id="nexusai-rsp-close" '
            + 'style="position:absolute;top:8px;right:10px;background:none;border:none;'
            + 'cursor:pointer;font-size:16px;color:#166534;padding:0;line-height:1" '
            + 'aria-label="Cerrar sugerencia">✕</button>'
            + '<strong style="font-size:13px">✨ NexusAI sugiere:</strong>'
            + materialNote
            + '<p id="nexusai-rsp-text" style="margin:8px 0;white-space:pre-wrap">'
            + escapeHtml(suggestedReply)
            + '</p>'
            + '<button type="button" id="nexusai-rsp-use" '
            + 'style="background:#166534;color:#fff;border:none;border-radius:6px;'
            + 'padding:5px 14px;font-size:12px;cursor:pointer;font-weight:600">'
            + 'Usar esta respuesta</button>';

        // Insertar después del formulario.
        if (formEl.parentNode) {
            formEl.parentNode.insertBefore(panel, formEl.nextSibling);
        }

        document.getElementById('nexusai-rsp-close').addEventListener('click', function() {
            panel.parentNode.removeChild(panel);
        });

        document.getElementById('nexusai-rsp-use').addEventListener('click', function() {
            fillReplyForm(suggestedReply, formEl);
            panel.parentNode.removeChild(panel);
        });
    }

    /**
     * Rellena el textarea (o editor Atto) del form con el texto sugerido.
     *
     * @param {string}  text
     * @param {Element} formEl
     */
    function fillReplyForm(text, formEl) {
        // Textarea simple.
        var textarea = formEl.querySelector('textarea[name="message"]');
        if (textarea) {
            textarea.value = text;
            textarea.dispatchEvent(new Event('input', {bubbles: true}));
            return;
        }

        // Editor Atto (contenteditable).
        var atto = formEl.querySelector('[contenteditable="true"]');
        if (atto) {
            atto.innerHTML = escapeHtml(text).replace(/\n/g, '<br>');
            atto.dispatchEvent(new Event('input', {bubbles: true}));
            return;
        }
    }

    /**
     * Llama al backend y muestra la sugerencia.
     *
     * @param {number}  replyToPostId
     * @param {Element} formEl
     */
    function requestSuggestion(replyToPostId, formEl) {
        var btn = document.getElementById(BTN_ID);
        if (btn) {
            btn.disabled   = true;
            btn.textContent = '⟳ Generando…';
        }

        Ajax.call([{
            methodname: 'local_nexusai_forum_suggest_reply',
            args: {
                discussionid:  discussionid,
                courseid:      courseid,
                replytopostid: replyToPostId,
            },
        }])[0].then(function(response) {
            if (btn) {
                btn.disabled   = false;
                btn.textContent = '✨ Sugerir respuesta';
            }
            if (!response.suggested_reply) {
                Notification.addNotification({
                    message: 'NexusAI: no se pudo generar una sugerencia.',
                    type:    'warning',
                });
                return;
            }
            showSuggestionPanel(response.suggested_reply, response.has_course_material, formEl);
        }).catch(function() {
            if (btn) {
                btn.disabled   = false;
                btn.textContent = '✨ Sugerir respuesta';
            }
            Notification.addNotification({
                message: 'NexusAI: error al generar la sugerencia. Intentá de nuevo.',
                type:    'error',
            });
        });
    }

    /**
     * Inyecta el botón "✨ Sugerir respuesta" en el formulario de reply.
     *
     * @param {Element} formEl  Contenedor del formulario de reply.
     */
    function injectButton(formEl) {
        if (document.getElementById(BTN_ID)) {
            return;
        }

        var replyPostId = extractReplyPostId(formEl);
        if (!replyPostId) {
            return;
        }

        var btn = document.createElement('button');
        btn.id        = BTN_ID;
        btn.type      = 'button';
        btn.textContent = '✨ Sugerir respuesta';
        btn.style.cssText = [
            'background:#f0fdf4',
            'border:1px solid #86efac',
            'border-radius:6px',
            'padding:5px 14px',
            'font-size:12px',
            'color:#166534',
            'cursor:pointer',
            'font-weight:600',
            'margin-bottom:8px',
            'display:block',
        ].join(';');

        btn.addEventListener('click', function() {
            requestSuggestion(replyPostId, formEl);
        });

        // Insertar antes del textarea / editor.
        var textarea = formEl.querySelector('textarea[name="message"], [contenteditable="true"]');
        if (textarea) {
            textarea.parentNode.insertBefore(btn, textarea);
        } else {
            // Fallback: al principio del form.
            var inner = formEl.querySelector('form') || formEl;
            inner.insertBefore(btn, inner.firstChild);
        }
    }

    /**
     * Detecta formularios de reply que aparecen dinámicamente en la página.
     * Moodle 5.x carga el form inline vía AMD/AJAX cuando se clickea "Reply".
     */
    function watchForReplyForms() {
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (!node || node.nodeType !== 1) {
                        return;
                    }
                    // El form de reply tiene action="...post.php..." con ?reply= en la URL.
                    // También puede ser un div contenedor del form.
                    var forms = node.querySelectorAll
                        ? node.querySelectorAll('form[action*="post.php"]')
                        : [];
                    forms.forEach(function(f) {
                        if (/[?&]reply=\d+/.test(f.getAttribute('action') || '')) {
                            injectButton(f.closest('.forumpost') || f.parentElement || f);
                        }
                    });

                    // Algunos temas de Moodle insertan el form directamente como node.
                    if (node.tagName === 'FORM' && /post\.php/.test(node.getAttribute('action') || '')) {
                        if (/[?&]reply=\d+/.test(node.getAttribute('action') || '')) {
                            injectButton(node.parentElement || node);
                        }
                    }
                });
            });
        });

        observer.observe(document.body, {childList: true, subtree: true});
    }

    return {
        /**
         * Punto de entrada invocado por before_footer_listener.php.
         *
         * @param {Object} params  {discussionid, courseid}
         */
        init: function(params) {
            discussionid = params.discussionid;
            courseid     = params.courseid;

            if (!discussionid || !courseid) {
                return;
            }

            watchForReplyForms();
        },
    };
});
