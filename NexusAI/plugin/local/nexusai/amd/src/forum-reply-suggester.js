// This file is part of the NexusAI plugin for Moodle.
//
// AI reply suggestion in forum reply forms (Epic 06 — F-11).
//
// How it works:
//   1. It is loaded on mod-forum-discuss pages (discussion view).
//   2. It uses a MutationObserver to detect when the reply form appears.
//   3. It adds a "Suggest reply" button next to the text area.
//   4. On click it calls local_nexusai_forum_suggest_reply with the post being
//      replied to.
//   5. It shows the suggestion in a panel with a "Use this reply" button.
//
// Every fixed text comes from the language pack (lang/*/local_nexusai.php) so it
// follows the language of the Moodle user.

define(['core/ajax', 'core/notification', 'core/str'], function(Ajax, Notification, Str) {

    var COMPONENT = 'local_nexusai';
    var BTN_ID   = 'nexusai-suggest-reply-btn';
    var PANEL_ID = 'nexusai-reply-suggestion-panel';

    var discussionid, courseid;
    var strings = null;

    /**
     * Loads every fixed UI text of this module from the language pack (once).
     *
     * @returns {Promise} Resolves with an object keyed by string identifier.
     */
    function loadStrings() {
        if (strings) {
            return Promise.resolve(strings);
        }
        var keys = [
            'forum_suggest_button',
            'forum_suggest_close',
            'forum_suggest_empty',
            'forum_suggest_error',
            'forum_suggest_material',
            'forum_suggest_title',
            'forum_suggest_use',
            'forum_suggest_working',
        ];
        return Str.get_strings(keys.map(function(key) {
            return {key: key, component: COMPONENT};
        })).then(function(values) {
            strings = {};
            keys.forEach(function(key, i) {
                strings[key] = values[i];
            });
            return strings;
        });
    }

    /**
     * Escapes HTML so LLM output and language strings are safe to inject in the DOM.
     *
     * @param {string} str Text to escape.
     * @returns {string}
     */
    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /**
     * Extracts the id of the post being replied to from the reply form.
     * Moodle uses action="post.php?reply=POSTID" or a hidden input named "reply".
     *
     * @param {Element} formEl The detected reply form (or its container).
     * @returns {number|null}
     */
    function extractReplyPostId(formEl) {
        // 1. Look in the form action.
        var form = formEl.tagName === 'FORM' ? formEl : formEl.querySelector('form');
        if (form) {
            var action = form.getAttribute('action') || '';
            var m = action.match(/[?&]reply=(\d+)/);
            if (m) {
                return parseInt(m[1], 10);
            }
        }

        // 2. Look for a hidden input name="reply" inside the form.
        var hiddenReply = (form || formEl).querySelector('input[name="reply"]');
        if (hiddenReply && hiddenReply.value) {
            return parseInt(hiddenReply.value, 10);
        }

        // 3. Fallback: find the parent post in the DOM and read its id="pXXX".
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
     * Fills the form textarea (or the editor) with the suggested text.
     *
     * @param {string}  text   Suggested reply.
     * @param {Element} formEl The reply form.
     */
    function fillReplyForm(text, formEl) {
        // Plain textarea.
        var textarea = formEl.querySelector('textarea[name="message"]');
        if (textarea) {
            textarea.value = text;
            textarea.dispatchEvent(new Event('input', {bubbles: true}));
            return;
        }

        // Rich text editor (contenteditable).
        var editor = formEl.querySelector('[contenteditable="true"]');
        if (editor) {
            editor.innerHTML = escapeHtml(text).replace(/\n/g, '<br>');
            editor.dispatchEvent(new Event('input', {bubbles: true}));
        }
    }

    /**
     * Shows the panel with the LLM suggestion below the form.
     *
     * @param {string}  suggestedReply Suggested reply text.
     * @param {boolean} hasMaterial    Whether course material was used.
     * @param {Element} formEl         The reply form (used to place the panel).
     */
    function showSuggestionPanel(suggestedReply, hasMaterial, formEl) {
        // Remove the previous panel, if any.
        var old = document.getElementById(PANEL_ID);
        if (old) {
            old.parentNode.removeChild(old);
        }

        var materialNote = hasMaterial
            ? '<span style="font-size:11px;color:#166534;margin-left:8px">📚 '
              + escapeHtml(strings.forum_suggest_material) + '</span>'
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
            + 'aria-label="' + escapeHtml(strings.forum_suggest_close) + '">✕</button>'
            + '<strong style="font-size:13px">✨ ' + escapeHtml(strings.forum_suggest_title) + '</strong>'
            + materialNote
            + '<p id="nexusai-rsp-text" style="margin:8px 0;white-space:pre-wrap">'
            + escapeHtml(suggestedReply)
            + '</p>'
            + '<button type="button" id="nexusai-rsp-use" '
            + 'style="background:#166534;color:#fff;border:none;border-radius:6px;'
            + 'padding:5px 14px;font-size:12px;cursor:pointer;font-weight:600">'
            + escapeHtml(strings.forum_suggest_use) + '</button>';

        // Insert right after the form.
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
     * Calls the backend and shows the suggestion.
     *
     * @param {number}  replyToPostId Id of the post being replied to.
     * @param {Element} formEl        The reply form.
     */
    function requestSuggestion(replyToPostId, formEl) {
        var btn = document.getElementById(BTN_ID);
        if (btn) {
            btn.disabled   = true;
            btn.textContent = '⟳ ' + strings.forum_suggest_working;
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
                btn.textContent = '✨ ' + strings.forum_suggest_button;
            }
            if (!response.suggested_reply) {
                Notification.addNotification({
                    message: strings.forum_suggest_empty,
                    type:    'warning',
                });
                return;
            }
            showSuggestionPanel(response.suggested_reply, response.has_course_material, formEl);
        }).catch(function() {
            if (btn) {
                btn.disabled   = false;
                btn.textContent = '✨ ' + strings.forum_suggest_button;
            }
            Notification.addNotification({
                message: strings.forum_suggest_error,
                type:    'error',
            });
        });
    }

    /**
     * Adds the "Suggest reply" button to the reply form.
     *
     * @param {Element} formEl Container of the reply form.
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
        btn.textContent = '✨ ' + strings.forum_suggest_button;
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

        // Insert before the textarea / editor.
        var textarea = formEl.querySelector('textarea[name="message"], [contenteditable="true"]');
        if (textarea) {
            textarea.parentNode.insertBefore(btn, textarea);
        } else {
            // Fallback: at the top of the form.
            var inner = formEl.querySelector('form') || formEl;
            inner.insertBefore(btn, inner.firstChild);
        }
    }

    /**
     * Detects reply forms that appear dynamically in the page.
     * Moodle 5.x loads the inline form through AMD/AJAX when "Reply" is clicked.
     */
    function watchForReplyForms() {
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (!node || node.nodeType !== 1) {
                        return;
                    }
                    // The reply form has action="...post.php..." with ?reply= in the URL.
                    // The node can also be a container div around the form.
                    var forms = node.querySelectorAll
                        ? node.querySelectorAll('form[action*="post.php"]')
                        : [];
                    forms.forEach(function(f) {
                        if (/[?&]reply=\d+/.test(f.getAttribute('action') || '')) {
                            injectButton(f.closest('.forumpost') || f.parentElement || f);
                        }
                    });

                    // Some Moodle themes insert the form directly as the node.
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
         * Entry point invoked by before_footer_listener.php.
         *
         * @param {Object} params {discussionid, courseid}
         */
        init: function(params) {
            discussionid = params.discussionid;
            courseid     = params.courseid;

            if (!discussionid || !courseid) {
                return;
            }

            loadStrings().then(function() {
                watchForReplyForms();
                return null;
            }).catch(Notification.exception);
        },
    };
});
