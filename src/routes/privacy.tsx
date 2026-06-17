import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Политика на поверителност — REMI AI" },
      { name: "description", content: "Как REMI AI събира, използва и защитава лични данни." },
      { property: "og:title", content: "Политика на поверителност — REMI AI" },
      { property: "og:description", content: "Как REMI AI събира, използва и защитава лични данни." },
    ],
    links: [{ rel: "canonical", href: "https://remi-ai-bg.lovable.app/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="mx-auto max-w-xl px-5 pt-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-black text-foreground">Политика на поверителност</h1>
      </div>

      <div className="mt-6 space-y-5 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-1 text-base font-semibold text-foreground">Какви данни събираме</h2>
          <p>
            REMI AI събира имена, телефони, имейл адреси, профилни снимки и информация за обяви (тип имот,
            цена, локация, снимки), която потребителите въвеждат сами. Не събираме данни без знанието на потребителя.
          </p>
        </section>

        <section>
          <h2 className="mb-1 text-base font-semibold text-foreground">Как използваме данните</h2>
          <p>
            Данните се използват, за да свържем купувачи и продавачи, да показваме обявите на брокерите,
            да позволяваме контакт между страните и да подобряваме функционалността на платформата.
            Не продаваме лични данни на трети страни.
          </p>
        </section>

        <section>
          <h2 className="mb-1 text-base font-semibold text-foreground">Съхранение и сигурност</h2>
          <p>
            Данните се съхраняват в защитена облачна база данни и са защитени с стандартно шифриране (TLS при пренос и в покой).
            Достъп до данните имат само оторизирани служители и автоматизирани процеси на платформата.
          </p>
        </section>

        <section>
          <h2 className="mb-1 text-base font-semibold text-foreground">Твоите права</h2>
          <p>
            Можеш да преглеждаш, променяш и изтриваш своя профил и всички свои данни по всяко време чрез
            настройките на профила или като се свържеш с нас. По твое искане ще премахнем всички твои лични данни.
          </p>
        </section>

        <section>
          <h2 className="mb-1 text-base font-semibold text-foreground">Контакт</h2>
          <p>
            За въпроси относно поверителността: <a href="tel:0893366051" className="text-primary hover:underline">0893 366 051</a>{" "}
            или <a href="https://compassrealestate.bg" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">compassrealestate.bg</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
