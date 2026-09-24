export type AiRole = "system" | "user" | "assistant";

export interface AiChatMessage {
  role: AiRole;
  content: string;
}

/**
 * Core execution input for REMI AI Provider Layer.
 * Supports:
 * 1. Proactive context-driven execution: [Context] + [Rule/Instructions] = [Decision/Action]
 *    (Triggered by CRM events, stuck deals, task delays, risk flags, without a human prompt)
 * 2. Interactive text generation: (Triggered by user actions/forms)
 * 3. Multi-turn dialogue / chat: (When conversational interface is needed)
 */
export interface AiExecutionInput {
  /**
   * The rule, behavior, or domain layer instructions (REMI Reasoning, Legal, Communication, Market layer).
   * Maps to system instructions in the model.
   */
  instructions?: string;

  /**
   * Domain context data (e.g. deal, client, property, tasks, viewing logs, market metrics).
   * Can be passed as a structured object or serialized string.
   */
  context?: Record<string, unknown> | string;

  /**
   * Optional direct interactive prompt or task description (if initiated by a user/action).
   */
  prompt?: string;

  /**
   * Optional multi-turn message history for conversational features.
   */
  messages?: AiChatMessage[];

  /**
   * Enable structured JSON mode. When true, the model is guaranteed to output valid JSON.
   */
  jsonMode?: boolean;

  /**
   * Optional JSON schema defining the expected structure of the output.
   */
  responseSchema?: Record<string, unknown>;

  /**
   * Sampling temperature (e.g. 0.2 for deterministic reasoning, 0.7 for marketing texts).
   */
  temperature?: number;

  /**
   * Maximum output tokens.
   */
  maxTokens?: number;
}

/**
 * Result of an AI execution.
 */
export interface AiExecutionResult<T = unknown> {
  /** Raw text response from the model */
  text: string;
  /** Parsed structured JSON data (when jsonMode or responseSchema is used) */
  data?: T;
  /** Provider identifier (e.g. 'gemini') */
  provider: "gemini" | string;
  /** Model identifier (e.g. 'gemini-3-flash-preview') */
  model: string;
}

/**
 * Central AI Provider contract.
 * Designed for both proactive system execution and interactive generation.
 */
export interface AiProvider {
  /**
   * Execute an AI reasoning or generation task against the underlying LLM provider.
   * Can be invoked proactively by REMI Context/Reasoning Engine or interactively by product features.
   */
  execute<T = unknown>(input: AiExecutionInput): Promise<AiExecutionResult<T>>;

  /**
   * Convenience helper for text-only generation.
   */
  generateText(input: AiExecutionInput): Promise<AiExecutionResult<string>>;
}
