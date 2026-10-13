/**
 * Voice transcription client for the chat (VOICE-01, #314).
 *
 * `transcribeAudio` converts the Blob recorded with MediaRecorder to base64
 * (same approach as `documents/api.js::fileToBase64`, adapted to Blob) and
 * calls `local_nexusai_chat_voice_transcribe`. The result is NEVER sent
 * on its own as a chat message — the composer shows it to confirm/edit.
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
 * Converts an audio Blob to a base64 string (without the data URL prefix).
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
 * Transcribes a short audio recorded in the chat composer.
 *
 * @param {number} courseId
 * @param {Blob} blob Audio recorded with MediaRecorder.
 * @returns {Promise<string>} Transcribed text.
 */
export async function transcribeAudio(courseId, blob) {
    const contentB64 = await blobToBase64(blob);
    const mimeType = blob.type || "audio/webm";

    const ajax = await getMoodleAjax();
    if (!ajax) {
        // Mock outside Moodle: there is no way to really transcribe.
        await new Promise((r) => setTimeout(r, 800));
        return "Esto es una transcripción de prueba (modo mock, sin Moodle).";
    }

    const [response] = await ajax.call([{
        methodname: "local_nexusai_chat_voice_transcribe",
        args: { courseid: courseId, mimetype: mimeType, content_b64: contentB64 },
    }]);

    return response.text;
}
