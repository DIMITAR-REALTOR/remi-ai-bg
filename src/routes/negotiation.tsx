import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SITUATIONS } from "@/lib/negotiation-data";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, ArrowLeft, Lightbulb } from "lucide-react";

export const Route = createFileRoute("/negotiation")({
  head: () => ({
    meta: [
      { title: "Преговори — AI Estate Pro" },
      { name: "description", content: "Готови аргументи и тактики за преговори по сделки с имоти." },
    ],
  }),
  component: NegotiationPage,
});

function NegotiationPage() {
  const [sid, setSid] = useState<string>(SITUATIONS[0].id);
  const situation = SITUATIONS.find((s) => s.id === sid) ?? SITUATIONS[0];

  return (
    <div className="mx-auto max-w-xl px-5 pt-6 pb-8">
      <Link to="/tools" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Инструменти
      </Link>

      <header className="mt-3 flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <MessageSquare className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Преговори</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Избери ситуация и получи готови аргументи за преговори.
          </p>
        </div>
      </header>

      <div className="mt-6 rounded-2xl border border-border bg-card p-4">
        <Label>Ситуация</Label>
        <Select value={sid} onValueChange={setSid}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {SITUATIONS.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-5 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Препоръчани тактики
        </p>
        {situation.tips.map((t, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Lightbulb className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{t.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t.advice}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
