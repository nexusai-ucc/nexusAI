/**
 * NavMenu — menú de navegación del widget (UX-01).
 *
 * Reemplaza la tira de pestañas persistente (Chat/Quiz/Repaso/Calendario/
 * Buscar) por un dropdown que se abre desde un ícono del header — mismo
 * patrón estructural que HistoryDropdown.jsx (open/onClose, panel absoluto
 * bajo el header). Al elegir un destino, cambia `activeTab` en ChatApp y se
 * cierra solo.
 */

import { IconBookOpen, IconCalendar, IconSearch, IconSparkles } from "./icons.jsx";

const ITEMS = [
    { key: "chat", labelEs: "Chat", labelEn: "Chat", Icon: IconSparkles },
    { key: "study", labelEs: "Modo Estudio", labelEn: "Study Mode", Icon: IconBookOpen },
    { key: "search", labelEs: "Buscar", labelEn: "Search", Icon: IconSearch, studentOnly: true },
    { key: "calendar", labelEs: "Calendario", labelEn: "Calendar", Icon: IconCalendar },
];

export default function NavMenu({ open, onClose, activeTab, onSelect, isTeacher = false, lang = "es" }) {
    if (!open) return null;

    const title = lang === "es" ? "Ir a" : "Go to";

    return (
        <div className="nexusai-navmenu">
            <div className="nexusai-navmenu__header">
                <span className="nexusai-navmenu__title">{title}</span>
                <button
                    type="button"
                    className="nexusai-navmenu__close"
                    onClick={onClose}
                    aria-label="Cerrar"
                >×</button>
            </div>

            <div className="nexusai-navmenu__list">
                {ITEMS.filter((item) => !(item.studentOnly && isTeacher)).map(({ key, labelEs, labelEn, Icon }) => (
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
