import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "broker" | "client";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  isBroker: boolean;
  refreshRole: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null, session: null, role: null, loading: true, isBroker: false,
  refreshRole: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRole = async (uid: string | undefined) => {
    if (!uid) { setRole(null); return; }
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid).maybeSingle();
    setRole((data?.role as AppRole) ?? "client");
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setTimeout(() => loadRole(s?.user.id), 0);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      loadRole(data.session?.user.id).finally(() => setLoading(false));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <Ctx.Provider value={{
      user: session?.user ?? null,
      session,
      role,
      loading,
      isBroker: role === "broker",
      refreshRole: () => loadRole(session?.user.id),
    }}>{children}</Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
