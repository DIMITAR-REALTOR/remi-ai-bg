import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "create_task",
  title: "Create a task or viewing",
  description: "Create a task or scheduled viewing for the signed-in broker on REMI AI.",
  inputSchema: {
    title: z.string().describe("Task title, in Bulgarian when possible."),
    due_at: z.string().describe("Due date and time as an ISO 8601 timestamp."),
    notes: z.string().optional().describe("Free-text notes."),
    client_id: z.string().optional().describe("Related CRM client id (uuid)."),
    listing_id: z.string().optional().describe("Related listing id (uuid)."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Not authenticated");
    const title = input.title.trim();
    if (!title) return errorResult("Заглавието е задължително.");
    const due = new Date(input.due_at);
    if (Number.isNaN(due.getTime())) return errorResult("due_at трябва да е валидна ISO 8601 дата.");
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        broker_id: ctx.getUserId(),
        title,
        due_at: due.toISOString(),
        notes: input.notes ?? null,
        client_id: input.client_id ?? null,
        listing_id: input.listing_id ?? null,
      })
      .select()
      .maybeSingle();
    if (error) return errorResult(error.message);
    return textResult({ task: data });
  },
});
