import { createFileRoute } from "@tanstack/react-router";
import { Building2, TrendingUp, Brain, Scale, MessageSquare, Sparkles } from "lucide-react";

export const Route = createFileRoute("/architecture")({
  head: () => ({
    meta: [
      { title: "Архитектура — REMI AI" },
      { name: "description", content: "REMI Core Engine — един AI, четири функционални слоя." },
    ],
  }),
  component: ArchitecturePage,
});

const foundationLayers = [
  {
    title: "CRM Layer",
    icon: Building2,
    desc: "Управление на бизнеса: клиенти, имоти, сделки.",
    color: "text-blue-500",
  },
  {
    title: "Market Intelligence Layer",
    icon: TrendingUp,
    desc: "Разбиране на пазара: цени, тенденции, сравними имоти.",
    color: "text-green-500",
  },
];

const coreLayers = [
  {
    title: "Reasoning Layer",
    icon: Brain,
    desc: "Анализ на сделки, идентификация на рискове, decision support в реално време.",
    color: "text-yellow-500",
  },
  {
    title: "Communication Layer",
    icon: MessageSquare,
    desc: "Преговори, продажби и маркетингови текстове — общи данни за клиента и имота.",
    color: "text-pink-500",
  },
  {
    title: "Legal Layer",
    icon: Scale,
    desc: "Правен анализ, документи, тежести, нотариални и данъчни аспекти.",
    color: "text-purple-500",
  },
  {
    title: "Market Layer",
    icon: Sparkles,
    desc: "Връзка с Market Intelligence — цена, риск и инвестиционен анализ.",
    color: "text-cyan-500",
  },
];

function ArchitecturePage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-black tracking-tight text-foreground">
          REMI Core Engine — Архитектура
        </h1>
        <p className="text-lg text-muted-foreground">
          Един AI двигател, обслужващ четири функционални слоя — вместо множество отделни агенти.
        </p>
      </div>

      <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-bold text-foreground mb-4">Принцип</h2>
        <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground">
          „REMI Core Engine получава пълния контекст на сделката и разпределя задачата към правилния функционален слой — вместо да я предава на изолиран агент.“
        </blockquote>
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-bold text-foreground mb-4">Основа: два data слоя</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {foundationLayers.map((layer, i) => (
            <div key={i} className="flex gap-4 rounded-2xl border border-border bg-background p-4">
              <div className={`mt-1 rounded-lg bg-muted p-2 ${layer.color}`}>
                <layer.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">{layer.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{layer.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-bold text-foreground mb-4">REMI Core Engine — четири функционални слоя</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {coreLayers.map((layer, i) => (
            <div key={i} className="flex gap-4 rounded-2xl border border-border bg-background p-4 transition-colors hover:border-primary/20">
              <div className={`mt-1 rounded-lg bg-muted p-2 ${layer.color}`}>
                <layer.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">{layer.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{layer.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Формулата, приложена еднакво във всеки слой: <span className="font-semibold text-foreground">[Контекст] + [Правило] = [Действие]</span>.
        </p>
      </div>

      <div className="mt-10 rounded-2xl border border-border bg-muted/30 p-6">
        <h2 className="text-lg font-bold text-foreground mb-2">Knowledge / RAG — обща база от знания</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Всички четири функционални слоя ползват обща база от знания (законодателство, пазарни анализи, натрупана практика), а не отделни изолирани модели — инфраструктура, не пети паралелен слой.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-muted/30 p-6">
        <h2 className="text-lg font-bold text-foreground mb-2">Automation и Document Intelligence</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Реализирани като способности вътре в слоевете по-горе, не като самостоятелни слоеве: Automation (follow-up, известия) — изход на Reasoning/Communication; Document Intelligence (документи, снимки, PDF-и) — вътре в Legal Layer.
        </p>
      </div>

      <div className="mt-12 rounded-2xl bg-primary/5 p-6 text-center border border-primary/10">
        <p className="text-sm font-medium text-primary uppercase tracking-wider">Status</p>
        <p className="mt-2 text-foreground font-semibold">
          Единен AI Kernel, не разпилени агенти — REMI Core Engine захранва цялата платформа.
        </p>
      </div>
    </div>
  );
}
