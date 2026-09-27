import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/.well-known/oauth-protected-resource")({
  component: () => (
    <div className="p-6 text-sm text-muted-foreground">OAuth protected resource metadata is disabled in this deployment.</div>
  ),
});
