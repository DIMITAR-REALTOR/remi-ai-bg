export type LovableErrorOptions = {
  mechanism?: "manual" | "onerror" | "unhandledrejection" | "react_error_boundary";
  handled?: boolean;
  severity?: "error" | "warning" | "info";
};

export function reportLovableError(_error: unknown, _context: Record<string, unknown> = {}) {
  // Lovable-specific error reporting is disabled for Vercel/Nitro deployments.
  // Keep this function as a no-op to avoid shipping Lovable runtime dependencies.
}
