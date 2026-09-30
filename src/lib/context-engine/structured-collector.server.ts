import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { parseContextItem, parseUceContext } from "./uce.schema";
import type { ContextItem, UceContext } from "./uce.schema";

type DealRow = Database["public"]["Tables"]["deals"]["Row"];
type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
type ListingRow = Database["public"]["Tables"]["listings"]["Row"];
type DealStageHistoryRow = Database["public"]["Tables"]["deal_stage_history"]["Row"];
type DealParticipantRow = Database["public"]["Tables"]["deal_participants"]["Row"];
type LegalDocumentRow = Database["public"]["Tables"]["legal_documents"]["Row"];
type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];

function jsonSafe<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function toContextItem(
  id: string,
  kind: ContextItem["kind"],
  title: string,
  content: string,
  facts: Record<string, unknown>,
  occurredAt: string | null | undefined,
  metadata: Record<string, unknown> = {},
): ContextItem {
  const item: unknown = {
    id,
    source: "supabase",
    kind,
    title,
    content,
    facts: jsonSafe(facts),
    occurred_at: occurredAt ?? null,
    metadata: jsonSafe(metadata),
  };
  return parseContextItem(item);
}

export async function collectDealContext(
  dealId: string,
  supabase: SupabaseClient<Database>,
): Promise<UceContext> {
  const { data: deal, error: dealError } = await supabase
    .from("deals")
    .select("*")
    .eq("id", dealId)
    .single();

  if (dealError || !deal) {
    throw new Error(`Deal ${dealId} not found: ${dealError?.message ?? "no data returned"}`);
  }

  const items: ContextItem[] = [];

  const dealOccuredAt = deal.last_activity_at ?? deal.created_at ?? null;
  items.push(
    toContextItem(
      `deal:${deal.id}`,
      "deal",
      `Deal ${deal.id} — ${deal.transaction_type}`,
      `Deal ${deal.id} in stage "${deal.stage}", status "${deal.status}", transaction type "${deal.transaction_type}", broker "${deal.broker_id}".`,
      {
        id: deal.id,
        stage: deal.stage,
        status: deal.status,
        transaction_type: deal.transaction_type,
        broker_id: deal.broker_id,
        client_id: deal.client_id,
        crm_client_id: deal.crm_client_id,
        listing_id: deal.listing_id,
        commission_percent: deal.commission_percent,
        closed_at: deal.closed_at,
        created_at: deal.created_at,
        last_activity_at: deal.last_activity_at,
        ai_context_summary: deal.ai_context_summary,
      },
      dealOccuredAt,
      { table: "deals" },
    ),
  );

  if (deal.crm_client_id) {
    const { data: client } = await supabase
      .from("clients")
      .select("*")
      .eq("id", deal.crm_client_id)
      .single();

    if (client) {
      const clientOccuredAt =
        (client as ClientRow).last_contact_at ?? (client as ClientRow).created_at ?? null;
      items.push(
        toContextItem(
          `client:${client.id}`,
          "client",
          `Client ${client.name}`,
          `Client "${client.name}" — type "${client.client_type}", status "${client.status}"${client.phone ? `, phone "${client.phone}"` : ""}.`,
          {
            id: client.id,
            name: client.name,
            client_type: client.client_type,
            status: client.status,
            phone: client.phone,
            notes: client.notes,
            looking_for: client.looking_for,
            marital_status: client.marital_status,
            broker_id: client.broker_id,
            agency_id: client.agency_id,
            source_post_id: client.source_post_id,
            last_contact_at: client.last_contact_at,
            created_at: client.created_at,
            updated_at: client.updated_at,
          },
          clientOccuredAt,
          { table: "clients" },
        ),
      );
    }
  }

  if (deal.listing_id) {
    const { data: listing } = await supabase
      .from("listings")
      .select("*")
      .eq("id", deal.listing_id)
      .single();

    if (listing) {
      const listingOccuredAt = listing.created_at;
      items.push(
        toContextItem(
          `listing:${listing.id}`,
          "listing",
          `Listing ${listing.title}`,
          `Listing "${listing.title}" — property type "${listing.property_type}", price €${listing.price_eur.toLocaleString()}${listing.city ? `, ${listing.city}` : ""}${listing.neighborhood ? `, ${listing.neighborhood}` : ""}.`,
          {
            id: listing.id,
            title: listing.title,
            price_eur: listing.price_eur,
            area_sqm: listing.area_sqm,
            rooms: listing.rooms,
            floor: listing.floor,
            property_type: listing.property_type,
            city: listing.city,
            neighborhood: listing.neighborhood,
            description: listing.description,
            status: listing.status,
            photos: listing.photos,
            ref_number: listing.ref_number,
            broker_id: listing.broker_id,
            created_at: listing.created_at,
            updated_at: listing.updated_at,
          },
          listingOccuredAt,
          { table: "listings" },
        ),
      );
    }
  }

  const { data: stageHistory } = await supabase
    .from("deal_stage_history")
    .select("*")
    .eq("deal_id", dealId)
    .order("changed_at", { ascending: false });

  if (stageHistory) {
    for (const entry of stageHistory as DealStageHistoryRow[]) {
      const from = entry.from_stage ?? "(initial)";
      items.push(
        toContextItem(
          `stage:${entry.id}`,
          "activity",
          `Stage transition: ${from} → ${entry.to_stage}`,
          `Stage changed from "${from}" to "${entry.to_stage}" at ${entry.changed_at}.`,
          {
            id: entry.id,
            deal_id: entry.deal_id,
            from_stage: entry.from_stage,
            to_stage: entry.to_stage,
            changed_at: entry.changed_at,
            changed_by: entry.changed_by,
            broker_id: entry.broker_id,
          },
          entry.changed_at,
          { table: "deal_stage_history" },
        ),
      );
    }
  }

  const { data: participants } = await supabase
    .from("deal_participants")
    .select("*")
    .eq("deal_id", dealId);

  if (participants) {
    for (const participant of participants as DealParticipantRow[]) {
      items.push(
        toContextItem(
          `participant:${participant.id}`,
          "other",
          `Participant: ${participant.role}`,
          `Participant with role "${participant.role}" (client_id: ${participant.client_id}) joined the deal.`,
          {
            id: participant.id,
            deal_id: participant.deal_id,
            client_id: participant.client_id,
            role: participant.role,
            created_at: participant.created_at,
          },
          participant.created_at,
          { table: "deal_participants" },
        ),
      );
    }
  }

  const { data: legalDocs } = await supabase
    .from("legal_documents")
    .select("*")
    .eq("deal_id", dealId);

  if (legalDocs) {
    for (const doc of legalDocs as LegalDocumentRow[]) {
      items.push(
        toContextItem(
          `legal:${doc.id}`,
          "other",
          `Legal: ${doc.document_type}${doc.document_subtype ? ` (${doc.document_subtype})` : ""}`,
          `Legal document "${doc.document_type}"${doc.document_subtype ? ` (subtype: ${doc.document_subtype})` : ""} — availability "${doc.availability_status}", broker confirmed: ${doc.broker_confirmed}.`,
          {
            id: doc.id,
            deal_id: doc.deal_id,
            listing_id: doc.listing_id,
            document_type: doc.document_type,
            document_subtype: doc.document_subtype,
            availability_status: doc.availability_status,
            broker_confirmed: doc.broker_confirmed,
            broker_notes: doc.broker_notes,
            file_path: doc.file_path,
            extracted_data: doc.extracted_data,
            broker_id: doc.broker_id,
            created_at: doc.created_at,
            updated_at: doc.updated_at,
          },
          doc.created_at,
          { table: "legal_documents" },
        ),
      );
    }
  }

  const seenTaskIds = new Set<string>();
  const tasks: TaskRow[] = [];

  if (deal.crm_client_id) {
    const { data: clientTasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("client_id", deal.crm_client_id);

    if (clientTasks) {
      for (const task of clientTasks as TaskRow[]) {
        if (!seenTaskIds.has(task.id)) {
          seenTaskIds.add(task.id);
          tasks.push(task);
        }
      }
    }
  }

  if (deal.listing_id) {
    const { data: listingTasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("listing_id", deal.listing_id);

    if (listingTasks) {
      for (const task of listingTasks as TaskRow[]) {
        if (!seenTaskIds.has(task.id)) {
          seenTaskIds.add(task.id);
          tasks.push(task);
        }
      }
    }
  }

  for (const task of tasks) {
    const statusLabel = task.completed ? "completed" : "open";
    items.push(
      toContextItem(
        `task:${task.id}`,
        "task",
        task.title,
        `Task: "${task.title}" — ${statusLabel}, due ${task.due_at}.`,
        {
          id: task.id,
          title: task.title,
          completed: task.completed,
          due_at: task.due_at,
          notes: task.notes,
          client_id: task.client_id,
          listing_id: task.listing_id,
          broker_id: task.broker_id,
          created_at: task.created_at,
          updated_at: task.updated_at,
        },
        task.created_at,
        { table: "tasks" },
      ),
    );
  }

  const context: unknown = {
    deal_id: dealId,
    collected_at: new Date().toISOString(),
    items,
  };

  return parseUceContext(context);
}
