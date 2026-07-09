import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CHECKLIST_SECTIONS } from "@/lib/checklist-data";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowLeft, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checklist")({
  head: () => ({
    meta: [
      { title: "REMI Интелигентен чеклист" },
      { name: "description", content: "Автоматично генериран чеклист по сделка." },
    ],
  }),
  component: ChecklistPage,
});

const STORAGE_KEY = "aep_checklist_v1";

function ChecklistPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setChecked(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
    } catch {}
  }, [checked, hydrated]);

  const { total, done } = useMemo(() => {
    const t = CHECKLIST_SECTIONS.reduce((acc, s) => acc + s.items.length, 0);
    const d = Object.values(checked).filter(Boolean).length;
    return { total: t, done: d };
  }, [checked]);

  const pct = total ? Math.round((done / total) * 100) : 0;

  const toggle = (id: string) => setChecked((p) => ({ ...p, [id]: !p[id] }));
  const reset = () => setChecked({});

  return (
    <div className="mx-auto max-w-xl px-5 pt-6 pb-8">
      <Link to="/tools" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Инструменти
      </Link>

      <header className="mt-3 flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">REMI Интелигентен чеклист</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Автоматично генериран чеклист по сделка. Прогресът се запазва локално.
          </p>
        </div>
      </header>

      <div className="mt-5 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-foreground">
            {done} от {total} изпълнени
          </span>
          <span className="text-muted-foreground">{pct}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="mt-5 space-y-5">
        {CHECKLIST_SECTIONS.map((section) => (
          <section key={section.id}>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {section.title}
            </h2>
            <ul className="overflow-hidden rounded-2xl border border-border bg-card">
              {section.items.map((it, idx) => {
                const on = !!checked[it.id];
                return (
                  <li
                    key={it.id}
                    className={cn(
                      "flex items-start gap-3 p-3.5",
                      idx !== section.items.length - 1 && "border-b border-border"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => toggle(it.id)}
                      aria-pressed={on}
                      className={cn(
                        "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors",
                        on
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-background hover:border-primary"
                      )}
                    >
                      {on && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </button>
                    <label
                      onClick={() => toggle(it.id)}
                      className={cn(
                        "cursor-pointer text-sm leading-snug",
                        on ? "text-muted-foreground line-through" : "text-foreground"
                      )}
                    >
                      {it.label}
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <Button
        variant="outline"
        className="mt-6 w-full gap-2"
        onClick={reset}
        disabled={done === 0}
      >
        <RotateCcw className="h-4 w-4" />
        Нулирай чеклиста
      </Button>
    </div>
  );
}
