import type { ContextItem } from "./uce.schema";

export type FeedbackType = "accept" | "reject";

export interface FeedbackContext {
  feedbackType: FeedbackType;
  recommendation: {
    reasoning: string;
    next_action: string;
  };
  dealId: string;
  traceId: string;
  tenantId?: string;
  brokerId: string;
  timestamp: string;
}

export function createFeedbackContextItem(feedback: FeedbackContext): ContextItem {
  const feedbackTypeLabel = feedback.feedbackType === "accept" ? "Прието" : "Отхвърлено";
  const id = `feedback:${feedback.dealId}:${feedback.timestamp}:${feedback.feedbackType}`;

  return {
    id,
    source: "supabase",
    kind: "feedback",
    entity_id: feedback.dealId,
    title: `Feedback: ${feedbackTypeLabel}`,
    content: `Брокер ${feedback.feedbackType === "accept" ? "потвърди" : "отхвърли"} препоръката: "${feedback.recommendation.next_action}".`,
    facts: {
      feedback_type: feedback.feedbackType,
      recommendation: feedback.recommendation,
      deal_id: feedback.dealId,
      trace_id: feedback.traceId,
      tenant_id: feedback.tenantId ?? null,
      broker_id: feedback.brokerId,
    },
    occurred_at: feedback.timestamp,
    metadata: {
      table: "feedback",
      feedback_source: "action_center",
    },
  };
}

export function extractFeedbackFromActionHistory(
  actionHistory: Array<{
    reasoning: string;
    next_action: string;
    status?: string;
    created_at: string;
    updated_at?: string;
    trace_id?: string;
  }>,
  dealId: string,
  brokerId: string,
): ContextItem[] {
  const feedbackItems: ContextItem[] = [];

  for (const entry of actionHistory) {
    if (entry.status === "confirmed" || entry.status === "dismissed") {
      const feedbackType: "accept" | "reject" = entry.status === "confirmed" ? "accept" : "reject";
      const timestamp = entry.updated_at ?? entry.created_at;
      const traceId = entry.trace_id;

      if (!traceId) continue;

      feedbackItems.push(
        createFeedbackContextItem({
          feedbackType: entry.status === "confirmed" ? "accept" : "reject",
          recommendation: {
            reasoning: entry.reasoning,
            next_action: entry.next_action,
          },
          dealId: dealId,
          traceId: entry.trace_id!,
          tenantId: undefined,
          brokerId: "",
          timestamp: entry.updated_at ?? entry.created_at,
        }),
      );
    }
  }

  return feedbackItems;
}

export function generateTraceId(): string {
  return crypto.randomUUID();
}

export function extractTenantId(claims: Record<string, unknown>): string | undefined {
  return (claims["agency_id"] as string) ?? undefined;
}

export function measureLatency<T>(
  startTime: number,
  operation: () => Promise<T>,
): Promise<{ result: T; latencyMs: number }> {
  return operation().then((result) => ({
    result,
    latencyMs: Date.now() - startTime,
  }));
}
