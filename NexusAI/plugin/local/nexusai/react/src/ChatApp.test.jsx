import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatApp from "./ChatApp.jsx";

// ChatApp orquesta el flujo central del producto (ASIST-*): enviar una
// pregunta, mostrar la respuesta streameada con sus fuentes citadas, el
// estado "no encontré esto en el material" (grounded === false), y la
// recuperación ante un error del backend con "Reintentar". Se mockea la capa
// de transporte (api/chat.js, api/history.js) — el streaming SSE real y el
// proxy PHP están fuera del alcance de un test de componente React.
vi.mock("./api/chat.js", () => ({
    sendMessage: vi.fn(),
    sendMessageStream: vi.fn(),
    submitMessageFeedback: vi.fn().mockResolvedValue({ ok: true }),
}));
vi.mock("./api/history.js", () => ({
    getSessionMessages: vi.fn(),
}));

import { sendMessageStream } from "./api/chat.js";

const BASE_PROPS = { courseid: 5, userid: 1, sesskey: "sk", wwwroot: "http://moodle.local", lang: "es" };

function openChat() {
    render(<ChatApp {...BASE_PROPS} />);
    return userEvent.setup();
}

async function askQuestion(user, text) {
    await user.click(screen.getByLabelText("Abrir chat"));
    await user.type(screen.getByLabelText("Tu pregunta"), text);
    await user.click(screen.getByLabelText("Enviar mensaje"));
}

// Simula la secuencia de callbacks que sendMessageStream() dispara en un
// intercambio real (meta con fuentes → tokens → answer_meta → done).
function streamImpl({ sources = [], hasRelevantContext = true, grounded = true, answer = "La respuesta." } = {}) {
    return async (_params, { onMeta, onToken, onAnswerMeta, onDone }) => {
        onMeta?.({ session_id: "sess-1", sources, has_relevant_context: hasRelevantContext });
        for (const word of answer.split(" ")) {
            onToken?.(word + " ");
        }
        onAnswerMeta?.({ grounded });
        onDone?.({ assistant_message_id: "real-msg-1" });
    };
}

beforeEach(() => {
    vi.clearAllMocks();
    // jsdom no implementa scrollIntoView; ChatApp lo llama en cada mensaje
    // nuevo para el auto-scroll (ver ChatApp.jsx, efecto sobre messagesEndRef).
    Element.prototype.scrollIntoView = vi.fn();
});

describe("ChatApp — envío de pregunta y respuesta (flujo central)", () => {
    it("envía la pregunta, la muestra optimísticamente y renderiza la respuesta del asistente", async () => {
        sendMessageStream.mockImplementation(streamImpl({ answer: "Esta es la respuesta del asistente." }));
        const user = openChat();

        await askQuestion(user, "¿Qué es una derivada?");

        expect(await screen.findByText("¿Qué es una derivada?")).toBeInTheDocument();
        await waitFor(() =>
            expect(screen.getByText(/Esta es la respuesta del asistente\./)).toBeInTheDocument()
        );
        expect(sendMessageStream).toHaveBeenCalledWith(
            expect.objectContaining({ question: "¿Qué es una derivada?", courseId: 5 }),
            expect.any(Object)
        );
    });

    it("renderiza las fuentes citadas como pills clickeables cuando hay contexto relevante", async () => {
        sendMessageStream.mockImplementation(
            streamImpl({
                sources: [
                    { document_filename: "apunte1.pdf", document_id: "doc-1", chunk_index: 0, similarity: 0.9 },
                ],
                hasRelevantContext: true,
                grounded: true,
            })
        );
        const user = openChat();
        await askQuestion(user, "¿Qué dice el apunte?");

        const pill = await screen.findByRole("button", { name: /apunte1\.pdf/ });
        expect(pill).not.toBeDisabled();
    });

    it('muestra el estado "no encontré esto en el material" ocultando fuentes cuando el backend marca grounded=false', async () => {
        sendMessageStream.mockImplementation(
            streamImpl({
                sources: [{ document_filename: "apunte1.pdf", chunk_index: 0 }],
                hasRelevantContext: true,
                grounded: false,
                answer: "No encontré información sobre eso en el material del curso.",
            })
        );
        const user = openChat();
        await askQuestion(user, "¿Cuál es la capital de la Luna?");

        await waitFor(() =>
            expect(screen.getByText(/No encontré información sobre eso/)).toBeInTheDocument()
        );
        expect(screen.queryByRole("button", { name: /apunte1\.pdf/ })).not.toBeInTheDocument();
    });

    it("al fallar el envío, saca el mensaje optimista y ofrece Reintentar", async () => {
        sendMessageStream.mockRejectedValue(new Error("HTTP 503: backend down"));
        const user = openChat();

        await askQuestion(user, "¿Qué entra en el parcial?");

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "El asistente no está disponible en este momento. Probá de nuevo en unos minutos."
        );
        expect(screen.queryByText("¿Qué entra en el parcial?")).not.toBeInTheDocument();

        sendMessageStream.mockImplementation(streamImpl({ answer: "Ahora sí funciona." }));
        await user.click(screen.getByRole("button", { name: "Reintentar" }));

        await waitFor(() => expect(screen.getByText(/Ahora sí funciona\./)).toBeInTheDocument());
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("muestra el mensaje de rate limit (429) cuando el backend lo devuelve", async () => {
        sendMessageStream.mockRejectedValue(new Error('HTTP 429: {"detail":"quota exceeded"}'));
        const user = openChat();

        await askQuestion(user, "pregunta cualquiera");

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Se alcanzó el límite de uso por ahora. Probá de nuevo en unos minutos."
        );
    });
});
