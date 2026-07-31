import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "list_my_tasks",
  title: "List my tasks and viewings",
  description: "List the tasks and scheduled viewings of the signed-in broker, ordered by due date.",
  inputSchema: {
    include_completed: z.boolean().optional().describe("Include completed tasks. Defaults to false."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ include_completed }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Not authenticated");
    const supabase = supabaseForUser(ctx);
    let q = supabase
      .from("tasks")
      .select("id,title,due_at,notes,completed,client_id,listing_id,created_at")
      .eq("broker_id", ctx.getUserId())
      .order("due_at", { ascending: true });
    if (!include_completed) q = q.eq("completed", false);
    const { data, error } = await q;
    if (error) return errorResult(error.message);
    return textResult({ count: data?.length ?? 0, tasks: data ?? [] });
  },
});
