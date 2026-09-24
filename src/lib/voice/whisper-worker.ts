/**
 * REMI Voice Input v1 — Whisper transcription Worker.
 *
 * Изолиран input модул: приема суров mono 16kHz PCM audio (Float32Array) и
 * връща разпознат текст на български. НЕ извиква ai.functions.ts, НЕ пише
 * в базата, НЕ познава REMI Core Engine — единствената му отговорност е
 * "звук → текст". Извикващият компонент решава какво да прави с текста
 * (в момента: вкарва го в конкретно текстово поле на формата).
 *
 * Изпълнява се изцяло в браузъра на брокера (Web Worker, WASM backend на
 * onnxruntime-web през @huggingface/transformers). Моделът НЕ е част от
 * repo-то — тегли се при първо ползване от Hugging Face Hub (публичен CDN)
 * и се кешира от браузъра (Cache API) за следващите пъти. Без сървър, без
 * платена услуга, без TTS/гласов отговор.
 */
import { pipeline, type AutomaticSpeechRecognitionPipeline } from "@huggingface/transformers";

// Единствената точка, която трябва да се промени, ако избраният модел
// покаже недостатъчна точност на български (напр. -> "onnx-community/whisper-small").
const MODEL_ID = "onnx-community/whisper-base";

type IncomingMessage = { type: "transcribe"; audio: Float32Array; requestId: number };
type OutgoingMessage =
  | { type: "ready" }
  | { type: "progress"; requestId: number; progress: number }
  | { type: "result"; requestId: number; text: string }
  | { type: "error"; requestId: number | null; message: string };

let transcriberPromise: Promise<AutomaticSpeechRecognitionPipeline> | null = null;

function getTranscriber(): Promise<AutomaticSpeechRecognitionPipeline> {
  if (!transcriberPromise) {
    transcriberPromise = pipeline("automatic-speech-recognition", MODEL_ID, {
      device: "wasm",
      dtype: "q8",
    }) as Promise<AutomaticSpeechRecognitionPipeline>;
  }
  return transcriberPromise;
}

self.onmessage = async (event: MessageEvent<IncomingMessage>) => {
  const { type } = event.data;
  if (type !== "transcribe") return;
  const { audio, requestId } = event.data;

  try {
    const transcriber = await getTranscriber();
    const output: unknown = await transcriber(audio, {
      language: "bulgarian",
      task: "transcribe",
      chunk_length_s: 30,
    });
    const text = extractText(output);
    const msg: OutgoingMessage = { type: "result", requestId, text: text.trim() };
    (self as unknown as Worker).postMessage(msg);
  } catch (err) {
    const msg: OutgoingMessage = {
      type: "error",
      requestId,
      message: err instanceof Error ? err.message : "Неуспешно разпознаване на речта.",
    };
    (self as unknown as Worker).postMessage(msg);
  }
};

function extractText(output: unknown): string {
  const chunks = Array.isArray(output) ? output : [output];
  return chunks
    .map((c) =>
      c && typeof c === "object" && "text" in c ? String((c as { text: unknown }).text) : "",
    )
    .join(" ");
}
