import { createServerFn } from "@tanstack/react-start";

export const getHomeStats = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const [listings, brokers] = await Promise.all([
    supabaseAdmin.from("listings").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }).eq("broker_status", "verified"),
  ]);

  return {
    activeListings: listings.count ?? 0,
    verifiedBrokers: brokers.count ?? 0,
  };
});
