/**
 * Cliente de transcripción de voz para el chat (VOICE-01, #314).
 *
 * `transcribeAudio` convierte el Blob grabado con MediaRecorder a base64
 * (mismo enfoque que `documents/api.js::fileToBase64`, adaptado a Blob) y
 * llama `local_nexusai_chat_voice_transcribe`. El resultado NUNCA se envía
 * solo como mensaje de chat — el composer lo muestra para confirmar/editar.
 */

async function getMoodleAjax() {
    if (typeof window === "undefined" || !window.M?.cfg) return null;
    try {
        const ajax = await new Promise((resolve, reject) => {
            // eslint-disable-next-line no-undef
            window.require(["core/ajax"], resolve, reject);
        });
        return ajax;
    } catch {
        return null;
    }
}

/**
 * Convierte un Blob de audio a string base64 (sin el prefijo data URL).
 *
 * @param {Blob} blob
 * @returns {Promise<string>}
 */
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            const commaIdx = result.indexOf(",");
            resolve(commaIdx >= 0 ? result.substring(commaIdx + 1) : result);
        };
        reader.onerror = () => reject(reader.error || new Error("FileReader failed"));
        reader.readAsDataURL(blob);
    });
}

/**
 * Transcribe un audio corto grabado en el composer del chat.
 *
 * @param {number} courseId
 * @param {Blob} blob Audio grabado con MediaRecorder.
 * @returns {Promise<string>} Texto transcripto.
 */
export async function transcribeAudio(courseId, blob) {
    const contentB64 = await blobToBase64(blob);
    const mimeType = blob.type || "audio/webm";

    const ajax = await getMoodleAjax();
    if (!ajax) {
        // Mock fuera de Moodle: no hay forma de transcribir de verdad.
        await new Promise((r) => setTimeout(r, 800));
        return "Esto es una transcripción de prueba (modo mock, sin Moodle).";
    }

    const [response] = await ajax.call([{
        methodname: "local_nexusai_chat_voice_transcribe",
        args: { courseid: courseId, mimetype: mimeType, content_b64: contentB64 },
    }]);

    return response.text;
}
