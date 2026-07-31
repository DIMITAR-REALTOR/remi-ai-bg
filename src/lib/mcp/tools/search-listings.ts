import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "search_listings",
  title: "Search property listings",
  description:
    "Search active property listings on REMI AI by city, property type and price range. Returns id, title, price in EUR, area, rooms and location.",
  inputSchema: {
    city: z.string().optional().describe("City name, e.g. Варна."),
    property_type: z.string().optional().describe("Property type as stored, e.g. апартамент, къща."),
    min_price_eur: z.number().optional().describe("Minimum price in EUR."),
    max_price_eur: z.number().optional().describe("Maximum price in EUR."),
    limit: z.number().optional().describe("Max results, default 20, capped at 50."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Not authenticated");
    const supabase = supabaseForUser(ctx);
    let q = supabase
      .from("listings")
      .select("id,title,price_eur,property_type,area_sqm,rooms,floor,city,neighborhood,created_at")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(Math.min(Math.max(input.limit ?? 20, 1), 50));

    if (input.city) q = q.ilike("city", `%${input.city}%`);
    if (input.property_type) q = q.ilike("property_type", `%${input.property_type}%`);
    if (typeof input.min_price_eur === "number") q = q.gte("price_eur", input.min_price_eur);
    if (typeof input.max_price_eur === "number") q = q.lte("price_eur", input.max_price_eur);

    const { data, error } = await q;
    if (error) return errorResult(error.message);
    return textResult({ count: data?.length ?? 0, listings: data ?? [] });
  },
});
