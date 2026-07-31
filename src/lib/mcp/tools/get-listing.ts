import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "get_listing",
  title: "Get listing details",
  description: "Get the full details of one property listing by its id, including description, photos and the broker profile.",
  inputSchema: { id: z.string().describe("Listing id (uuid).") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Not authenticated");
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) return errorResult(error.message);
    if (!data) return errorResult("Обявата не е намерена.");

    const { data: broker } = await supabase
      .from("profiles")
      .select("id,full_name,agency_name,phone,email,city")
      .eq("id", data.broker_id)
      .maybeSingle();

    return textResult({ listing: data, broker });
  },
});
