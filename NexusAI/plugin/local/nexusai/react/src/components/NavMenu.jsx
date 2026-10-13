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
 */

import { IconBookOpen, IconCalendar, IconClipboardList, IconMessageSquare, IconSearch, IconSparkles } from "./icons.jsx";

const ITEMS = [
    { key: "chat", labelEs: "Chat", labelEn: "Chat", Icon: IconSparkles },
    { key: "study", labelEs: "Modo Estudio", labelEn: "Study Mode", Icon: IconBookOpen },
    { key: "search", labelEs: "Buscar", labelEn: "Search", Icon: IconSearch, studentOnly: true },
    { key: "calendar", labelEs: "Calendario", labelEn: "Calendar", Icon: IconCalendar },
    { key: "review", labelEs: "Revisión del curso", labelEn: "Course review", Icon: IconClipboardList, teacherOnly: true },
    { key: "forumdigest", labelEs: "Resumen del foro", labelEn: "Forum digest", Icon: IconMessageSquare, teacherOnly: true },
];

export default function NavMenu({ open, onClose, activeTab, onSelect, isTeacher = false, lang = "es" }) {
    if (!open) return null;

    const title = lang === "es" ? "Ir a" : "Go to";
    const closeLabel = lang === "es" ? "Cerrar" : "Close";

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
            </div>
        </div>
    );
}
