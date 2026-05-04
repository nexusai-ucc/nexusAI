/**
 * ChatApp — componente principal del widget de NexusAI.
 *
 * Sprint 1 (esto): hello world. Una burbuja flotante en el bottom-right que se
 * expande a un panel y muestra el contexto del curso/usuario que recibió desde
 * Moodle. Sirve para verificar end-to-end que:
 *
 *   1. Moodle compila y carga el bundle AMD.
 *   2. lib.php está pasando bien el courseid/userid/sesskey.
 *   3. React monta sin pelearse con jQuery / RequireJS.
 *
 * Sprint 2: acá viene el chat real (mensajes, streaming, contexto RAG).
 *
 * Props (vienen desde lib.php → js_call_amd):
 *   - courseid:  ID del curso actual de Moodle
 *   - userid:    ID del usuario logueado
 *   - sesskey:   token CSRF de Moodle (para futuras llamadas AJAX)
 *   - wwwroot:   URL base de Moodle
 *   - lang:      'es' | 'en'
 */

import { useState } from 'react';

const STRINGS = {
    es: {
        title:        'Asistente NexusAI',
        helloUser:    'Hola, sos el usuario',
        course:       'Curso actual',
        statusOk:     '✓ Skeleton funcionando — listo para Sprint 2',
        openChat:     'Abrir chat',
        closeChat:    'Cerrar',
    },
    en: {
        title:        'NexusAI Assistant',
        helloUser:    'Hello, you are user',
        course:       'Current course',
        statusOk:     '✓ Skeleton working — ready for Sprint 2',
        openChat:     'Open chat',
        closeChat:    'Close',
    },
};

export default function ChatApp({ courseid, userid, sesskey, wwwroot, lang = 'es' }) {
    const [open, setOpen] = useState(false);
    const t = STRINGS[lang] || STRINGS.es;

    return (
        <div className="nexusai-widget">
            {/* Burbuja flotante (floating action button) */}
            <button
                type="button"
                className="nexusai-fab"
                onClick={() => setOpen((v) => !v)}
                aria-label={open ? t.closeChat : t.openChat}
                title={open ? t.closeChat : t.openChat}
            >
                {open ? '×' : '💬'}
            </button>

            {/* Panel del chat (solo visible cuando open === true) */}
            {open && (
                <div className="nexusai-panel" role="dialog" aria-labelledby="nexusai-title">
                    <header className="nexusai-panel__header">
                        <h3 id="nexusai-title" className="nexusai-panel__title">
                            {t.title}
                        </h3>
                        <button
                            type="button"
                            className="nexusai-panel__close"
                            onClick={() => setOpen(false)}
                            aria-label={t.closeChat}
                        >
                            ×
                        </button>
                    </header>

                    <div className="nexusai-panel__body">
                        <p className="nexusai-status">{t.statusOk}</p>

                        <dl className="nexusai-debug">
                            <dt>{t.helloUser}</dt>
                            <dd><code>{userid}</code></dd>

                            <dt>{t.course}</dt>
                            <dd><code>{courseid}</code></dd>

                            <dt>sesskey</dt>
                            <dd><code>{sesskey?.slice(0, 8)}...</code></dd>

                            <dt>wwwroot</dt>
                            <dd><code>{wwwroot}</code></dd>
                        </dl>
                    </div>

                    <footer className="nexusai-panel__footer">
                        <small>NexusAI v0.1.0-skeleton</small>
                    </footer>
                </div>
            )}
        </div>
    );
}
