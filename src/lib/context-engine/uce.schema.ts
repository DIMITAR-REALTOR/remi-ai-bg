import { z } from "zod";

const JsonValue: z.ZodType<unknown> = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.lazy((): z.ZodType<unknown> => JsonValue)),
  z.record(
    z.string(),
    z.lazy((): z.ZodType<unknown> => JsonValue),
  ),
]);

export const ContextItemSchema = z
  .object({
    id: z.string().min(1),
    source: z.literal("supabase"),
    kind: z.enum([
      "deal",
      "client",
      "listing",
      "task",
      "activity",
      "market",
      "note",
      "other",
      "feedback",
    ]),
    entity_id: z.string().min(1).optional(),
    title: z.string().min(1).optional(),
    content: z.string().min(1),
    facts: z.record(z.string(), JsonValue),
    occurred_at: z.iso.datetime().nullable().optional(),
    metadata: z.record(z.string(), JsonValue),
  })
  .strict();

export const UceContextSchema = z
  .object({
    deal_id: z.string().min(1),
    collected_at: z.iso.datetime(),
    items: z.array(ContextItemSchema),
  })
  .strict();

export type ContextItem = z.infer<typeof ContextItemSchema>;
export type UceContext = z.infer<typeof UceContextSchema>;

export function parseContextItem(input: unknown): ContextItem {
  return ContextItemSchema.parse(input);
}

export function parseUceContext(input: unknown): UceContext {
  return UceContextSchema.parse(input);
}

export function safeParseContextItem(input: unknown) {
  return ContextItemSchema.safeParse(input);
}

export function safeParseUceContext(input: unknown) {
  return UceContextSchema.safeParse(input);
}
