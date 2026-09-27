import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/.mcp/invoke-tool/$tool")({
  component: () => (
    <div className="p-6 text-sm text-muted-foreground">MCP tool invocation is disabled in this deployment.</div>
  ),
});
