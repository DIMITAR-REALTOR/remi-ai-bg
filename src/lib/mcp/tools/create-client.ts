import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "create_client",
  title: "Create a CRM client",
  description: "Add a new client to the signed-in broker's CRM on REMI AI.",
  inputSchema: {
    name: z.string().describe("Client full name."),
    phone: z.string().optional().describe("Phone number."),
    client_type: z.string().optional().describe("buyer or seller. Defaults to buyer."),
    looking_for: z.string().optional().describe("What the client is looking for, free text in Bulgarian."),
    notes: z.string().optional().describe("Free-text notes."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Not authenticated");
    const name = input.name.trim();
    if (!name) return errorResult("Името е задължително.");
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("clients")
      .insert({
        broker_id: ctx.getUserId(),
        name,
        phone: input.phone ?? null,
        client_type: input.client_type ?? "buyer",
        looking_for: input.looking_for ?? null,
        notes: input.notes ?? null,
      })
      .select()
      .maybeSingle();
    if (error) return errorResult(error.message);
    return textResult({ client: data });
  },
});
