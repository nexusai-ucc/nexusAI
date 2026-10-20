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

import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ConfirmModal from "./ConfirmModal.jsx";

function renderModal(props = {}) {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(
        <ConfirmModal title="¿Borrar?" onCancel={onCancel} onConfirm={onConfirm} {...props}>
            Se borra el documento.
        </ConfirmModal>,
    );
    return { onCancel, onConfirm };
}

describe("ConfirmModal", () => {
    it("un click en el fondo cancela", () => {
        // Arrange.
        const { onCancel } = renderModal();

        // Act.
        fireEvent.click(screen.getByRole("alertdialog").parentElement);

        // Assert.
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("un click dentro del diálogo no lo cierra", () => {
        // Arrange.
        const { onCancel } = renderModal();

        // Act.
        fireEvent.click(screen.getByRole("alertdialog"));

        // Assert.
        expect(onCancel).not.toHaveBeenCalled();
    });

    it("Escape cancela", () => {
        // Arrange.
        const { onCancel } = renderModal();

        // Act: el foco arranca en Cancelar, dentro del diálogo.
        fireEvent.keyDown(document.activeElement, { key: "Escape" });

        // Assert.
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("mientras confirma, ni Escape ni el fondo la cierran", () => {
        // Arrange.
        const { onCancel } = renderModal({ busy: true });

        // Act.
        fireEvent.keyDown(screen.getByRole("alertdialog"), { key: "Escape" });
        fireEvent.click(screen.getByRole("alertdialog").parentElement);

        // Assert.
        expect(onCancel).not.toHaveBeenCalled();
    });
});
