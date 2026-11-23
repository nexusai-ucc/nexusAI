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

import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ApiKeyPanel from "./ApiKeyPanel.jsx";
import NavMenu from "./NavMenu.jsx";

function baseState(overrides = {}) {
    return {
        siteenabled: true,
        courseallowed: true,
        configured: false,
        active: false,
        provider: "",
        providerlabel: "",
        model: "",
        keyhint: "",
        timetested: 0,
        monthrequests: 0,
        monthtokens: 0,
        providers: [
            { id: "openai", label: "OpenAI" },
            { id: "anthropic", label: "Anthropic" },
        ],
        ...overrides,
    };
}

const saved = baseState({
    configured: true,
    active: true,
    provider: "anthropic",
    providerlabel: "Anthropic",
    model: "claude-sonnet-5-5",
    keyhint: "sk-ant…4f2a",
    timetested: 1795000000,
    monthrequests: 9,
    monthtokens: 41300,
});

function fakeApi(initial, overrides = {}) {
    return {
        getUserLlm: vi.fn().mockResolvedValue(initial),
        saveUserLlm: vi.fn(),
        testUserLlm: vi.fn(),
        deleteUserLlm: vi.fn(),
        ...overrides,
    };
}

describe("ApiKeyPanel (My API key)", () => {
    it("asks for the key and only enables saving after accepting the privacy notice", async () => {
        const api = fakeApi(baseState());
        render(<ApiKeyPanel courseId={3} api={api} />);

        const save = await screen.findByRole("button", { name: "Probar y guardar" });
        expect(save).toBeDisabled();
        expect(screen.getByText(/se envían a OpenAI con tu cuenta/)).toBeInTheDocument();

        await userEvent.click(screen.getByRole("checkbox", { name: /Entiendo y quiero usar mi key/ }));
        expect(save).toBeEnabled();
    });

    it("names the chosen provider in the privacy notice", async () => {
        render(<ApiKeyPanel courseId={3} api={fakeApi(baseState())} />);
        await userEvent.selectOptions(await screen.findByLabelText("Proveedor"), "anthropic");
        expect(screen.getByText(/se envían a Anthropic con tu cuenta/)).toBeInTheDocument();
    });

    it("does not send an invalid key and says why", async () => {
        const api = fakeApi(baseState());
        render(<ApiKeyPanel courseId={3} api={api} />);
        await userEvent.type(await screen.findByLabelText("Modelo"), "gpt-x");
        await userEvent.type(screen.getByLabelText("API key"), "corta");
        await userEvent.click(screen.getByRole("checkbox"));
        await userEvent.click(screen.getByRole("button", { name: "Probar y guardar" }));

        expect(api.saveUserLlm).not.toHaveBeenCalled();
        expect(screen.getByText(/La key tiene que tener entre/)).toBeInTheDocument();
    });

    it("tests and saves the key, then shows it masked with its use", async () => {
        const onChange = vi.fn();
        const api = fakeApi(baseState(), {
            saveUserLlm: vi.fn().mockResolvedValue({ ok: true, reason: "", message: "", state: saved }),
        });
        render(<ApiKeyPanel courseId={3} api={api} onChange={onChange} />);

        await userEvent.selectOptions(await screen.findByLabelText("Proveedor"), "anthropic");
        await userEvent.type(screen.getByLabelText("Modelo"), " claude-sonnet-5-5 ");
        await userEvent.type(screen.getByLabelText("API key"), "sk-ant-test-1234-4f2a");
        await userEvent.click(screen.getByRole("checkbox"));
        await userEvent.click(screen.getByRole("button", { name: "Probar y guardar" }));

        expect(api.saveUserLlm).toHaveBeenCalledWith({
            courseId: 3,
            provider: "anthropic",
            model: "claude-sonnet-5-5",
            apiKey: "sk-ant-test-1234-4f2a",
        });
        expect(await screen.findByText("Listo: Anthropic respondió y tu key quedó guardada.")).toBeInTheDocument();
        expect(screen.getByText("sk-ant…4f2a")).toBeInTheDocument();
        expect(screen.getByText(/9 respuestas/)).toBeInTheDocument();
        expect(screen.queryByDisplayValue("sk-ant-test-1234-4f2a")).not.toBeInTheDocument();
        expect(onChange).toHaveBeenLastCalledWith(saved);
    });

    it("keeps the form and shows the provider's reason when the key does not work", async () => {
        const api = fakeApi(baseState(), {
            saveUserLlm: vi.fn().mockResolvedValue({
                ok: false,
                reason: "rejected",
                message: "OpenAI rechazó tu API key.",
                state: baseState(),
            }),
        });
        render(<ApiKeyPanel courseId={3} api={api} />);
        await userEvent.type(await screen.findByLabelText("Modelo"), "gpt-x");
        await userEvent.type(screen.getByLabelText("API key"), "sk-invalid-0000");
        await userEvent.click(screen.getByRole("checkbox"));
        await userEvent.click(screen.getByRole("button", { name: "Probar y guardar" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("OpenAI rechazó tu API key.");
        expect(screen.getByLabelText("API key")).toBeInTheDocument();
    });

    it("tests the saved key again", async () => {
        const api = fakeApi(saved, {
            testUserLlm: vi.fn().mockResolvedValue({ ok: true, reason: "", message: "", state: saved }),
        });
        render(<ApiKeyPanel courseId={3} api={api} />);
        await userEvent.click(await screen.findByRole("button", { name: "Probar de nuevo" }));
        expect(api.testUserLlm).toHaveBeenCalledWith(3);
        expect(await screen.findByText("Anthropic respondió bien.")).toBeInTheDocument();
    });

    it("removes the key after confirming", async () => {
        const api = fakeApi(saved, { deleteUserLlm: vi.fn().mockResolvedValue(baseState()) });
        render(<ApiKeyPanel courseId={3} api={api} />);
        await userEvent.click(await screen.findByRole("button", { name: "Quitar" }));
        const dialog = await screen.findByRole("alertdialog");
        await userEvent.click(within(dialog).getByRole("button", { name: "Quitar" }));

        await waitFor(() => expect(api.deleteUserLlm).toHaveBeenCalledWith(3));
        expect(await screen.findByText("Tu key se quitó.")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Probar y guardar" })).toBeInTheDocument();
    });

    it("says the course does not use own keys and keeps the key for other courses", async () => {
        render(<ApiKeyPanel courseId={3} api={fakeApi({ ...saved, courseallowed: false, active: false })} />);
        expect(await screen.findByText("En este curso no se usan keys propias.")).toBeInTheDocument();
        expect(screen.getByText("Pausada en este curso")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Probar de nuevo" })).not.toBeInTheDocument();
    });
});

describe("ApiKeyPanel — a saved key the server cannot read", () => {
    it("asks to add it again instead of saying it is connected", async () => {
        render(<ApiKeyPanel courseId={3} api={fakeApi({ ...saved, active: false })} />);
        expect(await screen.findByText("Hay que cargarla de nuevo")).toBeInTheDocument();
        expect(screen.queryByText("Conectada")).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Probar de nuevo" })).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Cambiar key" })).toBeInTheDocument();
    });
});

describe("NavMenu — My API key item", () => {
    const props = { open: true, onClose: vi.fn(), activeTab: "chat", onSelect: vi.fn() };

    it("shows the item with the provider when a key is saved", () => {
        render(<NavMenu {...props} userLlm={saved} />);
        expect(screen.getByText("Mi API key")).toBeInTheDocument();
        expect(screen.getByText("Anthropic · conectada")).toBeInTheDocument();
    });

    it("says the key has to be added again when the server cannot read it", () => {
        render(<NavMenu {...props} userLlm={{ ...saved, active: false }} />);
        expect(screen.getByText("Anthropic · hay que cargarla de nuevo")).toBeInTheDocument();
    });

    it("hides the item when the site turned own keys off or the state is unknown", () => {
        const { rerender } = render(<NavMenu {...props} userLlm={baseState({ siteenabled: false })} />);
        expect(screen.queryByText("Mi API key")).not.toBeInTheDocument();
        rerender(<NavMenu {...props} userLlm={null} />);
        expect(screen.queryByText("Mi API key")).not.toBeInTheDocument();
    });

    it("goes to the screen", async () => {
        const onSelect = vi.fn();
        render(<NavMenu {...props} onSelect={onSelect} userLlm={baseState()} />);
        await userEvent.click(screen.getByText("Mi API key"));
        expect(onSelect).toHaveBeenCalledWith("apikey");
    });
});
