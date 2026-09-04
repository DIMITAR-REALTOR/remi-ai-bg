import { useCallback, useRef, useState } from "react";

/**
 * REMI Voice Input v1 — push-to-talk hook.
 *
 * Flow: hold (start) → запис от микрофона → release (stop) → декодиране на
 * звука → транскрипция в Web Worker (Whisper WASM, client-side, на
 * български) → готов текст, върнат на извикващия компонент.
 *
 * Умишлено НЕ прави нищо друго: не пише в база, не вика ai.functions.ts,
 * не познава Context Engine/AI Kernel. Резултатът (plain text) се подава
 * към caller-а през onResult — той решава в кое поле да влезе текстът.
 */

export type VoiceInputState = "idle" | "recording" | "transcribing" | "error";

const CANDIDATE_MIME_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/mpeg"];

function pickSupportedMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) return undefined;
  return CANDIDATE_MIME_TYPES.find((t) => MediaRecorder.isTypeSupported(t));
}

//Worker singleton — създаден лениво само при първо реално ползване на
// гласовия вход, за да не тежи 20+ MB WASM/model свалянето на всяка
// страница. Споделен между всички VoiceInputButton инстанции на страницата.
let workerSingleton: Worker | null = null;
let nextRequestId = 1;

function getWorker(): Worker {
  if (!workerSingleton) {
    workerSingleton = new Worker(new URL("./whisper-worker.ts", import.meta.url), {
      type: "module",
    });
  }
  return workerSingleton;
}

async function decodeToMono16k(blob: Blob): Promise<Float32Array> {
  const arrayBuffer = await blob.arrayBuffer();
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
  const decodingCtx = new AudioCtx();
  let decoded: AudioBuffer;
  try {
    decoded = await decodingCtx.decodeAudioData(arrayBuffer.slice(0));
  } finally {
    decodingCtx.close();
  }

  const targetSampleRate = 16000;
  if (decoded.sampleRate === targetSampleRate && decoded.numberOfChannels === 1) {
    return decoded.getChannelData(0).slice();
  }

  const offline = new OfflineAudioContext(
    1,
    Math.ceil(decoded.duration * targetSampleRate),
    targetSampleRate,
  );
  const source = offline.createBufferSource();
  source.buffer = decoded;
  source.connect(offline.destination);
  source.start(0);
  const rendered = await offline.startRendering();
  return rendered.getChannelData(0).slice();
}

function transcribeOnWorker(audio: Float32Array): Promise<string> {
  const worker = getWorker();
  const requestId = nextRequestId++;
  return new Promise((resolve, reject) => {
    const onMessage = (e: MessageEvent) => {
      const data = e.data;
      if (!data || data.requestId !== requestId) return;
      if (data.type === "result") {
        worker.removeEventListener("message", onMessage);
        resolve(data.text as string);
      } else if (data.type === "error") {
        worker.removeEventListener("message", onMessage);
        reject(new Error(data.message ?? "Грешка при разпознаване на речта."));
      }
    };
    worker.addEventListener("message", onMessage);
    // Float32Array се прехвърля по reference (transferable ArrayBuffer) — без копиране.
    worker.postMessage({ type: "transcribe", audio, requestId }, [audio.buffer]);
  });
}

const MIN_RECORDING_MS = 300;

export function useVoiceInput() {
  const [state, setState] = useState<VoiceInputState>("idle");
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startedAtRef = useRef<number>(0);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    if (state === "recording" || state === "transcribing") return;
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickSupportedMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorderRef.current = recorder;
      startedAtRef.current = Date.now();
      recorder.start();
      setState("recording");
    } catch (err) {
      cleanupStream();
      setState("error");
      setError(
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Достъпът до микрофона е отказан. Разреши достъп в настройките на браузъра."
          : "Микрофонът не е достъпен.",
      );
    }
  }, [state, cleanupStream]);

  const stop = useCallback((): Promise<string | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || state !== "recording") {
        resolve(null);
        return;
      }
      const recordedMs = Date.now() - startedAtRef.current;

      recorder.onstop = async () => {
        cleanupStream();
        if (recordedMs < MIN_RECORDING_MS) {
          setState("idle");
          resolve(null);
          return;
        }
        setState("transcribing");
        try {
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
          const audio = await decodeToMono16k(blob);
          const text = await transcribeOnWorker(audio);
          setState("idle");
          resolve(text || null);
        } catch (err) {
          setState("error");
          setError(err instanceof Error ? err.message : "Неуспешна транскрипция.");
          resolve(null);
        }
      };
      recorder.stop();
    });
  }, [state, cleanupStream]);

  const reset = useCallback(() => {
    setState("idle");
    setError(null);
  }, []);

  return { state, error, start, stop, reset };
}
