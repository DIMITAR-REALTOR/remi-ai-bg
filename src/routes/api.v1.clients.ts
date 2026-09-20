import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { apiError, apiResponse, getApiSupabase } from "@/lib/api/external-auth.server";

const ClientInput = z.object({
  name: z.string().trim().min(1).max(200),
  phone: z.string().trim().max(50).optional().nullable(),
  client_type: z.enum(["buyer", "seller", "renter"]).default("buyer"),
  looking_for: z.string().trim().max(2000).optional().nullable(),
  status: z.enum(["new", "contacted", "viewing_scheduled", "negotiating", "closed"]).default("new"),
  notes: z.string().trim().max(2000).optional().nullable(),
  last_contact_at: z.string().datetime().optional().nullable(),
});

const ClientResponse = z.object({
  id: z.string().uuid(),
  broker_id: z.string().uuid(),
  agency_id: z.string().uuid().nullable(),
  name: z.string(),
  phone: z.string().nullable(),
  client_type: z.string(),
  looking_for: z.string().nullable(),
  status: z.string(),
  notes: z.string().nullable(),
  last_contact_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

const selectFields = "id,broker_id,agency_id,name,phone,client_type,looking_for,status,notes,last_contact_at,created_at,updated_at";

export const Route = createFileRoute("/api/v1/clients")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await getApiSupabase(request);
        if ("response" in auth) return auth.response;
        const { data, error } = await auth.supabase
          .from("clients")
          .select(selectFields)
          .eq("broker_id", auth.userId)
          .order("updated_at", { ascending: false });
        if (error) return apiError(500, "DATABASE_ERROR", "Unable to read clients");
        return apiResponse({ items: data.map((client) => ClientResponse.parse(client)) });
      },
      POST: async ({ request }) => {
        const auth = await getApiSupabase(request);
        if ("response" in auth) return auth.response;
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return apiError(400, "VALIDATION_ERROR", "Request body must be valid JSON");
        }
        const parsed = ClientInput.safeParse(body);
        if (!parsed.success) return apiError(400, "VALIDATION_ERROR", "Invalid client payload");

        const { data, error } = await auth.supabase
          .from("clients")
          .insert({ ...parsed.data, broker_id: auth.userId })
          .select(selectFields)
          .single();
        if (error) return apiError(500, "DATABASE_ERROR", "Unable to create client");
        return apiResponse({ item: ClientResponse.parse(data) }, 201);
      },
    },
  },
});