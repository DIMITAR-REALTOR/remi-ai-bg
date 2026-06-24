import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Building2, Heart, LayoutDashboard, Users, ShieldAlert, ArrowRight } from "lucide-react";
import heroCoast from "@/assets/hero-coast.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "REMI AI — Real Estate Market Intelligence" },
      { name: "description", content: "Намери своя имот или клиент в България с REMI AI. Апартаменти, къщи и парцели от лицензирани брокери." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div>
      <section className="relative isolate overflow-hidden">
        <img
          src={heroCoast}
          alt="Морската градина във Варна"
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-background" />
        <div className="relative mx-auto max-w-xl px-5 pt-16 pb-12 text-white">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-white/15 backdrop-blur">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="text-center text-3xl font-black leading-tight tracking-tight sm:text-4xl">
            Намери своя дом в България
          </h1>
          <p className="mx-auto mt-3 max-w-md text-center text-sm text-white/85">
            Разгледай имоти от доверени български брокери
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <Link
              to="/search"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:bg-primary/90"
            >
              <Search className="h-4 w-4" />
              Разгледай имоти
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/60 bg-white/10 px-5 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              Брокерски портал
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto -mt-4 max-w-xl px-5">
        <Link
          to="/risk"
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-primary/40"
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Анализ на сделка с AI</p>
            <p className="text-xs text-muted-foreground">Оцени риска на имот за секунди</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </Link>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Link to="/auth" className="rounded-2xl border border-border bg-card p-4 text-card-foreground transition hover:border-primary/40">
            <LayoutDashboard className="mb-2 h-5 w-5 text-primary" />
            <p className="text-sm font-semibold">Аз съм брокер</p>
            <p className="text-xs text-muted-foreground">Управлявай обяви</p>
          </Link>
          <Link to="/auth" className="rounded-2xl border border-border bg-card p-4 text-card-foreground transition hover:border-primary/40">
            <Heart className="mb-2 h-5 w-5 text-primary" />
            <p className="text-sm font-semibold">Аз съм клиент</p>
            <p className="text-xs text-muted-foreground">Намери своя дом</p>
          </Link>
        </div>

        <Link to="/brokers" className="mt-3 flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Users className="h-5 w-5" /></div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Брокери</p>
            <p className="text-xs text-muted-foreground">Разгледай всички брокери в платформата</p>
          </div>
        </Link>

        <section className="mt-10 space-y-3 pb-6 text-center">
          <h2 className="text-base font-semibold text-foreground">Защо REMI AI?</h2>
          <p className="text-sm text-muted-foreground">Без излишен шум, само това, което търсиш.</p>
        </section>
      </div>
    </div>
  );
}
