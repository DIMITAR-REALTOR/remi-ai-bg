import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, FileText, Clock } from "lucide-react";
import { CONTRACT_TYPES } from "@/lib/contracts-meta";

export const Route = createFileRoute("/_app/dashboard/contracts/new")({
  component: NewContractPicker,
});

const TYPE_TO_ROUTE: Record<string, string> = {
  preliminary_sale: "/dashboard/contracts/new/preliminary-sale",
};

function NewContractPicker() {
  return (
    <div className="mx-auto max-w-xl px-4 pt-4 pb-8">
      <Link to="/dashboard/contracts" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" />Назад
      </Link>

      <h1 className="mt-2 text-2xl font-black text-foreground">Нов договор</h1>
      <p className="mt-0.5 text-xs text-muted-foreground">Избери тип документ.</p>

      <div className="mt-4 space-y-2">
        {CONTRACT_TYPES.map((t) => {
          const to = TYPE_TO_ROUTE[t.value];
          const content = (
            <div
              className={
                "flex items-center gap-3 rounded-2xl border p-4 " +
                (t.available
                  ? "border-border bg-card transition hover:border-primary/40 hover:shadow-sm"
                  : "border-dashed border-border bg-muted/30 opacity-70")
              }
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{t.label}</p>
                {!t.available && (
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" />Очаквайте скоро
                  </p>
                )}
              </div>
            </div>
          );
          return t.available && to ? (
            <Link key={t.value} to={to}>{content}</Link>
          ) : (
            <div key={t.value}>{content}</div>
          );
        })}
      </div>
    </div>
  );
}
