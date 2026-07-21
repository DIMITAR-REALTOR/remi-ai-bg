import { createServerFn } from "@tanstack/react-start";

export const getBrokerCount = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count, error } = await supabaseAdmin
    .from("user_roles")
    .select("*", { count: "exact", head: true })
    .eq("role", "broker");
  if (error) throw new Error(error.message);
  return { count: count ?? 0 };
});
