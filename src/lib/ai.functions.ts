import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const Input = z.object({
  title: z.string().max(200).optional().default(""),
  property_type: z.string().max(50).optional().default(""),
  price_eur: z.number().optional(),
  area_sqm: z.number().optional(),
  rooms: z.number().optional(),
  floor: z.number().optional(),
  city: z.string().max(100).optional().default(""),
  neighborhood: z.string().max(100).optional().default(""),
  notes: z.string().max(500).optional().default(""),
});

export const generateListingDescription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY липсва");

    const details = [
      data.title && `Заглавие: ${data.title}`,
      data.property_type && `Тип: ${data.property_type}`,
      data.price_eur && `Цена: €${data.price_eur}`,
      data.area_sqm && `Площ: ${data.area_sqm} кв.м`,
      data.rooms && `Стаи: ${data.rooms}`,
      data.floor && `Етаж: ${data.floor}`,
      data.city && `Град: ${data.city}`,
      data.neighborhood && `Квартал: ${data.neighborhood}`,
      data.notes && `Бележки: ${data.notes}`,
    ].filter(Boolean).join("\n");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "Ти си REMI AI Marketing Layer – специализиран контекст на Единното AI ядро (One AI Kernel). Като професионален брокер в България, пишеш кратки, привлекателни описания на имоти на български език. Не използвай емоджи. Дължина: 80-130 думи. Подчертай локацията, площта, удобствата и потенциала. Не измисляй факти, които не са дадени.",
          },
          { role: "user", content: `Напиши описание за този имот:\n${details}` },
        ],
      }),
    });

    if (res.status === 429) throw new Error("Твърде много заявки. Опитай по-късно.");
    if (res.status === 402) throw new Error("Изчерпан AI кредит. Добави кредити в работното пространство.");
    if (!res.ok) throw new Error(`AI грешка: ${res.status}`);

    const json = await res.json();
    const text: string = json?.choices?.[0]?.message?.content ?? "";
    if (!text) throw new Error("Празен отговор от AI");
    return { description: text.trim() };
  });

const RiskInput = z.object({
  price_eur: z.number().min(0).max(100_000_000),
  location: z.string().min(1).max(200),
  construction_type: z.string().min(1).max(100),
  document_status: z.string().min(1).max(200),
  notes: z.string().max(1000).optional().default(""),
});

const RiskItem = z.object({ title: z.string(), explanation: z.string() });
const RiskOutput = z.object({
  score: z.number().min(1).max(10),
  risks: z.array(RiskItem).length(3),
  recommendation: z.string(),
});
export type DealRiskResult = z.infer<typeof RiskOutput>;

export const analyzeDealRisk = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => RiskInput.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY липсва");

    const details = [
      `Цена: €${data.price_eur}`,
      `Локация: ${data.location}`,
      `Тип строителство: ${data.construction_type}`,
      `Състояние на документите: ${data.document_status}`,
      data.notes && `Допълнителни бележки: ${data.notes}`,
    ].filter(Boolean).join("\n");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Ти си REMI AI Legal/Risk Layer – специализиран контекст на Единното AI ядро (One AI Kernel). Като експерт по оценка на риска в България, анализираш параметри и връщаш САМО валиден JSON със структура:\n{\n  \"score\": число 1-10,\n  \"risks\": масив с ТОЧНО 3 обекта (title, explanation),\n  \"recommendation\": препоръка на български\n}\nВсички текстове са на български език. Без емоджи.",
          },
          { role: "user", content: `Оцени риска на тази сделка:\n${details}` },
        ],
      }),
    });

    if (res.status === 429) throw new Error("Твърде много заявки. Опитай по-късно.");
    if (res.status === 402) throw new Error("Изчерпан AI кредит. Добави кредити в работното пространство.");
    if (!res.ok) throw new Error(`AI грешка: ${res.status}`);

    const json = await res.json();
    const text: string = json?.choices?.[0]?.message?.content ?? "";
    if (!text) throw new Error("Празен отговор от AI");

    let parsed: unknown;
    try {
      const clean = text.trim().replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      throw new Error("Невалиден отговор от AI");
    }
    return RiskOutput.parse(parsed);
  });

const MarketInput = z.object({
  location: z.string().min(1).max(200),
  property_type: z.string().min(1).max(100),
  price_eur: z.number().min(0).max(100_000_000),
  area_sqm: z.number().min(1).max(100_000),
});

const MarketOutput = z.object({
  score: z.number().min(1).max(10),
  summary: z.string(),
  pros: z.array(z.string()).min(2).max(4),
  cons: z.array(z.string()).min(2).max(4),
});
export type MarketScoreResult = z.infer<typeof MarketOutput>;

