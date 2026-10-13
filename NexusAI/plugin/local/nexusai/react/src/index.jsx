/**
 * Entry point of the NexusAI React bundle.
 *
 * This `init` function is what Moodle calls from the footer hook
 * (classes/hook/output/before_footer_listener.php):
 *
 *   $PAGE->requires->js_call_amd('local_nexusai/chatwidget-lazy', 'init', [params]);
 *
 * IMPORTANT — about code splitting:
 * Originally this file used dynamic imports (`import('react')`) for code
 * splitting, but Moodle does not handle Webpack's lazy chunks well because the
 * base URL of Moodle's RequireJS does not match the one Webpack tries to use to
 * resolve the chunks (they end up pointing at other CDNs like MathJax and fail).
 *
 * Solution: static imports. A single bundle. That is what Moodle's official
 * guide recommends for plugins with React. If we need code splitting in the
 * future, __webpack_public_path__ has to be set dynamically.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import ChatApp from './ChatApp.jsx';
import OnboardingApp from './OnboardingApp.jsx';
import './styles.css';

// ONB-03: which onboarding mode the plugin asked for (or null for the normal widget).
// 'create-course' → setup tutorial when creating a new course.
const ONBOARDING_MODES = {
    'create-course': 'create',
    'review-course': 'review',
};

export const init = (params = {}) => {
    const container = document.getElementById('local-nexusai-container');
    if (!container) {
        return;
    }

    try {
        const root = createRoot(container);
        const onbMode = ONBOARDING_MODES[params.onboarding];
        root.render(
            onbMode ? (
                <OnboardingApp
                    mode={onbMode}
                    courseid={params.courseid}
                    wwwroot={params.wwwroot}
                    lang={params.lang || 'es'}
                />
            ) : (
                <ChatApp
                    courseid={params.courseid}
                    userid={params.userid}
                    sesskey={params.sesskey}
                    wwwroot={params.wwwroot}
                    lang={params.lang || 'es'}
                    isteacher={params.isteacher || 0}
                />
            )
        );
    } catch {
        // Mount failure is silent — widget simply won't appear
    }
};

// Default export for AMD compatibility (some consumers use `.default`).
export default { init };
