// This file is part of the NexusAI plugin for Moodle.
//
// AI summary of a forum thread (Epic 06 — F-10).
//
// How it works:
//   1. It is loaded only on mod-forum-discuss pages (discussion view).
//   2. It adds a "Summarize thread" button next to the discussion title.
//   3. On click it calls local_nexusai_forum_summarize_thread through core/ajax.
//   4. It shows a collapsible panel with the summary, the key points and a
//      resolution badge (resolved / no definitive answer).
//   5. The panel can be closed and reopened without calling the backend again
//      (the result is cached in memory for the lifetime of the page).
//
// Every fixed text comes from the language pack (lang/*/local_nexusai.php) so it
// follows the language of the Moodle user.

define(['core/ajax', 'core/notification', 'core/str'], function(Ajax, Notification, Str) {

    var COMPONENT = 'local_nexusai';
    var PANEL_ID  = 'nexusai-summary-panel';
    var BTN_ID    = 'nexusai-summarize-btn';
    var ANCHOR    = '.discussionposts, #page-mod-forum-discuss .forumpost, .forum-post-container';
    var cachedResult = null;
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
            'forum_summary_button',
            'forum_summary_close',
            'forum_summary_error',
            'forum_summary_keypoints',
            'forum_summary_loading',
            'forum_summary_resolved',
            'forum_summary_title',
            'forum_summary_unresolved',
            'forum_summary_working',
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
     * Extracts the discussion id from the current URL (mod/forum/discuss.php?d=<id>).
     *
     * @returns {number|null}
     */
    function getDiscussionId() {
        var match = window.location.search.match(/[?&]d=(\d+)/);
        return match ? parseInt(match[1], 10) : null;
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
     * Puts the panel right before the first post of the discussion.
     *
     * @param {Element} panel The panel element.
     */
    function insertPanel(panel) {
        var anchor = document.querySelector(ANCHOR);
        if (anchor) {
            anchor.parentNode.insertBefore(panel, anchor);
            return;
        }
        // Fallback: top of the main content area.
        var main = document.getElementById('region-main') || document.querySelector('[role="main"]');
        if (main) {
            main.insertBefore(panel, main.firstChild);
        }
    }

    /**
     * Renders the panel with the LLM result.
     *
     * @param {Object} data {summary, key_points, resolved, posts_used, posts_truncated}
     * @returns {Promise} Resolves once the panel is in the page.
     */
    function showPanel(data) {
        var existing = document.getElementById(PANEL_ID);
        if (existing) {
            existing.parentNode.removeChild(existing);
        }

        var truncated = data.posts_truncated
            ? Str.get_string('forum_summary_truncated', COMPONENT, data.posts_used)
            : Promise.resolve('');

        return truncated.then(function(truncatedText) {
            var resolvedIcon  = data.resolved ? '✅' : '⏳';
            var resolvedLabel = data.resolved ? strings.forum_summary_resolved : strings.forum_summary_unresolved;
            var truncatedNote = truncatedText
                ? '<p style="font-size:11px;color:#6b7280;margin:6px 0 0">⚠️ ' + escapeHtml(truncatedText) + '</p>'
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
                + 'aria-label="' + escapeHtml(strings.forum_summary_close) + '">✕</button>'
                + '<strong style="font-size:14px">✨ ' + escapeHtml(strings.forum_summary_title) + '</strong>'
                + '<span style="margin-left:8px;font-size:12px;background:#dcfce7;'
                + 'border-radius:4px;padding:2px 6px;color:#166534">'
                + resolvedIcon + ' ' + escapeHtml(resolvedLabel) + '</span>'
                + '<p style="margin:8px 0 0">' + escapeHtml(data.summary) + '</p>'
                + (keyPointsHtml
                    ? '<p style="margin:8px 0 0;font-weight:600;font-size:12px;color:#166534;'
                      + 'text-transform:uppercase">' + escapeHtml(strings.forum_summary_keypoints) + '</p>' + keyPointsHtml
                    : '')
                + truncatedNote;

            insertPanel(panel);

            document.getElementById('nexusai-panel-close').addEventListener('click', function() {
                panel.style.display = 'none';
            });
        });
    }

    /**
     * Shows the loading state inside the panel while the LLM works.
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
        panel.innerHTML = '<strong>✨ NexusAI</strong> — ' + escapeHtml(strings.forum_summary_loading)
            + '<span style="display:inline-block;margin-left:8px;animation:nexusai-spin 1s linear infinite">⟳</span>';

        var style = document.createElement('style');
        style.textContent = '@keyframes nexusai-spin{to{transform:rotate(360deg)}}';
        panel.appendChild(style);

        insertPanel(panel);
    }

    /**
     * Calls the backend and shows the panel.
     *
     * @param {number} discussionid Discussion id.
     * @param {number} courseid     Course id.
     */
    function summarize(discussionid, courseid) {
        // With a cached result there is no need to call the backend again.
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
            btn.textContent = '⟳ ' + strings.forum_summary_working;
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
            return showPanel(response);
        }).then(function() {
            if (btn) {
                btn.disabled = false;
                btn.textContent = '✨ ' + strings.forum_summary_button;
            }
            return null;
        }).catch(function() {
            var panel = document.getElementById(PANEL_ID);
            if (panel) {
                panel.remove();
            }
            if (btn) {
                btn.disabled = false;
                btn.textContent = '✨ ' + strings.forum_summary_button;
            }
            Notification.addNotification({
                message: strings.forum_summary_error,
                type:    'error',
            });
        });
    }

    /**
     * Adds the "Summarize thread" button next to the discussion title.
     *
     * @param {number} discussionid Discussion id.
     * @param {number} courseid     Course id.
     */
    function injectButton(discussionid, courseid) {
        if (document.getElementById(BTN_ID)) {
            return;
        }

        var btn = document.createElement('button');
        btn.id        = BTN_ID;
        btn.type      = 'button';
        btn.textContent = '✨ ' + strings.forum_summary_button;
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

        // Try to put the button next to the thread title.
        var titleEl = document.querySelector(
            '.discussionname, h1.h2, .page-header-headings h1, #page-header h1'
        );
        if (titleEl) {
            titleEl.appendChild(btn);
        } else {
            // Fallback: above the first post.
            var anchor = document.querySelector('.discussionposts, .forum-post-container');
            if (anchor) {
                anchor.parentNode.insertBefore(btn, anchor);
            }
        }
    }

    return {
        /**
         * Entry point invoked by before_footer_listener.php.
         *
         * @param {Object} params {discussionid, courseid}
         */
        init: function(params) {
            var discussionid = params.discussionid || getDiscussionId();
            var courseid     = params.courseid;

            if (!discussionid || !courseid) {
                return;
            }

            loadStrings().then(function() {
                if (document.readyState !== 'loading') {
                    injectButton(discussionid, courseid);
                } else {
                    document.addEventListener('DOMContentLoaded', function() {
                        injectButton(discussionid, courseid);
                    });
                }
                return null;
            }).catch(Notification.exception);
        },
    };
});
