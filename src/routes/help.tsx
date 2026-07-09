import { createFileRoute } from "@tanstack/react-router";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Помощ — REMI AI" },
      { name: "description", content: "Често задавани въпроси за използване на REMI AI." },
      { property: "og:title", content: "Помощ — REMI AI" },
      { property: "og:description", content: "Често задавани въпроси за използване на REMI AI." },
    ],
    links: [{ rel: "canonical", href: "https://remi-ai-bg.lovable.app/help" }],
  }),
  component: HelpPage,
});

const faqs = [
  {
    q: "Как да създам профил?",
    a: `Натисни „Регистрация" в горния десен ъгъл и избери дали си брокер или клиент. Попълни име, имейл, телефон и парола.`,
  },
  {
    q: "Как да добавя обява (за брокери)?",
    a: `Влез в профила си, отвори „Обяви" в брокерския панел и натисни „Добави обява". Попълни детайлите и качи снимки.`,
  },
  {
    q: "Как работи AI анализът на сделка?",
    a: `Отвори „Инструменти → Анализ на сделка", въведи цена, локация и тип строителство. AI ще оцени риска и ще даде препоръка на български.`,
  },
  {
    q: "Как да запазя любим имот?",
    a: `Отвори обявата и натисни „Запази в любими". Може да ги преглеждаш в раздел „Любими" по всяко време.`,
  },
  {
    q: "Как да изтрия моя профил?",
    a: "Свържи се с нас на 0893 366 051 или remi.ai.bg@gmail.com. Профилът и всички свързани данни ще бъдат премахнати при поискване.",
  },
];

function HelpPage() {
  return (
    <div className="mx-auto max-w-xl px-5 pt-6">
      <div className="flex items-center gap-2">
        <HelpCircle className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-black text-foreground">Помощ</h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">Често задавани въпроси за REMI AI.</p>

      <Accordion type="single" collapsible className="mt-6">
        {faqs.map((f, i) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger className="text-left text-sm font-semibold">{f.q}</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="mt-8 rounded-2xl border border-border bg-card p-4 text-sm">
        <p className="font-semibold text-foreground">Не намери отговор?</p>
        <p className="mt-1 text-muted-foreground">
          Свържи се с нас на <a href="tel:0893366051" className="text-primary hover:underline">0893 366 051</a> или пиши на{" "}
          <a href="mailto:remi.ai.bg@gmail.com" className="text-primary hover:underline">remi.ai.bg@gmail.com</a>.
        </p>
      </div>
    </div>
  );
}
