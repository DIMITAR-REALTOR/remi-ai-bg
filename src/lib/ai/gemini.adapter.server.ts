import type {
  AiChatMessage,
  AiExecutionInput,
  AiExecutionResult,
  AiProvider,
} from "./types";

const DEFAULT_MODEL = "gemini-3-flash-preview";
const GEMINI_API_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

export class GeminiAiProvider implements AiProvider {
  private readonly apiKey: string;
  private readonly model: string;

  constructor() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY липсва в конфигурацията на средата.");
    }
    this.apiKey = key;
    this.model = process.env.GEMINI_MODEL ?? DEFAULT_MODEL;
  }

  /**
   * Execute an AI task. Supports proactive context execution ([Context] + [Rule] = [Action])
   * as well as interactive prompts and multi-turn chat.
   */
  async execute<T = unknown>(input: AiExecutionInput): Promise<AiExecutionResult<T>> {
    const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

    // 1. Format Context if provided
    let contextText = "";
    if (input.context) {
      contextText =
        typeof input.context === "string"
          ? input.context.trim()
          : JSON.stringify(input.context, null, 2);
    }

    // 2. Build model contents
    if (input.messages && input.messages.length > 0) {
      for (const msg of input.messages) {
        if (msg.role === "system") {
          if (!input.instructions) {
            input.instructions = msg.content;
          }
          continue;
        }
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        });
      }
    } else if (contextText && input.prompt) {
      // Both context and interactive prompt provided
      contents.push({
        role: "user",
        parts: [{ text: `Вътрешен REMI Контекст:\n${contextText}\n\nЗаявка:\n${input.prompt}` }],
      });
    } else if (contextText) {
      // Proactive execution: Pure context without user prompt ([Context] + [Rule] = [Action])
      contents.push({
        role: "user",
        parts: [{ text: `Вътрешен REMI Контекст:\n${contextText}` }],
      });
    } else if (input.prompt) {
      contents.push({
        role: "user",
        parts: [{ text: input.prompt }],
      });
    }

    if (contents.length === 0) {
      throw new Error("Няма подаден контекст, prompt или съобщения към GeminiAiProvider.");
    }

    const payload: Record<string, unknown> = {
      contents,
    };

    // 3. System Instructions (Rule / Domain Layer)
    if (input.instructions) {
      payload.system_instruction = {
        parts: [{ text: input.instructions }],
      };
    }

    // 4. Generation Config (temperature, jsonMode, schema, maxTokens)
    const generationConfig: Record<string, unknown> = {};

    if (typeof input.temperature === "number") {
      generationConfig.temperature = input.temperature;
    }
    if (typeof input.maxTokens === "number") {
      generationConfig.maxOutputTokens = input.maxTokens;
    }
    if (input.jsonMode || input.responseSchema) {
      generationConfig.responseMimeType = "application/json";
    }
    if (input.responseSchema) {
      generationConfig.responseSchema = input.responseSchema;
    }

    if (Object.keys(generationConfig).length > 0) {
      payload.generationConfig = generationConfig;
    }

    const url = `${GEMINI_API_ENDPOINT}/${this.model}:generateContent`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": this.apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorDetail = errorText;
      try {
        const errorJson = JSON.parse(errorText) as { error?: { message?: string } };
        if (errorJson?.error?.message) {
          errorDetail = errorJson.error.message;
        }
      } catch {
        // use raw text
      }

      if (response.status === 429) {
        throw new Error(`Gemini rate limit (429): ${errorDetail}`);
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error(`Gemini authentication error (${response.status}): ${errorDetail}`);
      }
      throw new Error(`Gemini API error (${response.status}): ${errorDetail}`);
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
        finishReason?: string;
      }>;
    };

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text || !text.trim()) {
      const finishReason = data?.candidates?.[0]?.finishReason;
      throw new Error(`Gemini API върна празен отговор${finishReason ? ` (finishReason: ${finishReason})` : ""}.`);
    }

    const trimmedText = text.trim();
    let parsedData: T | undefined;

    if (input.jsonMode || input.responseSchema) {
      try {
        const clean = trimmedText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
        parsedData = JSON.parse(clean) as T;
      } catch (err) {
        throw new Error(`Gemini върна невалиден JSON при изискван структуриран режим: ${trimmedText}`);
      }
    }

    return {
      text: trimmedText,
      data: parsedData,
      provider: "gemini",
      model: this.model,
    };
  }

  /**
   * Convenience helper for text-only generation.
   */
  async generateText(input: AiExecutionInput): Promise<AiExecutionResult<string>> {
    const result = await this.execute<string>(input);
    return {
      text: result.text,
      data: result.text,
      provider: result.provider,
      model: result.model,
    };
  }
}