export const analyzeMarketScore = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => MarketInput.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY липсва");

    const pricePerSqm = Math.round(data.price_eur / data.area_sqm);
    const details = [
      `Локация: ${data.location}`,
      `Тип имот: ${data.property_type}`,
      `Цена: €${data.price_eur}`,
      `Площ: ${data.area_sqm} кв.м`,
      `Цена на кв.м: €${pricePerSqm}`,
    ].join("\n");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Ти си REMI AI Market Intelligence Layer – специализиран контекст на Единното AI ядро (One AI Kernel). Като пазарен експерт в България, оценяваш позиционирането на имота и връщаш САМО валиден JSON със структура:\n{\n  \"score\": число 1-10,\n  \"summary\": обобщение на български,\n  \"pros\": масив с предимства,\n  \"cons\": масив с недостатъци\n}\nБез емоджи, само на български.",
          },
          { role: "user", content: `Оцени пазарната позиция:\n${details}` },
        ],
      }),
    });

    if (res.status === 429) throw new Error("Твърде много заявки. Опитай по-късно.");
    if (res.status === 402) throw new Error("Изчерпан AI кредит.");
    if (!res.ok) throw new Error(`AI грешка: ${res.status}`);

    const json = await res.json();
    const text: string = json?.choices?.[0]?.message?.content ?? "";
    if (!text) throw new Error("Празен отговор от AI");
    let parsed: unknown;
    try {
      const clean = text.trim().replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      throw new Error("Невалиден отговор от AI");
    }
    return MarketOutput.parse(parsed);
  });

const MarketingInput = z.object({
  property_type: z.string().min(1).max(100),
  location: z.string().min(1).max(200),
  notes: z.string().max(1000).optional().default(""),
  channel: z.enum(["site", "facebook", "instagram", "flyer"]),
});

const CONTACT_BLOCK = `0889099118 – Димитър Ценов – REMI AI
remi.ai.bg@gmail.com
Когато посоката е вярна...!`;

const CHANNEL_GUIDE: Record<string, string> = {
  site: "Канал: Сайт за имоти. Професионален и стегнат тон, 80-130 думи. Без емотикони. Без хаштагове.",
  facebook: "Канал: Facebook пост. По-разговорен тон с подходящи емотикони. Ясен призив за действие. Завърши с 6-8 релевантни хаштага на нов ред.",
  instagram: "Канал: Instagram пост. Кратък, енергичен тон с емотикони. Завърши с 10-12 релевантни хаштага на нов ред.",
  flyer: "Канал: Печатен флаер. Кратък, стегнат, продаващ текст. Без емотикони. Без хаштагове.",
};

export const generateMarketingCopy = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => MarketingInput.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY липсва");

    const details = [
      `Тип имот: ${data.property_type}`,
      `Локация: ${data.location}`,
      data.notes && `Бележки: ${data.notes}`,
    ].filter(Boolean).join("\n");

    const system = `Ти си опитен копирайтър и брокер на недвижими имоти в България, комбинирано с юридическа коректност (не измисляй правни твърдения). Пиши ясно, убедително, човешки, с фокус върху реални ползи и доверие. Не измисляй факти, които не са дадени. Всички текстове са на български език (кирилица).

${CHANNEL_GUIDE[data.channel]}

ЗАДЪЛЖИТЕЛНО: Завърши текста ТОЧНО с този контактен блок на отделни редове, без промени, без добавени емотикони или форматиране:
${CONTACT_BLOCK}

Върни САМО валиден JSON без markdown със структура: { "body": "целият генериран текст, включително контактния блок в края" }`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: `Напиши маркетингов текст за този имот:\n${details}` },
        ],
      }),
    });

    if (res.status === 429) throw new Error("Твърде много заявки. Опитай по-късно.");
    if (res.status === 402) throw new Error("Изчерпан AI кредит. Добави кредити в работното пространство.");
    if (!res.ok) throw new Error(`AI грешка: ${res.status}`);

    const json = await res.json();
    const text: string = json?.choices?.[0]?.message?.content ?? "";
    if (!text) throw new Error("Празен отговор от AI");

    let body = "";
    try {
      const clean = text.trim().replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      const parsed = JSON.parse(clean);
      body = String(parsed?.body ?? "").trim();
    } catch {
      body = text.trim();
    }
    if (!body) throw new Error("Празен отговор от AI");

    // Ensure the contact block is present verbatim at the end.
    if (!body.includes(CONTACT_BLOCK)) {
      body = `${body}\n\n${CONTACT_BLOCK}`;
    }
    return { body };
  });

const STAGE_LABELS: Record<string, string> = {
  contact: "Контакт",
  viewing: "Оглед",
  offer: "Оферта",
  negotiation: "Преговори",
  notary: "Нотариален акт",
  closed: "Затворена",
};

