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

import { describe, it, expect, vi, afterEach } from "vitest";
import { act } from "react";

// The entry point only mounts one of the two apps: stand-ins record the props.
vi.mock("./ChatApp.jsx", () => ({
    default: (props) => <div data-testid="chat" data-lang={props.lang} data-teacher={props.isteacher} />,
}));
vi.mock("./OnboardingApp.jsx", () => ({
    default: (props) => <div data-testid="onboarding" data-lang={props.lang} data-mode={props.mode} />,
}));

import { init } from "./index.jsx";

function mount(params) {
    const container = document.createElement("div");
    container.id = "local-nexusai-container";
    document.body.appendChild(container);
    act(() => init(params));
    return container;
}

afterEach(() => {
    document.body.innerHTML = "";
});

describe("init (chat widget entry point)", () => {
    it("falls back to English when Moodle sends no language", () => {
        const container = mount({ courseid: 3 });

        const chat = container.querySelector("[data-testid='chat']");
        expect(chat.dataset.lang).toBe("en");
        expect(chat.dataset.teacher).toBe("0");
    });

    it("keeps the language Moodle sends", () => {
        const container = mount({ courseid: 3, lang: "es", isteacher: 1 });

        const chat = container.querySelector("[data-testid='chat']");
        expect(chat.dataset.lang).toBe("es");
        expect(chat.dataset.teacher).toBe("1");
    });

    it("mounts the onboarding guide when the plugin asks for it, also in English by default", () => {
        const container = mount({ courseid: 3, onboarding: "create-course" });

        const onboarding = container.querySelector("[data-testid='onboarding']");
        expect(onboarding.dataset.mode).toBe("create");
        expect(onboarding.dataset.lang).toBe("en");
        expect(container.querySelector("[data-testid='chat']")).toBeNull();
    });

    it("does nothing on a page without the widget container", () => {
        expect(() => init({ lang: "es" })).not.toThrow();
        expect(document.body.innerHTML).toBe("");
    });
});
