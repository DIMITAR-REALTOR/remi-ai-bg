import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/mcp")({
  component: () => (
    <div className="flex min-h-screen items-center justify-center px-6 py-16 text-center text-foreground">
      <div>
        <h1 className="text-2xl font-semibold">MCP disabled</h1>
        <p className="mt-2 text-sm text-muted-foreground">This deployment does not use the Lovable MCP layer.</p>
      </div>
    </div>
  ),
});
