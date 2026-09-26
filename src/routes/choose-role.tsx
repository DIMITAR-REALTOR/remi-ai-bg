import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Building2, User } from "lucide-react";

export const Route = createFileRoute("/choose-role")({
  head: () => ({ meta: [{ title: "Избери профил — REMI AI" }] }),
  component: ChooseRolePage,
});

function ChooseRolePage() {
  const { user, loading, rolePending, refreshRole } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState<"broker" | "client" | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/auth", replace: true }); return; }
    if (!rolePending) navigate({ to: "/profile", replace: true });
  }, [loading, user, rolePending, navigate]);

  const choose = async (role: "broker" | "client") => {
    if (!user) return;
    setBusy(role);
    const { error } = await supabase.rpc("set_initial_role", { p_role: role });
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    await refreshRole();
    toast.success("Профилът е готов");
    navigate({ to: "/profile", replace: true });
  };

  if (loading || !user || !rolePending) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Зареждане...</div>;
  }

  return (
    <div className="mx-auto max-w-md px-5 pt-14 text-center">
      <h1 className="text-2xl font-black text-foreground">Как ще ползваш REMI AI?</h1>
      <p className="mt-2 text-sm text-muted-foreground">Избери типа на профила си, за да продължиш.</p>

      <div className="mt-8 space-y-3">
        <button
          type="button"
          onClick={() => choose("broker")}
          disabled={busy !== null}
          className="flex w-full items-center gap-3 rounded-2xl border-2 border-border bg-card p-4 text-left transition hover:border-primary disabled:opacity-60"
        >
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-foreground">Брокер</p>
            <p className="text-xs text-muted-foreground">Управлявам обяви, клиенти и сделки</p>
          </div>
          {busy === "broker" && <span className="ml-auto text-xs text-muted-foreground">Моля изчакай...</span>}
        </button>

        <button
          type="button"
          onClick={() => choose("client")}
          disabled={busy !== null}
          className="flex w-full items-center gap-3 rounded-2xl border-2 border-border bg-card p-4 text-left transition hover:border-primary disabled:opacity-60"
        >
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-foreground">Клиент</p>
            <p className="text-xs text-muted-foreground">Търся имот или следя пазара</p>
          </div>
          {busy === "client" && <span className="ml-auto text-xs text-muted-foreground">Моля изчакай...</span>}
        </button>
      </div>
    </div>
  );
}
