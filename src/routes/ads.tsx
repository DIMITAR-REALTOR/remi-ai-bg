import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Megaphone, ArrowLeft, Sparkles, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/ads")({
  head: () => ({
    meta: [
      { title: "REMI Маркетинг асистент" },
      { name: "description", content: "Генериране на атрактивни обяви и маркетингови текстове." },
    ],
  }),
  component: AdsPage,
});

function AdsPage() {
  const [type, setType] = useState("");
  const [location, setLocation] = useState("");
  const [features, setFeatures] = useState("");
  const [output, setOutput] = useState("");

  const generate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!type.trim() || !location.trim()) {
      toast.error("Попълни тип имот и локация");
      return;
    }
    const text = `🏠 ${type} в ${location}

${features.trim() || "Модерен имот с отлични характеристики"}.

Разположен в предпочитан район с бърз достъп до всички удобства — училища, магазини, транспорт.

✨ Предимства:
• Отлична локация
• Готов за нанасяне
• Инвестиционен потенциал

📞 За оглед и повече информация: 0893 366 051
📧 remi.ai.bg@gmail.com`;
    setOutput(text);
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
            Генериране на атрактивни обяви и маркетингови текстове.
          </p>
        </div>
      </header>

      <form onSubmit={generate} className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-4">
        <div>
          <Label htmlFor="t">Тип имот</Label>
          <Input id="t" value={type} onChange={(e) => setType(e.target.value)} placeholder="напр. 2-стаен апартамент" />
        </div>
        <div>
          <Label htmlFor="l">Локация</Label>
          <Input id="l" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="напр. Варна, Чайка" />
        </div>
        <div>
          <Label htmlFor="f">Ключови характеристики</Label>
          <Textarea id="f" rows={3} value={features} onChange={(e) => setFeatures(e.target.value)}
            placeholder="напр. панорамна гледка, ново обзавеждане, гараж..." />
        </div>
        <Button type="submit" className="w-full gap-2">
          <Sparkles className="h-4 w-4" /> Генерирай текст
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
