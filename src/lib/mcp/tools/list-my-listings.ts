import { defineTool } from "@lovable.dev/mcp-js";
import { errorResult, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "list_my_listings",
  title: "List my listings",
  description: "List all property listings owned by the signed-in broker, including drafts and inactive ones.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Not authenticated");
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("listings")
      .select("id,title,price_eur,property_type,area_sqm,rooms,city,neighborhood,status,created_at")
      .eq("broker_id", ctx.getUserId())
      .order("created_at", { ascending: false });
    if (error) return errorResult(error.message);
    return textResult({ count: data?.length ?? 0, listings: data ?? [] });
  },
});