const DealContextInput = z.object({
  deal_id: z.string().uuid(),
  stage: z.string().min(1).max(50),
  days_since_activity: z.number().min(0).max(3650),
  client_name: z.string().max(200).optional().default(""),
  listing_title: z.string().max(200).optional().default(""),
  commission_percent: z.number().optional(),
});

const DealContextOutput = z.object({
  reasoning: z.string(),
  next_action: z.string(),
});
export type DealContextResult = z.infer<typeof DealContextOutput>;

/**
 * REMI Core Engine — Reasoning Layer (Blueprint Гл. 7.6, AI CRM Decision Engine).
 * [Контекст] (етап + дни без активност) + [Правило] = [Действие].
 * Автоматичен анализ без ръчен вход на брокера — извиква се при зареждане на
 * страница "Сделки" за сделки с остарял или липсващ ai_context_summary.
 * Резултатът се записва в deals.ai_context_summary от извикващия route.
 */
export const analyzeDealContext = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => DealContextInput.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY липсва");

    const stageLabel = STAGE_LABELS[data.stage] ?? data.stage;
    const details = [
      `Етап на сделката: ${stageLabel}`,
      `Дни от последна промяна на етапа: ${data.days_since_activity}`,
      data.client_name && `Клиент: ${data.client_name}`,
      data.listing_title && `Имот: ${data.listing_title}`,
      data.commission_percent != null && `Комисиона: ${data.commission_percent}%`,
    ].filter(Boolean).join("\n");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Ти си REMI AI Reasoning Layer – специализиран контекст на Единното AI ядро (One AI Kernel). Анализираш защо сделка зацикля или какво е логичното следващо действие, на база етап и време без промяна. Прилагаш формулата [Контекст] + [Правило] = [Действие]. Връщаш САМО валиден JSON със структура:\n{\n  \"reasoning\": кратко обяснение защо сделката е в това състояние (1-2 изречения на български),\n  \"next_action\": конкретно, приложимо действие за брокера, обърнато лично към него (1 изречение на български, без общи съвети)\n}\nБез емоджи, само на български (кирилица). Не измисляй факти извън предоставените данни.",
          },
          { role: "user", content: `Анализирай тази сделка:\n${details}` },
        ],
      }),
    });

    if (res.status === 429) throw new Error("Твърде много заявки. Опитай по-късно.");
    if (res.status === 402) throw new Error("Изчерпан AI кредит. Добави кредити в работното пространство.");
    if (!res.ok) throw new Error(`AI грешка: ${res.status}`);

    const json = await res.json();
    const text: string = json?.choices?.[0]?.message?.content ?? "";
    if (!text) throw new Error("Празен отговор от AI");

    let parsed: unknown;
    try {
      const clean = text.trim().replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      throw new Error("Невалиден отговор от AI");
    }
    return DealContextOutput.parse(parsed);
  });

/**
 * REMI Core Engine — Legal Layer (Blueprint Гл. 7.4).
 * Gemini vision чете директно снимка/PDF на документ (по подписан URL от
 * bucket "legal-documents") и връща структуриран JSON по полетата, зададени
 * от извикващия route (виж src/lib/legal-meta.ts за схемите по тип документ).
 * Брокерът винаги преглежда/коригира резултата, преди да се запише (broker_confirmed).
 */
const LegalExtractInput = z.object({
  file_url: z.string().url(),
  document_type: z.string().min(1).max(50),
  field_keys: z.array(z.string()).min(1).max(20),
});

export const extractLegalDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => LegalExtractInput.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY липсва");

    const schemaHint = data.field_keys.map((k) => `"${k}": string`).join(",\n  ");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Ти си REMI AI Legal Layer – специализиран контекст на Единното AI ядро (One AI Kernel). Четеш снимка или PDF на български имотен документ и извличаш точно посочените полета. Връщаш САМО валиден JSON с точно тези ключове (стойност \"\" ако липсва на документа, без да измисляш):\n{\n  " +
              schemaHint +
              "\n}\nВсички стойности на български, без markdown, без допълнителен текст.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: `Извлечи данните от този документ (тип: ${data.document_type}).` },
              { type: "image_url", image_url: { url: data.file_url } },
            ],
          },
        ],
      }),
    });

    if (res.status === 429) throw new Error("Твърде много заявки. Опитай по-късно.");
    if (res.status === 402) throw new Error("Изчерпан AI кредит. Добави кредити в работното пространство.");
    if (!res.ok) throw new Error(`AI грешка: ${res.status}`);

    const json = await res.json();
    const text: string = json?.choices?.[0]?.message?.content ?? "";
    if (!text) throw new Error("Празен отговор от AI");

    let parsed: Record<string, unknown>;
    try {
      const clean = text.trim().replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      throw new Error("Невалиден отговор от AI");
    }

    const out: Record<string, string> = {};
    for (const k of data.field_keys) out[k] = String(parsed[k] ?? "");
    return { fields: out };
  });

