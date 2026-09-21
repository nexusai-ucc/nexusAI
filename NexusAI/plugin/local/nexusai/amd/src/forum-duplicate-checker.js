// This file is part of the NexusAI plugin for Moodle.
//
// Similar-post detector for the forum form (Epic 06 — F-08/F-09).
//
// How it works:
//   1. It is loaded only on mod-forum-post pages (new discussion or reply).
//   2. It watches the "Subject" field with an 800 ms debounce.
//   3. When the subject has >= 10 characters it calls local_nexusai_forum_search_similar.
//   4. If it finds similar posts (similarity >= 0.75) it shows a yellow banner
//      above the submit buttons with a preview of the similar post.
//   5. It never blocks posting — the user can publish anyway.
//
// Every fixed text comes from the language pack (lang/*/local_nexusai.php) so it
// follows the language of the Moodle user.

define(['core/ajax', 'core/str'], function(Ajax, Str) {

    var COMPONENT     = 'local_nexusai';
    var DEBOUNCE_MS   = 800;
    var MIN_CHARS     = 10;
    var BANNER_ID     = 'nexusai-similar-banner';
    var debounceTimer = null;
    var lastQuery     = '';

    /**
     * Escapes HTML so previews and language strings are safe to inject in the DOM.
     *
     * @param {string} str Text to escape.
     * @returns {string}
     */
    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * Removes the banner if it is in the page.
     */
    function hideBanner() {
        var existing = document.getElementById(BANNER_ID);
        if (existing) {
            existing.parentNode.removeChild(existing);
        }
    }

    /**
     * Builds the banner element and puts it above the form submit buttons.
     * The banner is replaced if it already exists.
     *
     * @param {Array}  posts   List of {forum_post_id, discussion_id, similarity, preview}.
     * @param {string} wwwroot Moodle site root, used to build URLs.
     */
    function showBanner(posts, wwwroot) {
        hideBanner();
        if (!posts || posts.length === 0) {
            return;
        }

        var top = posts[0];
        var pct = Math.round(top.similarity * 100);
        var discussionUrl = wwwroot + 'mod/forum/discuss.php?d=' + top.discussion_id;

        Str.get_strings([
            {key: 'forum_similar_found', component: COMPONENT, param: pct},
            {key: 'forum_similar_view',  component: COMPONENT},
            {key: 'forum_similar_more',  component: COMPONENT, param: posts.length - 1},
            {key: 'forum_similar_close', component: COMPONENT},
        ]).then(function(strings) {
            // The user may have kept typing while the strings were loading.
            hideBanner();

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
                '<strong>⚠️ NexusAI:</strong> ' + escapeHtml(strings[0]) + '<br>' +
                '<em style="color:#78350f">"' + escapeHtml(previewText) + '"</em><br>' +
                '<a href="' + escapeHtml(discussionUrl) + '" target="_blank" ' +
                'style="color:#d97706;font-weight:600">' + escapeHtml(strings[1]) + ' →</a>' +
                (posts.length > 1
                    ? ' &nbsp;·&nbsp; <span style="color:#a16207">' + escapeHtml(strings[2]) + '</span>'
                    : '') +
                '<button type="button" id="nexusai-similar-close" ' +
                'style="float:right;background:none;border:none;cursor:pointer;font-size:16px;' +
                'color:#92400e;padding:0;line-height:1" ' +
                'aria-label="' + escapeHtml(strings[3]) + '">✕</button>';

            // Put it before the container of the submit buttons.
            var submitRow = document.querySelector(
                '.fitem_actionbuttons, #id_submitbutton, [data-fieldtype="submit"]'
            );
            if (submitRow) {
                submitRow.parentNode.insertBefore(banner, submitRow);
            } else {
                // Fallback: end of the form.
                var form = document.querySelector('form#mformforum, form[action*="forum/post.php"]');
                if (form) {
                    form.appendChild(banner);
                }
            }

            document.getElementById('nexusai-similar-close').addEventListener('click', function() {
                banner.style.display = 'none';
            });
            return null;
        }).catch(function() {
            // Silent failure — never interrupt the user.
        });
    }

    /**
     * Calls the backend through core/ajax and shows the banner if there are similar posts.
     *
     * @param {string} text     Text to compare (the post subject).
     * @param {number} courseid Course id.
     * @param {string} wwwroot  Site root.
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
            showBanner(response.similar_posts || [], wwwroot);
            return null;
        }).catch(function() {
            // Silent failure — never interrupt the user.
        });
    }

    /**
     * Attaches the listener to the subject input once it exists in the page.
     *
     * @param {number} courseid Course id.
     * @param {string} wwwroot  Site root.
     */
    function tryAttach(courseid, wwwroot) {
        // Moodle 5.x can use name="subject" or id="id_subject".
        var subjectInput = document.querySelector(
            'input[name="subject"]:not([data-nexusai-attached]),' +
            'input[id="id_subject"]:not([data-nexusai-attached])'
        );
        if (!subjectInput) {
            return;
        }
        // Mark it so the listener is not duplicated when the MutationObserver fires again.
        subjectInput.setAttribute('data-nexusai-attached', '1');

        subjectInput.addEventListener('input', function() {
            var text = subjectInput.value.trim();

            clearTimeout(debounceTimer);
            hideBanner();

            if (text.length < MIN_CHARS || text === lastQuery) {
                return;
            }

            debounceTimer = setTimeout(function() {
                lastQuery = text;
                checkSimilar(text, courseid, wwwroot);
            }, DEBOUNCE_MS);
        });
    }

    return {
        /**
         * Entry point invoked by before_footer_listener.php.
         *
         * @param {Object} params {courseid, wwwroot}
         */
        init: function(params) {
            var courseid = params.courseid;
            var wwwroot  = params.wwwroot || '/';

            // Try to attach right away (DOMContentLoaded may already have happened).
            if (document.readyState !== 'loading') {
                tryAttach(courseid, wwwroot);
            } else {
                document.addEventListener('DOMContentLoaded', function() {
                    tryAttach(courseid, wwwroot);
                });
            }

            // In Moodle 5.x the form can open lazily or in a modal after load, so we
            // watch the DOM and attach when the subject input appears.
            var observer = new MutationObserver(function() {
                tryAttach(courseid, wwwroot);
            });
            observer.observe(document.body, {childList: true, subtree: true});
        },
    };
});
