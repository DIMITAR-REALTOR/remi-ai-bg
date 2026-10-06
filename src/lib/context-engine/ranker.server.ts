import type { ContextItem, UceContext } from "./uce.schema";

const KIND_PRIORITY: Record<ContextItem["kind"], number> = {
  deal: 1_000,
  client: 900,
  listing: 900,
  activity: 700,
  task: 600,
  other: 500,
  note: 400,
  market: 300,
  feedback: 800,
};

const FACTS_PRESENCE_BONUS = 0.001;
const CONTENT_PRESENCE_BONUS = 0.0001;
const METADATA_PRESENCE_BONUS = 0.00001;

function recencyScore(occurred_at: string | null | undefined): number {
  if (!occurred_at) return 0;
  const epochMs = Date.parse(occurred_at);
  if (Number.isNaN(epochMs)) return 0;
  return epochMs / 1e9;
}

export function scoreContextItem(item: ContextItem): number {
  const kindBase = KIND_PRIORITY[item.kind];
  const recency = recencyScore(item.occurred_at);
  const hasFacts = Object.keys(item.facts).length > 0 ? FACTS_PRESENCE_BONUS : 0;
  const hasContent = item.content.length > 0 ? CONTENT_PRESENCE_BONUS : 0;
  const hasMetadata = Object.keys(item.metadata).length > 0 ? METADATA_PRESENCE_BONUS : 0;

  return kindBase + recency + hasFacts + hasContent + hasMetadata;
}

export function rankContextItems(context: UceContext): ContextItem[] {
  return [...context.items].sort((a, b) => {
    const diff = scoreContextItem(b) - scoreContextItem(a);
    if (diff !== 0) return diff;
    return a.id.localeCompare(b.id);
  });
}
