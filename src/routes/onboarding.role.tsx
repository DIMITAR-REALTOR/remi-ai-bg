import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Building2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/onboarding/role")({
  validateSearch: (s: Record<string, unknown>): { next?: string } =>
    typeof s.next === "string" && s.next.startsWith("/") && !s.next.startsWith("//")
      ? { next: s.next }
      : {},
  component: RoleOnboardingPage,
});

function RoleOnboardingPage() {
  const { user, loading, refreshRole } = useAuth();
  const navigate = useNavigate();
  const next = Route.useSearch().next;
  const [checking, setChecking] = useState(true);
  const [selection, setSelection] = useState<AppRole | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth", replace: true });
      return;
    }

    let active = true;
    supabase
      .from("user_roles")
      .select("role, role_selection_pending")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          toast.error("Неуспешна проверка на профила");
          navigate({ to: "/profile", replace: true });
          return;
        }
        if (!data?.role_selection_pending) {
          navigate({ to: next ?? "/profile", replace: true });
          return;
        }
        setChecking(false);
      });

    return () => {
      active = false;
    };
  }, [loading, user, navigate, next]);

  const saveRole = async () => {
    if (!selection) return;
    setBusy(true);
    const { error } = await supabase.rpc("set_my_role", { p_role: selection });
    if (error) {
      setBusy(false);
      toast.error("Ролята не беше запазена");
      return;
    }
    await refreshRole();
    navigate({ to: next ?? "/profile", replace: true });
  };

  if (loading || checking || !user) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Зареждане...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-5 pt-10">
      <div className="text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
          <Building2 className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-black text-foreground">Добре дошъл в REMI AI</h1>
        <p className="mt-2 text-sm text-muted-foreground">Избери как ще използваш платформата.</p>
      </div>

      <div className="mt-8 space-y-3">
        <Button
          type="button"
          variant={selection === "broker" ? "default" : "outline"}
          className="h-auto w-full justify-start gap-3 px-4 py-4 text-left"
          onClick={() => setSelection("broker")}
        >
          <Building2 className="h-5 w-5 shrink-0" />
          <span>
            <span className="block font-semibold">Брокер</span>
            <span className="block text-xs font-normal opacity-75">
              Управлявам имоти, клиенти и сделки.
            </span>
          </span>
        </Button>
        <Button
          type="button"
          variant={selection === "client" ? "default" : "outline"}
          className="h-auto w-full justify-start gap-3 px-4 py-4 text-left"
          onClick={() => setSelection("client")}
        >
          <UserRound className="h-5 w-5 shrink-0" />
          <span>
            <span className="block font-semibold">Клиент</span>
            <span className="block text-xs font-normal opacity-75">
              Търся имот и управлявам моите запитвания.
            </span>
          </span>
        </Button>
      </div>

      <Button className="mt-6 w-full" disabled={!selection || busy} onClick={saveRole}>
        {busy ? "Запазване..." : "Продължи"}
      </Button>
    </div>
  );
}
