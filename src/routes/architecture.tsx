import { createFileRoute } from "@tanstack/react-router";
import { Building2, ShieldCheck, TrendingUp, Scale, Zap, FileText, Database, Share2 } from "lucide-react";

export const Route = createFileRoute("/architecture")({
  head: () => ({
    meta: [
      { title: "Архитектура — REMI AI" },
      { name: "description", content: "REMI AI Architecture Blueprint 1.0 - One AI Kernel концепция." },
    ],
  }),
  component: ArchitecturePage,
});

const layers = [
  {
    title: "CRM Layer",
    icon: Building2,
    desc: "Клиенти, имоти, сделки и оперативни задачи.",
    color: "text-blue-500",
  },
  {
    title: "Market Intelligence Layer",
    icon: TrendingUp,
    desc: "Цени, тенденции, пазарен анализ и сравними имоти.",
    color: "text-green-500",
  },
  {
    title: "Legal Knowledge Layer",
    icon: Scale,
    desc: "Законодателство, проверка на документи и процедури.",
    color: "text-purple-500",
  },
  {
    title: "Sales Intelligence Layer",
    icon: Zap,
    desc: "Стратегии за продажби, възражения и преговори.",
    color: "text-yellow-500",
  },
  {
    title: "Marketing Layer",
    icon: Share2,
    desc: "Обяви, социални мрежи и рекламни кампании.",
    color: "text-pink-500",
  },
  {
    title: "Automation Layer",
    icon: ShieldCheck,
    desc: "Follow-up, известия и бизнес workflows.",
    color: "text-orange-500",
  },
  {
    title: "Document Intelligence Layer",
    icon: FileText,
    desc: "Анализ, класификация и обработка на документи.",
    color: "text-cyan-500",
  },
  {
    title: "Knowledge / RAG Layer",
    icon: Database,
    desc: "Достъп до проверена вътрешна база от знания.",
    color: "text-indigo-500",
  },
];

function ArchitecturePage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-black tracking-tight text-foreground">
          REMI AI Architecture Blueprint 1.0
        </h1>
        <p className="text-lg text-muted-foreground">
          REMI AI Operating System: Концепция за Единно AI ядро (One AI Kernel).
        </p>
      </div>

      <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-bold text-foreground mb-4">Стратегическа визия</h2>
        <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground">
          „REMI AI е един централен AI Kernel, разширен чрез специализирани функционални слоеве. Слоевете не са отделни AI системи, а различни контексти, които ядрото използва според задачата.“
        </blockquote>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {layers.map((layer, i) => (
          <div key={i} className="flex gap-4 rounded-2xl border border-border bg-background p-4 transition-colors hover:border-primary/20">
            <div className={`mt-1 rounded-lg bg-muted p-2 ${layer.color}`}>
              <layer.icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">{layer.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                {layer.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 space-y-6">
        <h2 className="text-2xl font-bold text-foreground">Архитектурен принцип</h2>
        <div className="overflow-hidden rounded-2xl border border-border bg-muted/30">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Неправилен подход ❌</th>
                <th className="px-4 py-3 font-semibold">REMI AI модел ✅</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="px-4 py-3 italic text-muted-foreground">Множество отделни AI инструменти</td>
                <td className="px-4 py-3 font-medium text-foreground">Единно AI ядро (One Kernel)</td>
              </tr>
              <tr>
                <td className="px-4 py-3 italic text-muted-foreground">Раздробен контекст и данни</td>
                <td className="px-4 py-3 font-medium text-foreground">Централизирана бизнес логика</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-12 rounded-2xl bg-primary/5 p-6 text-center border border-primary/10">
        <p className="text-sm font-medium text-primary uppercase tracking-wider">Status</p>
        <p className="mt-2 text-foreground font-semibold">
          Тази архитектура позиционира REMI като пълноценна AI операционна система за недвижими имоти.
        </p>
      </div>
    </div>
  );
}
