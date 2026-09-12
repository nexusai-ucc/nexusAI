import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sendMessageStream } from "./chat.js";

// A diferencia de ChatApp.test.jsx (que mockea toda la capa de transporte,
// a propósito, porque testear un componente React no debería depender de
// SSE real), estos tests ejercitan el parser SSE de verdad: construyen un
// `Response` con un `ReadableStream` real y verifican qué hace
// `sendMessageStream` frente a los eventos tal como llegan por la red —
// incluidos los casos de falla (evento de error a mitad de stream, conexión
// cortada sin ningún evento final) que antes no tenía ningún test cubriendo.

function sseChunks(strings) {
    const encoder = new TextEncoder();
    return strings.map((s) => encoder.encode(s));
}

function fakeStreamResponse(chunks, { ok = true, status = 200 } = {}) {
    return {
        ok,
        status,
        body: {
            getReader() {
                let i = 0;
                return {
                    async read() {
                        if (i < chunks.length) return { value: chunks[i++], done: false };
                        return { value: undefined, done: true };
                    },
                };
            },
        },
        text: async () => "",
    };
}

beforeEach(() => {
    window.M = { cfg: { wwwroot: "http://moodle.local", sesskey: "sk" } };
    global.fetch = vi.fn();
});

afterEach(() => {
    delete window.M;
    vi.restoreAllMocks();
});

describe("sendMessageStream — parser SSE real", () => {
    it("procesa meta → tokens → done en un stream normal", async () => {
        global.fetch.mockResolvedValue(
            fakeStreamResponse(
                sseChunks([
                    'data: {"type":"meta","session_id":"s1"}\n\n',
                    'data: {"type":"token","content":"Hola "}\n\n',
                    'data: {"type":"token","content":"mundo"}\n\n',
                    'data: {"type":"done","assistant_message_id":"m1"}\n\n',
                ])
            )
        );

        const onMeta = vi.fn();
        const onToken = vi.fn();
        const onDone = vi.fn();
        const onError = vi.fn();

        await sendMessageStream(
            { question: "hola", courseId: 1 },
            { onMeta, onToken, onDone, onError }
        );

        expect(onMeta).toHaveBeenCalledWith(expect.objectContaining({ session_id: "s1" }));
        expect(onToken).toHaveBeenNthCalledWith(1, "Hola ");
        expect(onToken).toHaveBeenNthCalledWith(2, "mundo");
        expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ assistant_message_id: "m1" }));
        expect(onError).not.toHaveBeenCalled();
    });

    it("dispara onError cuando llega un evento error a mitad de stream", async () => {
        global.fetch.mockResolvedValue(
            fakeStreamResponse(
                sseChunks([
                    'data: {"type":"token","content":"Esto es lo que alcanzó a llegar "}\n\n',
                    'data: {"type":"error","detail":"El proveedor LLM no respondió a tiempo"}\n\n',
                ])
            )
        );

        const onToken = vi.fn();
        const onError = vi.fn();
        const onDone = vi.fn();

        await sendMessageStream(
            { question: "hola", courseId: 1 },
            { onToken, onError, onDone }
        );

        expect(onToken).toHaveBeenCalledWith("Esto es lo que alcanzó a llegar ");
        expect(onError).toHaveBeenCalledWith("El proveedor LLM no respondió a tiempo");
        expect(onDone).not.toHaveBeenCalled();
    });

    it("procesa el último evento aunque llegue sin el delimitador '\\n\\n' de cierre (conexión cortada a mitad de evento)", async () => {
        global.fetch.mockResolvedValue(
            fakeStreamResponse(
                sseChunks([
                    // Sin "\n\n" final — el proxy cortó la conexión antes de
                    // mandar el delimitador de cierre del último evento.
                    'data: {"type":"error","detail":"timeout del proxy"}',
                ])
            )
        );

        const onError = vi.fn();

        await sendMessageStream({ question: "hola", courseId: 1 }, { onError });

        expect(onError).toHaveBeenCalledWith("timeout del proxy");
        // Un solo disparo: ni el "mejor esfuerzo" sobre el buffer trunco ni
        // el chequeo de "nunca llegó un evento terminal" deberían duplicarlo.
        expect(onError).toHaveBeenCalledTimes(1);
    });

    it("dispara onError si la conexión se cierra sin ningún evento done/error (antes: la UI quedaba colgada sin aviso)", async () => {
        global.fetch.mockResolvedValue(
            fakeStreamResponse(
                sseChunks([
                    'data: {"type":"token","content":"Empezando a responder..."}\n\n',
                    // Se corta acá — sin "done" ni "error". El reader.read()
                    // siguiente devuelve done:true (conexión cerrada).
                ])
            )
        );

        const onToken = vi.fn();
        const onError = vi.fn();
        const onDone = vi.fn();

        await sendMessageStream({ question: "hola", courseId: 1 }, { onToken, onError, onDone });

        expect(onToken).toHaveBeenCalledWith("Empezando a responder...");
        expect(onDone).not.toHaveBeenCalled();
        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError).toHaveBeenCalledWith(expect.stringMatching(/conexión/i));
    });

    it("ignora silenciosamente una línea SSE con JSON malformado sin cortar el resto del stream", async () => {
        global.fetch.mockResolvedValue(
            fakeStreamResponse(
                sseChunks([
                    "data: {esto no es json valido\n\n",
                    'data: {"type":"token","content":"igual sigue"}\n\n',
                    'data: {"type":"done"}\n\n',
                ])
            )
        );

        const onToken = vi.fn();
        const onDone = vi.fn();
        const onError = vi.fn();

        await sendMessageStream({ question: "hola", courseId: 1 }, { onToken, onDone, onError });

        expect(onToken).toHaveBeenCalledWith("igual sigue");
        expect(onDone).toHaveBeenCalled();
        expect(onError).not.toHaveBeenCalled();
    });

    it("tira un Error con el status y el body cuando la respuesta HTTP inicial no es ok (p. ej. 429)", async () => {
        global.fetch.mockResolvedValue({
            ok: false,
            status: 429,
            body: null,
            text: async () => '{"detail":"quota exceeded"}',
        });

        await expect(
            sendMessageStream({ question: "hola", courseId: 1 }, {})
        ).rejects.toThrow(/HTTP 429/);
    });
});
