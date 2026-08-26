import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { requestSignature, checkSignatureStatus } from "@/lib/esignature";

const RequestSignInput = z.object({
  contractId: z.string().uuid(),
  partyRole: z.enum(["seller", "buyer"]),
  partyName: z.string().min(1).max(200),
  partyEmail: z.string().email().optional().or(z.literal("")),
  partyPhone: z.string().max(50).optional().default(""),
  documentText: z.string().min(1),
});

/** Изпраща документ за електронен подпис (КЕП) — засега връща "not_configured" до наличен API ключ. */
export const requestContractSignature = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => RequestSignInput.parse(d))
  .handler(async ({ data }) => {
    return requestSignature({
      contractId: data.contractId,
      partyRole: data.partyRole,
      partyName: data.partyName,
      partyEmail: data.partyEmail || undefined,
      partyPhone: data.partyPhone || undefined,
      documentText: data.documentText,
    });
  });

const CheckSignInput = z.object({ providerRequestId: z.string().min(1) });

export const checkContractSignatureStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CheckSignInput.parse(d))
  .handler(async ({ data }) => checkSignatureStatus(data.providerRequestId));
