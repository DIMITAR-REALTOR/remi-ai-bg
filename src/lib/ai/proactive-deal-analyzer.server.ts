import type { AiProvider } from "./types";
import { GeminiAiProvider } from "./gemini.adapter.server";

export type DealStage = "contact" | "viewing" | "offer" | "negotiation" | "notary" | "closed";

export interface DealRelatedTaskContext {
  title: string;
  completed: boolean;
  due_at?: string | null;
  updated_at?: string | null;
  notes?: string | null;
}

export interface DealContextData {
  deal_id: string;
  stage: DealStage | string;
  days_since_activity: number;
  client_name?: string | null;
  client_phone?: string | null;
  listing_title?: string | null;
  listing_price_eur?: number | null;
  commission_percent?: number | null;
  related_tasks?: DealRelatedTaskContext[];
  notes?: string | null;
}

export interface ProactiveDealDecision {
  /** Наблюдение: какво открива REMI в контекста на сделката */
  observation: string;
  /** Анализ / Причина: защо това е важно, какъв е рискът от забавяне */
  reasoning: string;
  /** Предложено следващо действие за брокера */
  next_action: string;
  /** Дали контекстът изисква реална задача/действие в момента */
  actionable: boolean;
  /** Кратко заглавие за нова задача, съвместимо с TaskForm */
  suggested_task_title?: string;
  /** Ниво на приоритет/спешност */
  urgency: "low" | "medium" | "high";
}

const PROACTIVE_DEAL_REASONING_INSTRUCTIONS = `Ти си REMI AI Reasoning Layer – проактивното ядро за вземане на решения в REMI CRM за недвижими имоти.
Твоята роля НЕ е да отговаряш на въпроси от потребител, а самостоятелно да анализираш вътрешния контекст на сделка по формулата:
[Контекст] + [Правило] = [Действие]

Принципи за анализ:
1. Анализирай фактите от подадения контекст:
   - етап на сделката (contact, viewing, offer, negotiation, notary)
   - дни от последна активност или промяна на етапа
   - клиент и имот
   - свързани задачи и огледи (завършени и предстоящи)
2. Открий какво е важно:
   - Има ли застой (напр. над 5 дни без действие след оглед)?
   - Липсва ли насрочена следваща стъпка?
   - Има ли риск клиентът да се демотивира или имотът да бъде продаден на друг?
   - Какво е най-точното следващо оперативно действие за брокера?
3. Върни САМО валиден JSON обект със следните полета:
   - "observation": какво виждаш в контекста (1 кратко изречение на български)
   - "reasoning": защо това е важно / какъв е рискът (1-2 изречения на български)
   - "next_action": конкретно, практично действие за брокера, започващо с глагол (1 изречение)
   - "actionable": true ако се изисква реално действие от брокера; false ако сделката се развива нормално или няма достатъчно данни
   - "suggested_task_title": кратко заглавие за задача (напр. "Обаждане за обратна връзка от оглед")
   - "urgency": "low" | "medium" | "high"
4. Изисквания:
   - Без емоджи
   - Само на български език (кирилица)
   - Без измислени факти извън подадения контекст
   - Тонът да е професионален и ориентиран към действие`;

/**
 * Проактивен анализ на сделка (Stale Deal Action Reasoning Workflow).
 * Извиква се автоматично при установяване на промяна или застой в сделка,
 * без да изисква потребителски prompt.
 */
export async function analyzeDealProactively(
  dealContext: DealContextData,
  provider: AiProvider = new GeminiAiProvider()
): Promise<ProactiveDealDecision> {
  const result = await provider.execute<ProactiveDealDecision>({
    instructions: PROACTIVE_DEAL_REASONING_INSTRUCTIONS,
    context: dealContext as unknown as Record<string, unknown>,
    jsonMode: true,
    temperature: 0.2,
  });

  if (!result.data) {
    throw new Error("REMI Proactive Deal Analyzer: липсва структуриран JSON отговор от модела.");
  }

  return result.data;
}

