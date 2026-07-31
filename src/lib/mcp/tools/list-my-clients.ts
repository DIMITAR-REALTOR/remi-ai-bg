import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "list_my_clients",
  title: "List my CRM clients",
  description: "List the CRM clients of the signed-in broker, optionally filtered by status or client type.",
  inputSchema: {
    status: z.string().optional().describe("Client status as stored, e.g. new, active, closed."),
    client_type: z.string().optional().describe("Client type as stored, e.g. buyer, seller."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, client_type }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Not authenticated");
    const supabase = supabaseForUser(ctx);
    let q = supabase
      .from("clients")
      .select("id,name,phone,client_type,looking_for,status,notes,last_contact_at,created_at")
      .eq("broker_id", ctx.getUserId())
      .order("created_at", { ascending: false });
    if (status) q = q.eq("status", status);
    if (client_type) q = q.eq("client_type", client_type);
    const { data, error } = await q;
    if (error) return errorResult(error.message);
    return textResult({ count: data?.length ?? 0, clients: data ?? [] });
  },
});
