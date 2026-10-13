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
 * "The assistant is typing" indicator.
 * Redesigned to use the same layout with avatar as MessageBubble.
 */

const IconAssistant = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z"/>
    </svg>
);

export default function TypingIndicator({ lang = "es" }) {
    const label = lang === "es" ? "El asistente está escribiendo" : "The assistant is typing";
    return (
        <div className="nexusai-msg nexusai-msg--assistant" aria-live="polite" aria-label={label}>
            <div className="nexusai-typing">
                <div className="nexusai-msg__avatar" aria-hidden="true">
                    <IconAssistant />
                </div>
                <div className="nexusai-typing__bubble">
                    <span className="nexusai-typing__dot"></span>
                    <span className="nexusai-typing__dot"></span>
                    <span className="nexusai-typing__dot"></span>
                </div>
            </div>
        </div>
    );
}
