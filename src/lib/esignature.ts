/**
 * REMI Electronic Signature — абстрактен слой за квалифициран електронен подпис (КЕП).
 *
 * СТАТУС: Архитектурно готов, БЕЗ активна интеграция. Изчаква API ключ от лицензиран
 * доставчик (напр. Evrotrust, econtract.bg, B-Trust). До тогава всички извиквания
 * връщат статус "not_configured" и не изпращат нищо никъде — не симулират подписване.
 *
 * КАК ДА СЕ АКТИВИРА (когато има API ключ):
 * 1. Добави ESIGNATURE_PROVIDER_API_KEY в environment variables (Lovable Cloud secrets)
 * 2. Замени тялото на requestSignature() с реален fetch към доставчика
 * 3. Замени тялото на checkSignatureStatus() с реален статус poll / webhook handler
 * 4. Провери провайдъровата документация за точния request/response формат
 *    (обикновено: upload на документ + данни за подписващия → връща request_id;
 *    отделен callback/webhook или poll endpoint за статус "signed"/"declined")
 */

export type SignatureProvider = "evrotrust" | "econtract_bg" | "btrust" | "pending_setup";

export type SignatureRequestInput = {
  contractId: string;
  partyRole: "seller" | "buyer";
  partyName: string;
  partyEmail?: string;
  partyPhone?: string;
  documentText: string;
};

export type SignatureRequestResult = {
  status: "sent" | "not_configured";
  providerRequestId: string | null;
  provider: SignatureProvider;
  message: string;
};

const PROVIDER_API_KEY = process.env.ESIGNATURE_PROVIDER_API_KEY ?? "";

/**
 * Изпраща документ за подпис на страна по договора.
 * Засега винаги връща "not_configured" — реалната интеграция чака API ключ.
 */
export async function requestSignature(input: SignatureRequestInput): Promise<SignatureRequestResult> {
  if (!PROVIDER_API_KEY) {
    return {
      status: "not_configured",
      providerRequestId: null,
      provider: "pending_setup",
      message: "Няма конфигуриран доставчик за електронен подпис. Добави ESIGNATURE_PROVIDER_API_KEY, за да активираш изпращането.",
    };
  }

  // TODO: реална интеграция след получаване на API ключ и документация от доставчика.
  // Примерна форма (адаптирай спрямо реалния API):
  //
  // const res = await fetch("https://api.<provider>.bg/v1/sign-requests", {
  //   method: "POST",
  //   headers: { "Authorization": `Bearer ${PROVIDER_API_KEY}`, "Content-Type": "application/json" },
  //   body: JSON.stringify({
  //     document: input.documentText,
  //     signer: { name: input.partyName, email: input.partyEmail, phone: input.partyPhone },
  //     callback_url: "https://remi-ai-bg.lovable.app/api/esignature-webhook",
  //   }),
  // });
  // const json = await res.json();
  // return { status: "sent", providerRequestId: json.request_id, provider: "evrotrust", message: "Изпратено за подпис." };

  return {
    status: "not_configured",
    providerRequestId: null,
    provider: "pending_setup",
    message: "Доставчикът е конфигуриран, но интеграцията все още не е свързана. Свържи се с Anthropic/Lovable поддръжка при нужда.",
  };
}

/**
 * Проверява статуса на вече изпратена заявка за подпис.
 * Засега винаги връща "not_configured".
 */
export async function checkSignatureStatus(providerRequestId: string): Promise<{ status: string; signedDocumentUrl: string | null }> {
  if (!PROVIDER_API_KEY || !providerRequestId) {
    return { status: "not_configured", signedDocumentUrl: null };
  }

  // TODO: реална проверка на статус след интеграция.
  // const res = await fetch(`https://api.<provider>.bg/v1/sign-requests/${providerRequestId}`, {
  //   headers: { "Authorization": `Bearer ${PROVIDER_API_KEY}` },
  // });
  // const json = await res.json();
  // return { status: json.status, signedDocumentUrl: json.signed_document_url ?? null };

  return { status: "not_configured", signedDocumentUrl: null };
}
