import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/.mcp/list-tools")({
  component: () => (
    <div className="p-6 text-sm text-muted-foreground">MCP tooling is disabled in this deployment.</div>
  ),
});
