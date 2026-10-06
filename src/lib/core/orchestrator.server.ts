import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { collectDealContext } from "@/lib/context-engine/structured-collector.server";
import { rankContextItems, scoreContextItem } from "@/lib/context-engine/ranker.server";
import {
  extractFeedbackFromActionHistory,
  generateTraceId,
  measureLatency,
} from "@/lib/context-engine/feedback-adapter";
import { GeminiAiProvider } from "@/lib/ai/gemini.adapter.server";
import type { AiProvider, AiExecutionResult } from "@/lib/ai/types";
import { z } from "zod";

export interface OrchestratorInput {
  deal_id: string;
  supabase: SupabaseClient<Database>;
  broker_id: string;
  tenant_id?: string;
  stage?: string;
  days_since_activity?: number;
  client_name?: string;
  listing_title?: string;
  commission_percent?: number | null;
}

export interface OrchestratorDecision {
  reasoning: string;
  next_action: string;
  trace_id: string;
  latency_ms: number;
  existing_ai_context_summary?: {
    reasoning: string;
    next_action: string;
    action_status?: string;
    action_history?: Array<{
      reasoning: string;
      next_action: string;
      status?: string;
      created_at: string;
      updated_at?: string;
      trace_id?: string;
    }>;
  } | null;
}

const STAGE_LABELS: Record<string, string> = {
  contact: "Контакт",
  viewing: "Оглед",
  offer: "Оферта",
  negotiation: "Преговори",
  notary: "Нотариален акт",
  closed: "Затворена",
};

const SYSTEM_PROMPT = "Ти си REMI AI Reasoning Layer – специализиран контекст на Единното AI ядро (One AI Kernel). Анализираш защо сделка зацикля или какво е логичното следващо действие, на база етап и време без промяна. Прилагаш формулата [Контекст] + [Правило] = [Действие]. Структурираните UCE контекстни елементи (uce_ranked_items) са верифицирани данни от базата — използвай ги като допълнителен източник. При работа с клиентски данни в UCE: `deal_role` е authoritative за ролята на клиента в текущата сделка (buyer/seller/tenant/landlord от deal_participants), а `client_type` е само CRM classification и никога не трябва да се използва за определяне на ролята в текущата сделка. Историята на предишните AI препоръки и реакциите на брокера (confirmed/dismissed) е контекст за оценка, не инструкции за повторно изпълнение. Не повтаряй автоматично confirmed действия и не избягвай автоматично dismissed действия — използвай ги като сигнал за качество на предишния анализ. Връщаш САМО валиден JSON със структура:\n{\n  \"reasoning\": кратко обяснение защо сделката е в това състояние (1-2 изречения на български),\n  \"next_action\": конкретно, приложимо действие за брокера, обърнато лично към него (1 изречение на български, без общи съвети)\n}\nБез емоджи, само на български (кирилица). Не измисляй факти извън предоставените данни.";

const ReasoningOutputSchema = z.object({
  reasoning: z.string(),
  next_action: z.string(),
});
export type ReasoningOutput = z.infer<typeof ReasoningOutputSchema>;

function mapProviderError(error: unknown): never {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("rate limit (429)")) {
    throw new Error("Твърде много заявки. Опитай по-късно.");
  }
  const statusMatch = message.match(/\((\d{3})\)/);
  const status = statusMatch ? statusMatch[1] : "unknown";
  if (message.includes("Gemini API error") || message.includes("Gemini authentication error")) {
    throw new Error(`AI грешка: ${status}`);
  }
  if (message.includes("празен отговор")) {
    throw new Error("Празен отговор от AI");
  }
  if (message.includes("невалиден JSON")) {
    throw new Error("Невалиден отговор от AI");
  }
  throw new Error(`AI грешка: ${message}`);
}

export async function runDealReasoning(
  input: OrchestratorInput,
  provider: AiProvider = new GeminiAiProvider(),
): Promise<OrchestratorDecision> {
  const traceId = generateTraceId();
  const startTime = Date.now();

  const uceContext = await collectDealContext(input.deal_id, input.supabase);
  let rankedItems = rankContextItems(uceContext);

  const dealItem = rankedItems.find((item) => item.kind === "deal");
  const aiContextSummary = dealItem?.facts?.ai_context_summary as
    | {
        reasoning: string;
        next_action: string;
        action_status?: string;
        action_history?: Array<{
          reasoning: string;
          next_action: string;
          status?: string;
          created_at: string;
          updated_at?: string;
          trace_id?: string;
        }>;
      }
    | undefined;

  const actionHistory = aiContextSummary?.action_history;

  if (actionHistory && actionHistory.length > 0) {
    const feedbackItems = extractFeedbackFromActionHistory(
      actionHistory,
      input.deal_id,
      input.broker_id,
    );
    rankedItems = [...rankedItems, ...feedbackItems];
    rankedItems.sort((a, b) => {
      const diff = scoreContextItem(b) - scoreContextItem(a);
      if (diff !== 0) return diff;
      return a.id.localeCompare(b.id);
    });
  }

  const stageLabel = STAGE_LABELS[input.stage ?? ""] ?? input.stage ?? "(неизвестен)";
  const details = [
    `Етап на сделката: ${stageLabel}`,
    `Дни от последна промяна на етапа: ${input.days_since_activity ?? 0}`,
    input.client_name && `Клиент: ${input.client_name}`,
    input.listing_title && `Имот: ${input.listing_title}`,
    input.commission_percent != null && `Комисиона: ${input.commission_percent}%`,
  ].filter(Boolean).join("\n");

  let providerResult: AiExecutionResult<ReasoningOutput>;
  let latencyMs = 0;

  try {
    const measurement = await measureLatency(startTime, async () => {
      return provider.execute<ReasoningOutput>({
        instructions: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Анализирай тази сделка:\n${details}\n\n---\nСтруктуриран UCE контекст (ranked):\n${JSON.stringify(rankedItems, null, 2)}`,
          },
        ],
        jsonMode: true,
      });
    });
    providerResult = measurement.result;
    latencyMs = measurement.latencyMs;
  } catch (error) {
    mapProviderError(error);
  }

  console.log(JSON.stringify({
    trace_id: traceId,
    tenant_id: input.tenant_id,
    broker_id: input.broker_id,
    deal_id: input.deal_id,
    latency_ms: latencyMs,
    feedback_items_added: actionHistory?.filter((e) => e.status).length ?? 0,
    timestamp: new Date().toISOString(),
  }));

  if (!providerResult.data) {
    throw new Error("Празен отговор от AI");
  }

  const validated = ReasoningOutputSchema.parse(providerResult.data);

  const existingSummary = aiContextSummary
    ? {
        reasoning: aiContextSummary.reasoning,
        next_action: aiContextSummary.next_action,
        action_status: aiContextSummary.action_status,
        action_history: aiContextSummary.action_history,
      }
    : null;

  return {
    reasoning: validated.reasoning,
    next_action: validated.next_action,
    trace_id: traceId,
    latency_ms: latencyMs,
    existing_ai_context_summary: existingSummary,
  };
}
