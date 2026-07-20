import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Megaphone, ArrowLeft, Sparkles, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { generateMarketingCopy } from "@/lib/ai.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ads")({
  head: () => ({
    meta: [
      { title: "REMI Маркетинг асистент" },
      { name: "description", content: "Генериране на атрактивни обяви и маркетингови текстове." },
    ],
  }),
  component: AdsPage,
});

type Channel = "site" | "facebook" | "instagram" | "flyer";

const CHANNELS: { id: Channel; label: string }[] = [
  { id: "site", label: "Сайт" },
  { id: "facebook", label: "Facebook" },
  { id: "instagram", label: "Instagram" },
  { id: "flyer", label: "Флаер" },
];

function AdsPage() {
  const [channel, setChannel] = useState<Channel>("site");
  const [type, setType] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  const generate = useServerFn(generateMarketingCopy);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type.trim() || !location.trim()) {
      toast.error("Попълни тип имот и локация");
      return;
    }
    setBusy(true);
    try {
      const { body } = await generate({
        data: { property_type: type.trim(), location: location.trim(), notes: notes.trim(), channel },
      });
      setOutput(body);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Грешка при генериране");
    } finally {
      setBusy(false);
    }
  };

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(output);
      toast.success("Копирано");
    } catch {
      toast.error("Неуспешно копиране");
    }
  };

  return (
    <div className="mx-auto max-w-xl px-5 pt-6 pb-8">
      <Link to="/tools" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Инструменти
      </Link>

      <header className="mt-3 flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Megaphone className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">REMI Маркетинг асистент</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            AI-генерирани обяви и маркетингови текстове по канал.
          </p>
        </div>
      </header>

      <div className="mt-6">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Канал</Label>
        <div className="mt-2 grid grid-cols-4 gap-1 rounded-2xl border border-border bg-card p-1">
          {CHANNELS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setChannel(c.id)}
              className={cn(
                "rounded-xl px-2 py-2 text-xs font-semibold transition",
                channel === c.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-4 space-y-4 rounded-2xl border border-border bg-card p-4">
        <div>
          <Label htmlFor="t">Тип имот</Label>
          <Input id="t" value={type} onChange={(e) => setType(e.target.value)} placeholder="напр. 2-стаен апартамент" />
        </div>
        <div>
          <Label htmlFor="l">Локация</Label>
          <Input id="l" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="напр. Варна, Чайка" />
        </div>
        <div>
          <Label htmlFor="f">Бележки (по желание)</Label>
          <Textarea id="f" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="напр. панорамна гледка, ново обзавеждане, гараж..." />
        </div>
        <Button type="submit" disabled={busy} className="w-full gap-2">
          {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Генерирам...</> : <><Sparkles className="h-4 w-4" /> Генерирай текст</>}
        </Button>
      </form>

      {output && (
        <section className="mt-6 rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Готов текст</p>
          <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-foreground">{output}</pre>
          <Button variant="outline" className="mt-3 w-full gap-2" onClick={copyText}>
            <Copy className="h-4 w-4" /> Копирай
          </Button>
        </section>
      )}
    </div>
  );
}
