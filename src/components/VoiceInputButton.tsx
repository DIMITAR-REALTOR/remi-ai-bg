import { useCallback, useRef } from "react";
import { Mic, Loader2 } from "lucide-react";
import { useVoiceInput } from "@/lib/voice/useVoiceInput";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * REMI Voice Input v1 — бутон за диктовка (press/hold → запис → release →
 * транскрипция → текстът се подава на caller-а през onTranscript).
 *
 * Изолиран UI компонент: не знае нищо за формата, в която живее — само
 * връща разпознат текст. Extra текстът се append-ва към полето, не го
 * замества, за да не изтрие случайно вече написано от брокера.
 */
export function VoiceInputButton({
  onTranscript,
  label = "Диктувай",
  className,
}: {
  onTranscript: (text: string) => void;
  label?: string;
  className?: string;
}) {
  const { state, error, start, stop } = useVoiceInput();
  const activeRef = useRef(false);

  const handleStart = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      activeRef.current = true;
      start();
    },
    [start],
  );

  const handleEnd = useCallback(
    async (e: React.PointerEvent) => {
      if (!activeRef.current) return;
      activeRef.current = false;
      e.preventDefault();
      const text = await stop();
      if (text) onTranscript(text);
    },
    [stop, onTranscript],
  );

  if (error && state === "error") {
    // Показваме грешката веднъж като toast, после се връщаме в idle при следващ опит.
    toast.error(error);
  }

  const recording = state === "recording";
  const transcribing = state === "transcribing";

  return (
    <button
      type="button"
      onPointerDown={handleStart}
      onPointerUp={handleEnd}
      onPointerLeave={handleEnd}
      onPointerCancel={handleEnd}
      onContextMenu={(e) => e.preventDefault()}
      disabled={transcribing}
      style={{ touchAction: "none" }}
      className={cn(
        "inline-flex h-7 select-none items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors",
        recording
          ? "bg-destructive/10 text-destructive"
          : "text-primary hover:text-primary hover:bg-primary/10",
        transcribing && "opacity-70",
        className,
      )}
      aria-pressed={recording}
      title="Задръж, за да говориш; пусни, за да спреш"
    >
      {transcribing ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Mic className={cn("h-3.5 w-3.5", recording && "animate-pulse")} />
      )}
      {transcribing ? "Разпознаване..." : recording ? "Слушам..." : label}
    </button>
  );
}
