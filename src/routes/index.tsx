import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Building2, Heart, LayoutDashboard, Users } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Estate Pro — Имоти в България" },
      { name: "description", content: "Намери своя имот или клиент в България. Апартаменти, къщи и парцели от лицензирани брокери." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="mx-auto max-w-xl px-5">
      <header className="pt-12 pb-8 text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
          <Building2 className="h-7 w-7" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-foreground">AI Estate Pro</h1>
        <p className="mt-2 text-sm text-muted-foreground">Имоти и брокери, събрани на едно място.</p>
      </header>

      <Link to="/search" className="block overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/70 p-6 text-primary-foreground shadow-xl shadow-primary/20">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15 backdrop-blur"><Search className="h-6 w-6" /></div>
          <div className="min-w-0">
            <p className="text-lg font-bold">Търси имот</p>
            <p className="text-sm text-primary-foreground/80">Прегледай активни обяви в цяла България</p>
          </div>
        </div>
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

      <section className="mt-10 space-y-3 text-center">
        <h2 className="text-base font-semibold text-foreground">Защо AI Estate Pro?</h2>
        <p className="text-sm text-muted-foreground">Всички обяви — от проверени брокери. Без излишен шум, само това, което търсиш.</p>
      </section>
    </div>
  );
}
