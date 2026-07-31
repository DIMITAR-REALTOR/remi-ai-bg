import { defineTool } from "@lovable.dev/mcp-js";
import { errorResult, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "list_my_favorites",
  title: "List my favorite properties",
  description: "List the properties the signed-in user saved as favorites on REMI AI.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Not authenticated");
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("favorites")
      .select("listing_id,created_at,listings(id,title,price_eur,property_type,area_sqm,rooms,city,neighborhood,status)")
      .eq("user_id", ctx.getUserId())
      .order("created_at", { ascending: false });
    if (error) return errorResult(error.message);
    return textResult({ count: data?.length ?? 0, favorites: data ?? [] });
  },
});
