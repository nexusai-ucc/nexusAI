// This file is part of the NexusAI plugin for Moodle.
//
// Resumen de hilo de foro con IA (Épica 06 — F-10).
//
// Cómo funciona:
//   1. Se carga solo en páginas mod-forum-discuss (vista de una discusión).
//   2. Inserta un botón "✨ Resumir hilo" junto al título de la discusión.
//   3. Al clickear, llama a local_nexusai_forum_summarize_thread vía core/ajax.
//   4. Muestra un panel colapsable con el resumen, puntos clave e ícono de
//      resolución (✅ resuelta / ⏳ sin respuesta).
//   5. El panel se puede cerrar y volver a abrir sin re-llamar al backend
//      (resultado cacheado en memoria durante la sesión de página).

define(['core/ajax', 'core/notification'], function(Ajax, Notification) {

    var PANEL_ID  = 'nexusai-summary-panel';
    var BTN_ID    = 'nexusai-summarize-btn';
    var cachedResult = null;

    /**
     * Extrae el discussion_id de la URL actual.
     * mod/forum/discuss.php?d=<id>
     *
     * @returns {number|null}
     */
    function getDiscussionId() {
        var match = window.location.search.match(/[?&]d=(\d+)/);
        return match ? parseInt(match[1], 10) : null;
    }

    /**
     * Escapa HTML para evitar XSS al insertar texto del LLM en el DOM.
     *
     * @param {string} str
     * @returns {string}
     */
    function escapeHtml(str) {
        return String(str)
            .replace(/&/g,  '&amp;')
            .replace(/</g,  '&lt;')
            .replace(/>/g,  '&gt;')
            .replace(/"/g,  '&quot;');
    }

    /**
     * Renderiza el panel con el resultado del LLM.
     *
     * @param {Object} data  {summary, key_points, resolved, posts_used, posts_truncated}
     */
    function showPanel(data) {
        // Si hay panel cacheado (mismo contenido ya renderizado), solo mostrarlo.
        // Si hay un panel de loading, siempre reemplazarlo con el resultado real.
        var existing = document.getElementById(PANEL_ID);
        if (existing) {
            existing.parentNode.removeChild(existing);
        }

        var resolvedIcon  = data.resolved ? '✅' : '⏳';
        var resolvedLabel = data.resolved ? 'Discusión resuelta' : 'Sin respuesta definitiva';
        var truncatedNote = data.posts_truncated
            ? '<p style="font-size:11px;color:#6b7280;margin:6px 0 0">⚠️ El hilo es largo — se resumieron los primeros '
              + data.posts_used + ' posts.</p>'
            : '';

        var keyPointsHtml = '';
        if (data.key_points && data.key_points.length > 0) {
            var items = data.key_points.map(function(kp) {
                return '<li>' + escapeHtml(kp) + '</li>';
            }).join('');
            keyPointsHtml = '<ul style="margin:6px 0 0 16px;padding:0;font-size:13px">' + items + '</ul>';
        }

        var panel = document.createElement('div');
        panel.id = PANEL_ID;
        panel.style.cssText = [
            'background:#f0fdf4',
            'border:1px solid #86efac',
            'border-radius:8px',
            'padding:12px 16px',
            'margin-bottom:16px',
            'font-size:13px',
            'color:#14532d',
            'line-height:1.6',
            'position:relative',
        ].join(';');

        panel.innerHTML =
            '<button type="button" id="nexusai-panel-close" '
            + 'style="position:absolute;top:8px;right:10px;background:none;border:none;'
            + 'cursor:pointer;font-size:16px;color:#166534;padding:0;line-height:1" '
            + 'aria-label="Cerrar resumen">✕</button>'
            + '<strong style="font-size:14px">✨ NexusAI — Resumen del hilo</strong>'
            + '<span style="margin-left:8px;font-size:12px;background:#dcfce7;'
            + 'border-radius:4px;padding:2px 6px;color:#166534">'
            + resolvedIcon + ' ' + escapeHtml(resolvedLabel) + '</span>'
            + '<p style="margin:8px 0 0">' + escapeHtml(data.summary) + '</p>'
            + (keyPointsHtml
                ? '<p style="margin:8px 0 0;font-weight:600;font-size:12px;color:#166534">'
                  + 'PUNTOS CLAVE</p>' + keyPointsHtml
                : '')
            + truncatedNote;

        // Insertar antes del primer post de la discusión.
        var anchor = document.querySelector('.discussionposts, #page-mod-forum-discuss .forumpost, .forum-post-container');
        if (anchor) {
            anchor.parentNode.insertBefore(panel, anchor);
        } else {
            // Fallback: antes del main content.
            var main = document.getElementById('region-main') || document.querySelector('[role="main"]');
            if (main) {
                main.insertBefore(panel, main.firstChild);
            }
        }

        document.getElementById('nexusai-panel-close').addEventListener('click', function() {
            panel.style.display = 'none';
        });
    }

    /**
     * Muestra el estado de carga dentro del panel (mientras espera el LLM).
     */
    function showLoading() {
        var existing = document.getElementById(PANEL_ID);
        if (existing) {
            existing.remove();
        }

        var panel = document.createElement('div');
        panel.id = PANEL_ID;
        panel.style.cssText = [
            'background:#f0fdf4',
            'border:1px solid #86efac',
            'border-radius:8px',
            'padding:12px 16px',
            'margin-bottom:16px',
            'font-size:13px',
            'color:#14532d',
        ].join(';');
        panel.innerHTML = '<strong>✨ NexusAI</strong> — Resumiendo hilo'
            + '<span style="display:inline-block;margin-left:8px;animation:nexusai-spin 1s linear infinite">⟳</span>';

        var style = document.createElement('style');
        style.textContent = '@keyframes nexusai-spin{to{transform:rotate(360deg)}}';
        panel.appendChild(style);

        var anchor = document.querySelector('.discussionposts, #page-mod-forum-discuss .forumpost, .forum-post-container');
        if (anchor) {
            anchor.parentNode.insertBefore(panel, anchor);
        } else {
            var main = document.getElementById('region-main') || document.querySelector('[role="main"]');
            if (main) {
                main.insertBefore(panel, main.firstChild);
            }
        }
    }

    /**
     * Llama al backend y muestra el panel.
     *
     * @param {number} discussionid
     * @param {number} courseid
     */
    function summarize(discussionid, courseid) {
        // Si ya tenemos el resultado en cache, mostrarlo directamente sin llamar al backend.
        if (cachedResult) {
            var existing = document.getElementById(PANEL_ID);
            if (existing) {
                existing.style.display = '';
            } else {
                showPanel(cachedResult);
            }
            return;
        }

        var btn = document.getElementById(BTN_ID);
        if (btn) {
            btn.disabled = true;
            btn.textContent = '⟳ Resumiendo…';
        }

        showLoading();

        Ajax.call([{
            methodname: 'local_nexusai_forum_summarize_thread',
            args: {
                discussionid: discussionid,
                courseid:     courseid,
            },
        }])[0].then(function(response) {
            cachedResult = response;
            showPanel(response);
            if (btn) {
                btn.disabled = false;
                btn.textContent = '✨ Resumir hilo';
            }
        }).catch(function(err) {
            var panel = document.getElementById(PANEL_ID);
            if (panel) { panel.remove(); }
            if (btn) {
                btn.disabled = false;
                btn.textContent = '✨ Resumir hilo';
            }
            Notification.addNotification({
                message: 'NexusAI: no se pudo resumir el hilo. Intentá de nuevo.',
                type:    'error',
            });
        });
    }

    /**
     * Inserta el botón "Resumir hilo" junto al título de la discusión.
     *
     * @param {number} discussionid
     * @param {number} courseid
     */
    function injectButton(discussionid, courseid) {
        if (document.getElementById(BTN_ID)) {
            return;
        }

        var btn = document.createElement('button');
        btn.id        = BTN_ID;
        btn.type      = 'button';
        btn.textContent = '✨ Resumir hilo';
        btn.style.cssText = [
            'background:#f0fdf4',
            'border:1px solid #86efac',
            'border-radius:6px',
            'padding:4px 12px',
            'font-size:12px',
            'color:#166534',
            'cursor:pointer',
            'margin-left:12px',
            'vertical-align:middle',
            'font-weight:600',
        ].join(';');

        btn.addEventListener('click', function() {
            summarize(discussionid, courseid);
        });

        // Intentar poner el botón junto al título del hilo.
        var titleEl = document.querySelector(
            '.discussionname, h1.h2, .page-header-headings h1, #page-header h1'
        );
        if (titleEl) {
            titleEl.appendChild(btn);
        } else {
            // Fallback: arriba del primer post.
            var anchor = document.querySelector('.discussionposts, .forum-post-container');
            if (anchor) {
                anchor.parentNode.insertBefore(btn, anchor);
            }
        }
    }

    return {
        /**
         * Punto de entrada invocado por before_footer_listener.php.
         *
         * @param {Object} params  {discussionid, courseid}
         */
        init: function(params) {
            var discussionid = params.discussionid || getDiscussionId();
            var courseid     = params.courseid;

            if (!discussionid || !courseid) {
                return;
            }

            if (document.readyState !== 'loading') {
                injectButton(discussionid, courseid);
            } else {
                document.addEventListener('DOMContentLoaded', function() {
                    injectButton(discussionid, courseid);
                });
            }
        },
    };
});
