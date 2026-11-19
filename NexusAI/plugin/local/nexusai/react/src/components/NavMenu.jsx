// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Part of the NexusAI plugin (local_nexusai).
 *
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * NavMenu — the widget's navigation menu (UX-01).
 *
 * Replaces the persistent tab strip (Chat/Quiz/Review/Calendar/
 * Search) with a dropdown that opens from an icon in the header — same
 * structural pattern as HistoryDropdown.jsx (open/onClose, absolute panel
 * under the header). When a destination is chosen, it changes `activeTab` in
 * ChatApp and closes on its own.
 *
 * ONB-06: "Course review" (teacherOnly) — permanent access to the setup
 * checklist in review mode, without having to be on `course/edit.php`.
 *
 * "My API key" (BYOK): last item, apart from the course destinations because it
 * is the user's own setting. Shown to students and teachers while the site
 * allows own keys; under its name, the provider and whether it is connected.
 */

import { IconBookOpen, IconCalendar, IconClipboardList, IconKey, IconMessageSquare, IconSearch, IconSparkles } from "./icons.jsx";

const ITEMS = [
    { key: "chat", labelEs: "Chat", labelEn: "Chat", Icon: IconSparkles },
    { key: "study", labelEs: "Modo Estudio", labelEn: "Study Mode", Icon: IconBookOpen },
    { key: "search", labelEs: "Buscar", labelEn: "Search", Icon: IconSearch, studentOnly: true },
    { key: "calendar", labelEs: "Calendario", labelEn: "Calendar", Icon: IconCalendar },
    { key: "review", labelEs: "Revisión del curso", labelEn: "Course review", Icon: IconClipboardList, teacherOnly: true },
    { key: "forumdigest", labelEs: "Resumen del foro", labelEn: "Forum digest", Icon: IconMessageSquare, teacherOnly: true },
];

function userLlmSubtitle(userLlm, lang) {
    const es = lang === "es";
    if (!userLlm.configured) return es ? "Sin configurar" : "Not set up";
    if (!userLlm.courseallowed) return `${userLlm.providerlabel} · ${es ? "pausada en este curso" : "paused in this course"}`;
    if (!userLlm.active) return `${userLlm.providerlabel} · ${es ? "hay que cargarla de nuevo" : "needs to be added again"}`;
    return `${userLlm.providerlabel} · ${es ? "conectada" : "connected"}`;
}

export default function NavMenu({ open, onClose, activeTab, onSelect, isTeacher = false, lang = "es", userLlm = null }) {
    if (!open) return null;

    const title = lang === "es" ? "Ir a" : "Go to";
    const closeLabel = lang === "es" ? "Cerrar" : "Close";
    const showUserLlm = !!userLlm?.siteenabled;

    return (
        <div className="nexusai-navmenu">
            <div className="nexusai-navmenu__header">
                <span className="nexusai-navmenu__title">{title}</span>
                <button
                    type="button"
                    className="nexusai-navmenu__close"
                    onClick={onClose}
                    aria-label={closeLabel}
                >×</button>
            </div>

            <div className="nexusai-navmenu__list">
                {ITEMS.filter((item) => !(item.studentOnly && isTeacher) && !(item.teacherOnly && !isTeacher)).map(({ key, labelEs, labelEn, Icon }) => (
                    <button
                        key={key}
                        type="button"
                        className={`nexusai-navmenu__item ${activeTab === key ? "nexusai-navmenu__item--active" : ""}`}
                        onClick={() => { onSelect(key); onClose(); }}
                    >
                        <span className="nexusai-navmenu__item-icon">
                            <Icon size={16} />
                        </span>
                        <span className="nexusai-navmenu__item-label">
                            {lang === "es" ? labelEs : labelEn}
                        </span>
                    </button>
                ))}
                {showUserLlm && (
                    <>
                        <div className="nexusai-navmenu__sep" role="separator" />
                        <button
                            type="button"
                            className={`nexusai-navmenu__item ${activeTab === "apikey" ? "nexusai-navmenu__item--active" : ""}`}
                            onClick={() => { onSelect("apikey"); onClose(); }}
                        >
                            <span className="nexusai-navmenu__item-icon">
                                <IconKey size={16} />
                            </span>
                            <span className="nexusai-navmenu__item-label">
                                {lang === "es" ? "Mi API key" : "My API key"}
                                <span className="nexusai-navmenu__item-sub">{userLlmSubtitle(userLlm, lang)}</span>
                            </span>
                            {userLlm.active && (
                                <span
                                    className="nexusai-navmenu__item-dot"
                                    aria-label={lang === "es" ? "Conectada" : "Connected"}
                                />
                            )}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
