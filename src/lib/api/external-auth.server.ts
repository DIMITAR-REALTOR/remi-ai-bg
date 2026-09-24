import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type ApiErrorCode = "UNAUTHORIZED" | "FORBIDDEN" | "VALIDATION_ERROR" | "DATABASE_ERROR";

export function apiError(status: number, code: ApiErrorCode, message: string) {
  return Response.json({ version: "v1", error: { code, message } }, { status });
}

export async function getApiSupabase(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return { response: apiError(401, "UNAUTHORIZED", "Bearer token is required") } as const;
  }

  const token = authorization.slice("Bearer ".length).trim();
  if (!token) return { response: apiError(401, "UNAUTHORIZED", "Bearer token is required") } as const;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return { response: apiError(500, "DATABASE_ERROR", "Supabase API is not configured") } as const;

  const supabase = createClient<Database>(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) {
    return { response: apiError(401, "UNAUTHORIZED", "Invalid bearer token") } as const;
  }

  return { supabase, userId: data.claims.sub } as const;
}

export function apiResponse<T>(data: T, status = 200) {
  return Response.json({ version: "v1", data }, { status });
}