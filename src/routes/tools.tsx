import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldAlert, CheckCircle2, MessageSquare, Calculator, History, Wrench } from "lucide-react";

export const Route = createFileRoute("/tools")({
  head: () => ({
    meta: [
      { title: "Инструменти — AI Estate Pro" },
      { name: "description", content: "Полезни инструменти за брокери и купувачи на имоти." },
    ],
  }),
  component: ToolsPage,
});

const TOOLS = [
  { to: "/risk", icon: ShieldAlert, title: "Анализ на сделка", desc: "AI оценка на риска при покупка" },
  { to: "/checklist", icon: CheckCircle2, title: "Чеклист", desc: "Стъпки за оглед и покупка" },
  { to: "/negotiation", icon: MessageSquare, title: "Преговори", desc: "Готови аргументи и тактики" },
  { to: "/calculator", icon: Calculator, title: "Инвестиционен калкулатор", desc: "Доходност, вноска и паричен поток" },
  { to: "/history", icon: History, title: "История", desc: "Запазени анализи и калкулации" },
] as const;

function ToolsPage() {
  return (
    <div className="mx-auto max-w-xl px-5 pt-6 pb-8">
      <header className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Wrench className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Инструменти</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Помощници за брокери и купувачи. Работят и офлайн.
          </p>
        </div>
      </header>

      <div className="mt-6 space-y-3">
        {TOOLS.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.to}
              to={t.to}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40 hover:shadow-sm"
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{t.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
