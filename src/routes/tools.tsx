import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldAlert, CheckCircle2, MessageSquare, Calculator, Wrench, TrendingUp, Megaphone } from "lucide-react";

export const Route = createFileRoute("/tools")({
  head: () => ({
    meta: [
      { title: "Инструменти — REMI AI" },
      { name: "description", content: "Полезни инструменти за брокери и купувачи на имоти." },
    ],
  }),
  component: ToolsPage,
});

const TOOLS = [
  { to: "/risk", icon: ShieldAlert, title: "REMI Правен анализ", desc: "Идентификуване на рискове, анализ на собственост и правни проблеми" },
  { to: "/checklist", icon: CheckCircle2, title: "REMI Интелигентен чеклист", desc: "Автоматично генериран чеклист по сделка" },
  { to: "/negotiation", icon: MessageSquare, title: "REMI Преговори и продажби", desc: "AI подкрепа при преговори и затваряне на сделки" },
  { to: "/ads", icon: Megaphone, title: "REMI Маркетинг асистент", desc: "Генериране на атрактивни обяви и маркетингови текстове" },
  { to: "/invest", icon: Calculator, title: "REMI Инвеститорски анализ", desc: "Анализ на инвестиционен потенциал и ROI" },
  { to: "/market", icon: TrendingUp, title: "REMI Пазарна интелигентност", desc: "Анализ на пазара, цени и локация" },
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
