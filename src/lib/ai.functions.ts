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
              "Ти си професионален брокер на недвижими имоти в България. Пишеш кратки, привлекателни описания на имоти на български език (кирилица). Не използвай емоджи. Дължина: 80-130 думи. Подчертай локацията, площта, удобствата и потенциала. Не измисляй факти, които не са дадени.",
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
