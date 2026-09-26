import { useState } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DocumentsTable from "./DocumentsTable.jsx";

vi.mock("./api.js", () => ({
    deleteDocument: vi.fn(),
    reindexDocument: vi.fn(),
    replaceDocument: vi.fn(),
    getDocumentPreview: vi.fn(),
}));

import { deleteDocument, reindexDocument } from "./api.js";

const DOCS = [
    { id: "doc-1", filename: "apunte1.pdf", status: "indexed", updated_at: "2026-09-01T10:00:00Z" },
    { id: "doc-2", filename: "apunte2.pdf", status: "indexed", updated_at: "2026-09-01T10:00:00Z" },
    { id: "doc-3", filename: "apunte3.pdf", status: "error", error_message: "falló", updated_at: "2026-09-01T10:00:00Z" },
];

// onChange real (no mock) para poder ver el efecto de las acciones en lote
// reflejado en la tabla, igual que lo usa DocumentsManager de verdad.
function Wrapper({ initialDocs = DOCS }) {
    const [documents, setDocuments] = useState(initialDocs);
    return <DocumentsTable courseId={7} documents={documents} onChange={setDocuments} />;
}

function bulkToolbar() {
    return screen.getByText(/seleccionado/).closest(".nexusai-bulkbar");
}

function confirmDialog() {
    return screen.getByRole("alertdialog");
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("DocumentsTable — selección múltiple", () => {
    it("shows the bulk toolbar only when at least one row is selected", async () => {
        const user = userEvent.setup();
        render(<Wrapper />);

        expect(screen.queryByText(/seleccionado/)).not.toBeInTheDocument();

        await user.click(screen.getByLabelText("Seleccionar apunte1.pdf"));

        expect(screen.getByText("1 seleccionado")).toBeInTheDocument();
    });

    it("select-all selects every row and toggling it again clears the selection", async () => {
        const user = userEvent.setup();
        render(<Wrapper />);

        await user.click(screen.getByLabelText("Seleccionar todos los documentos"));
        expect(screen.getByText("3 seleccionados")).toBeInTheDocument();

        await user.click(screen.getByLabelText("Seleccionar todos los documentos"));
        expect(screen.queryByText(/seleccionado/)).not.toBeInTheDocument();
    });
});

describe("DocumentsTable — eliminar en lote", () => {
    it("deletes only the selected documents sequentially, after confirmation, and removes them from the table", async () => {
        deleteDocument.mockResolvedValue({ success: true });
        const user = userEvent.setup();
        render(<Wrapper />);

        await user.click(screen.getByLabelText("Seleccionar apunte1.pdf"));
        await user.click(screen.getByLabelText("Seleccionar apunte2.pdf"));
        await user.click(within(bulkToolbar()).getByRole("button", { name: "Eliminar" }));

        // Confirmación previa — no se llama nada todavía.
        expect(screen.getByText(/¿Borrar/)).toBeInTheDocument();
        expect(deleteDocument).not.toHaveBeenCalled();

        await user.click(within(confirmDialog()).getByRole("button", { name: "Eliminar" }));

        await waitFor(() => expect(deleteDocument).toHaveBeenCalledTimes(2));
        expect(deleteDocument).toHaveBeenCalledWith(7, "doc-1");
        expect(deleteDocument).toHaveBeenCalledWith(7, "doc-2");
        expect(reindexDocument).not.toHaveBeenCalled();

        await waitFor(() => expect(screen.queryByText("apunte1.pdf")).not.toBeInTheDocument());
        expect(screen.queryByText("apunte2.pdf")).not.toBeInTheDocument();
        expect(screen.getByText("apunte3.pdf")).toBeInTheDocument(); // no seleccionado, sigue
    });

    it("keeps a failed item in the table while the rest still get deleted", async () => {
        deleteDocument.mockImplementation((courseId, id) =>
            id === "doc-2" ? Promise.reject(new Error("network down")) : Promise.resolve({ success: true })
        );
        const user = userEvent.setup();
        render(<Wrapper />);

        await user.click(screen.getByLabelText("Seleccionar todos los documentos"));
        await user.click(within(bulkToolbar()).getByRole("button", { name: "Eliminar" }));
        await user.click(within(confirmDialog()).getByRole("button", { name: "Eliminar" }));

        await waitFor(() => expect(deleteDocument).toHaveBeenCalledTimes(3));

        // doc-1 y doc-3 se borraron de la TABLA; doc-2 falló y sigue ahí. Se
        // consulta por el checkbox de fila (único de la tabla) y no por el
        // filename a secas, porque la cola de progreso queda visible con el
        // detalle de los 3 ítems (incluidos los que sí se borraron) cuando
        // hubo al menos un fallo en el lote.
        await waitFor(() =>
            expect(screen.queryByLabelText("Seleccionar apunte1.pdf")).not.toBeInTheDocument()
        );
        expect(screen.getByLabelText("Seleccionar apunte2.pdf")).toBeInTheDocument();
        expect(screen.queryByLabelText("Seleccionar apunte3.pdf")).not.toBeInTheDocument();

        // La cola de progreso queda visible con el detalle del lote completo
        // (getFriendlyErrorMessage cae al fallback genérico para un Error
        // sin código HTTP reconocible, como el que tira el mock acá).
        expect(screen.getByText("No se pudo eliminar.")).toBeInTheDocument();
    });
});

describe("DocumentsTable — reindexar en lote", () => {
    it("reindexes only the selected documents and reflects the returned status in the table", async () => {
        reindexDocument.mockImplementation((courseId, id) =>
            Promise.resolve({ id, status: "pending", error_message: null })
        );
        const user = userEvent.setup();
        render(<Wrapper />);

        await user.click(screen.getByLabelText("Seleccionar apunte3.pdf")); // el que tenía error
        await user.click(within(bulkToolbar()).getByRole("button", { name: "Reindexar" }));
        expect(screen.getByText(/¿Reindexar/)).toBeInTheDocument();

        await user.click(within(confirmDialog()).getByRole("button", { name: "Reindexar" }));

        await waitFor(() => expect(reindexDocument).toHaveBeenCalledWith(7, "doc-3"));
        expect(deleteDocument).not.toHaveBeenCalled();

        // El documento sigue en la tabla (reindexar no lo saca), ahora "pending".
        expect(await screen.findByText("apunte3.pdf")).toBeInTheDocument();
        expect(screen.getByText("En cola")).toBeInTheDocument();
    });
});

describe("DocumentsTable — dónde vive cada documento en el aula (VIS-03)", () => {
    const withActivity = [
        {
            id: "doc-a", filename: "visible.pdf", status: "indexed", updated_at: "2026-09-01T10:00:00Z",
            cmid: 41, section: 1, section_name: "Unidad 1", activity_status: "visible",
            activity_url: "https://aula.test/mod/resource/view.php?id=41",
        },
        {
            id: "doc-b", filename: "oculto.pdf", status: "indexed", updated_at: "2026-09-01T10:00:00Z",
            cmid: 42, section: 2, section_name: "Unidad 2", activity_status: "hidden",
            activity_url: "https://aula.test/mod/resource/view.php?id=42",
        },
        {
            id: "doc-c", filename: "borrado.pdf", status: "indexed", updated_at: "2026-09-01T10:00:00Z",
            cmid: 43, section: 1, section_name: "Unidad 1", activity_status: "missing",
        },
        { id: "doc-d", filename: "viejo.pdf", status: "indexed", updated_at: "2026-09-01T10:00:00Z" },
    ];

    it("shows the unit, whether the activity is visible and a link to it", () => {
        render(<Wrapper initialDocs={withActivity} />);

        const rowVisible = screen.getByText("visible.pdf").closest("tr");
        expect(within(rowVisible).getByText("Unidad 1")).toBeInTheDocument();
        expect(within(rowVisible).getByText("Visible")).toBeInTheDocument();
        expect(within(rowVisible).getByRole("link", { name: "Ver en el aula" }))
            .toHaveAttribute("href", "https://aula.test/mod/resource/view.php?id=41");

        const rowHidden = screen.getByText("oculto.pdf").closest("tr");
        expect(within(rowHidden).getByText("Oculta a alumnos")).toBeInTheDocument();
    });

    it("flags a deleted activity and a document that has none, without a link", () => {
        render(<Wrapper initialDocs={withActivity} />);

        const rowGone = screen.getByText("borrado.pdf").closest("tr");
        expect(within(rowGone).getByText("Actividad borrada")).toBeInTheDocument();
        expect(within(rowGone).queryByRole("link")).not.toBeInTheDocument();

        const rowNone = screen.getByText("viejo.pdf").closest("tr");
        expect(within(rowNone).getByText("Sin actividad")).toBeInTheDocument();
    });

    it("a document just uploaded (cmid and visible, no status yet) shows as visible or hidden", () => {
        render(<Wrapper initialDocs={[
            { id: "n1", filename: "nuevo.pdf", status: "pending", cmid: 50, section: 3, visible: false },
        ]} />);

        const row = screen.getByText("nuevo.pdf").closest("tr");
        expect(within(row).getByText("Oculta a alumnos")).toBeInTheDocument();
        expect(within(row).getByText("Unidad 3")).toBeInTheDocument();
    });
});
