import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { getBrokerCount } from "@/lib/broker-count.functions";
import {
  ShieldAlert,
  DollarSign,
  PenTool,
  TrendingUp,
  Handshake,
  FolderKanban,
  Scale,
  FileText,
  Target,
  Mail,
  Clock,
  ShieldCheck,
  Briefcase,
  Trophy,
  Gift,
} from "lucide-react";

export const Route = createFileRoute("/for-brokers")({
  head: () => ({
    meta: [
      { title: "За брокери — REMI AI" },
      {
        name: "description",
        content:
          "Първата в България операционна система за недвижими имоти с изцяло интегриран изкуствен интелект.",
      },
      { property: "og:title", content: "За брокери — REMI AI" },
      {
        property: "og:description",
        content: "CRM, правен анализ, пазарна интелигентност и AI преговори в една платформа.",
      },
    ],
  }),
  component: ForBrokersPage,
});

const FEATURES = [
  { Icon: ShieldAlert, title: "Оцени риска на имот за секунди", desc: "Автоматична оценка на правни, технически и пазарни рискове." },
  { Icon: DollarSign, title: "Определи справедлива цена", desc: "AI анализ на пазарната стойност." },
  { Icon: PenTool, title: "Генерирай продаващи описания", desc: "Професионални текстове за секунди." },
  { Icon: TrendingUp, title: "Пазарна интелигентност в реално време", desc: "Знаеш кога и на каква цена да продаваш." },
  { Icon: Handshake, title: "Обективни данни за преговори", desc: "По-силни преговори, по-високи комисиони." },
  { Icon: FolderKanban, title: "Организирано портфолио с AI insights", desc: "По-добър overview, по-бързи действия." },
  { Icon: Scale, title: "Сравнение на имоти с AI", desc: "Обективна AI преценка коя оферта е по-добра." },
];

const COMING_SOON = [
  { Icon: FileText, label: "Автоматични PDF отчети за клиенти" },
  { Icon: Target, label: "AI приоритизиране на лийдове" },
  { Icon: Mail, label: "Персонализирани оферти и имейли" },
];

const WHY = [
  { Icon: Clock, text: "Спестяваш 10–20 часа седмично" },
  { Icon: TrendingUp, text: "Продаваш повече" },
  { Icon: ShieldCheck, text: "По-нисък риск" },
  { Icon: Briefcase, text: "Изглеждаш като топ брокер пред всеки клиент" },
  { Icon: Trophy, text: "Конкурентно предимство" },
];

function ForBrokersPage() {
  const brokerCountFn = useServerFn(getBrokerCount);
  const { data } = useQuery({
    queryKey: ["broker-count"],
    queryFn: () => brokerCountFn(),
  });

  const count = data?.count ?? 0;
  const remaining = Math.max(0, 50 - count);
  const promoActive = remaining > 0;

  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="mx-auto max-w-3xl px-5 pt-8 pb-12">
      {/* HERO */}
      <section className="text-center">
        <h1 className="text-3xl font-black leading-tight tracking-tight text-foreground sm:text-4xl">
          Първата в България операционна система за недвижими имоти с изцяло интегриран изкуствен интелект
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          REMI AI съчетава CRM (бази с данни на имоти и клиенти), правен анализ, пазарна интелигентност и AI преговори в една платформа — за да вземаш по-добри решения на всяка стъпка от сделката.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link to="/auth">Регистрирай се безплатно</Link>
          </Button>
          <Button size="lg" variant="outline" onClick={scrollToFeatures} className="w-full sm:w-auto">
            Разгледай функциите
          </Button>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="mt-12 rounded-2xl border border-border bg-card p-6 text-center">
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          Брокерите губят 10–20 часа седмично в ръчен анализ, писане на обяви и търсене на данни — вместо да продават.
        </p>
        <p className="mt-3 text-base font-bold text-foreground sm:text-lg">
          REMI AI върши тази работа вместо теб, за секунди.
        </p>
      </section>

      {/* FEATURES */}
      <section id="features" className="mt-12 scroll-mt-20">
        <h2 className="text-center text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          Какво прави REMI AI за теб
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {FEATURES.map(({ Icon, title, desc }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-sm">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-foreground">{title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* COMING SOON */}
      <section className="mt-12 opacity-70">
        <h2 className="text-center text-lg font-bold text-muted-foreground">Очаквайте скоро</h2>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {COMING_SOON.map(({ Icon, label }) => (
            <div key={label} className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-card/50 p-3">
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 text-xs text-muted-foreground">{label}</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                скоро
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* WHY */}
      <section className="mt-12">
        <h2 className="text-center text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          Защо REMI AI
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-muted-foreground sm:text-base">
          Класическите CRM-и само пазят данни. REMI AI мисли с теб — на всяка стъпка от сделката, в реално време.
        </p>
        <ul className="mx-auto mt-6 max-w-xl space-y-2">
          {WHY.map(({ Icon, text }) => (
            <li key={text} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-foreground">{text}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* LIMITED OFFER */}
      <section className="mt-12 overflow-hidden rounded-3xl border border-primary/40 bg-gradient-to-br from-primary/10 via-card to-card p-6 text-center sm:p-8">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary">
          <Gift className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-xl font-black tracking-tight text-foreground sm:text-2xl">
          🎁 Специална оферта за първите 50
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
          Първите 50 регистрирани брокери ще ползват REMI AI 3 месеца безплатно.
        </p>
        {promoActive ? (
          <p className="mt-4 text-2xl font-black text-primary sm:text-3xl">
            Останаха {remaining} от 50 места
          </p>
        ) : (
          <p className="mt-4 text-lg font-bold text-muted-foreground">Промоцията приключи</p>
        )}
        <Button asChild size="lg" className="mt-6">
          <Link to="/auth">Регистрирай се безплатно</Link>
        </Button>
      </section>

      {/* FINAL CTA */}
      <section className="mt-12 text-center">
        <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          Готов ли си да вземаш по-добри решения на всяка сделка?
        </h2>
        <Button asChild size="lg" className="mt-6">
          <Link to="/auth">Регистрирай се безплатно</Link>
        </Button>
      </section>
    </div>
  );
}