/** Документ за самоличност — OCR опция (основният път остава ръчно въвеждане). */
const IdentityExtractInput = z.object({ file_url: z.string().url() });

export const extractIdentityDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => IdentityExtractInput.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY липсва");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Четеш снимка на българска лична карта. Връщаш САМО валиден JSON:\n{\n  \"full_name\": string,\n  \"egn\": string,\n  \"document_number\": string,\n  \"valid_until\": string\n}\nСтойност \"\" ако полето липсва. Без markdown.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Извлечи данните от личната карта." },
              { type: "image_url", image_url: { url: data.file_url } },
            ],
          },
        ],
      }),
    });

    if (res.status === 429) throw new Error("Твърде много заявки. Опитай по-късно.");
    if (res.status === 402) throw new Error("Изчерпан AI кредит. Добави кредити в работното пространство.");
    if (!res.ok) throw new Error(`AI грешка: ${res.status}`);

    const json = await res.json();
    const text: string = json?.choices?.[0]?.message?.content ?? "";
    if (!text) throw new Error("Празен отговор от AI");
    let parsed: unknown;
    try {
      const clean = text.trim().replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      throw new Error("Невалиден отговор от AI");
    }
    const IdentityOut = z.object({
      full_name: z.string().optional().default(""),
      egn: z.string().optional().default(""),
      document_number: z.string().optional().default(""),
      valid_until: z.string().optional().default(""),
    });
    return IdentityOut.parse(parsed);
  });

const CompareItem = z.object({
  label: z.string().min(1).max(100),
  property_type: z.string().min(1).max(100),
  location: z.string().min(1).max(200),
  price_eur: z.number().min(0).max(100_000_000),
  area_sqm: z.number().min(1).max(100_000),
  rooms: z.number().optional(),
  floor: z.number().optional(),
  source: z.string().min(1).max(100),
});

const CompareInput = z.object({
  items: z.array(CompareItem).min(2).max(3),
});

const ComparePropertyOut = z.object({
  label: z.string(),
  pros: z.array(z.string()).min(2).max(3),
  cons: z.array(z.string()).min(2).max(3),
});
const CompareOutput = z.object({
  summary: z.string(),
  properties: z.array(ComparePropertyOut).min(2).max(3),
});
export type CompareResult = z.infer<typeof CompareOutput>;

export const compareProperties = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => CompareInput.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY липсва");

    const details = data.items
      .map((it, i) => {
        const ppsqm = Math.round(it.price_eur / it.area_sqm);
        return [
          `Имот ${i + 1} — ${it.label}`,
          `  Тип: ${it.property_type}`,
          `  Локация: ${it.location}`,
          `  Цена: €${it.price_eur}`,
          `  Площ: ${it.area_sqm} кв.м`,
          `  €/кв.м: €${ppsqm}`,
          it.rooms != null ? `  Стаи: ${it.rooms}` : "",
          it.floor != null ? `  Етаж: ${it.floor}` : "",
          `  Източник: ${it.source}`,
        ].filter(Boolean).join("\n");
      })
      .join("\n\n");

    const labels = data.items.map((i) => i.label).join(", ");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              `Ти си експерт по недвижими имоти в България, който обективно сравнява имоти по цена, локация, площ и съотношение цена/пазар. Не измисляй факти извън предоставените данни. Връщаш САМО валиден JSON без markdown със структура:\n{\n  "summary": кратко обобщение 2-4 изречения на български кой имот е по-добра оферта и защо,\n  "properties": масив с обект за всеки имот в СЪЩИЯ ред и със СЪЩИТЕ label стойности (${labels}), всеки обект: { "label": string, "pros": 2-3 кратки предимства, "cons": 2-3 кратки недостатъци }\n}\nБез емоджи, само на български (кирилица).`,
          },
          { role: "user", content: `Сравни следните имоти:\n\n${details}` },
        ],
      }),
    });

    if (res.status === 429) throw new Error("Твърде много заявки. Опитай по-късно.");
    if (res.status === 402) throw new Error("Изчерпан AI кредит. Добави кредити в работното пространство.");
    if (!res.ok) throw new Error(`AI грешка: ${res.status}`);

    const json = await res.json();
    const text: string = json?.choices?.[0]?.message?.content ?? "";
    if (!text) throw new Error("Празен отговор от AI");
    let parsed: unknown;
    try {
      const clean = text.trim().replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      throw new Error("Невалиден отговор от AI");
    }
    return CompareOutput.parse(parsed);
  });

