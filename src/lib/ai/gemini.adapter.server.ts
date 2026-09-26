import type {
  AiExecutionInput,
  AiExecutionResult,
  AiProvider,
} from "./types";

const DEFAULT_MODEL = "gemini-3-flash-preview";
const GEMINI_API_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

type OpenAiLikeTextPart = { type: "text"; text: string };
type OpenAiLikeImagePart = { type: "image_url"; image_url: { url: string } };
type OpenAiLikeMessage = {
  role: "system" | "user" | "assistant";
  content: string | Array<OpenAiLikeTextPart | OpenAiLikeImagePart>;
};
type OpenAiLikeRequest = {
  model?: string;
  messages: OpenAiLikeMessage[];
  response_format?: { type: "json_object" };
};

/** Server-only direct Gemini REST adapter. No Lovable proxy or API key is used. */
export async function geminiChatCompletion(request: OpenAiLikeRequest): Promise<Response> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY липсва в конфигурацията на средата.");

  const model = (request.model ?? process.env.GEMINI_MODEL ?? DEFAULT_MODEL).replace(/^google\//, "");
  let systemInstruction: { parts: Array<{ text: string }> } | undefined;
  const contents: Array<{ role: "user" | "model"; parts: Array<Record<string, unknown>> }> = [];

  for (const message of request.messages) {
    if (message.role === "system") {
      const text = typeof message.content === "string"
        ? message.content
        : message.content.filter((part): part is OpenAiLikeTextPart => part.type === "text").map((part) => part.text).join("\n");
      systemInstruction = { parts: [{ text }] };
      continue;
    }

    const parts: Array<Record<string, unknown>> = [];
    const messageParts: Array<OpenAiLikeTextPart | OpenAiLikeImagePart> = typeof message.content === "string"
      ? [{ type: "text", text: message.content }]
      : message.content;
    for (const part of messageParts) {
      if (part.type === "text") {
        parts.push({ text: part.text });
        continue;
      }

      const mediaResponse = await fetch(part.image_url.url);
      if (!mediaResponse.ok) throw new Error(`Неуспешно зареждане на AI документ (${mediaResponse.status}).`);
      const bytes = new Uint8Array(await mediaResponse.arrayBuffer());
      let binary = "";
      for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      parts.push({
        inline_data: {
          mime_type: mediaResponse.headers.get("content-type")?.split(";")[0] ?? "application/octet-stream",
          data: btoa(binary),
        },
      });
    }
    contents.push({ role: message.role === "assistant" ? "model" : "user", parts });
  }

  const payload: Record<string, unknown> = { contents };
  if (systemInstruction) payload.system_instruction = systemInstruction;
  if (request.response_format?.type === "json_object") payload.generationConfig = { responseMimeType: "application/json" };

  const response = await fetch(`${GEMINI_API_ENDPOINT}/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify(payload),
  });
  if (!response.ok) return response;

  const data = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
  return new Response(JSON.stringify({ choices: [{ message: { content: text } }] }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

export class GeminiAiProvider implements AiProvider {
  private readonly apiKey: string;
  private readonly model: string;

  constructor() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY липсва в конфигурацията на средата.");
    this.apiKey = key;
    this.model = process.env.GEMINI_MODEL ?? DEFAULT_MODEL;
  }

  async execute<T = unknown>(input: AiExecutionInput): Promise<AiExecutionResult<T>> {
    const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];
    const contextText = input.context
      ? typeof input.context === "string" ? input.context.trim() : JSON.stringify(input.context, null, 2)
      : "";

    if (input.messages?.length) {
      for (const msg of input.messages) {
        if (msg.role === "system") {
          if (!input.instructions) input.instructions = msg.content;
        } else {
          contents.push({ role: msg.role === "assistant" ? "model" : "user", parts: [{ text: msg.content }] });
        }
      }
    } else if (contextText && input.prompt) {
      contents.push({ role: "user", parts: [{ text: `Вътрешен REMI Контекст:\n${contextText}\n\nЗаявка:\n${input.prompt}` }] });
    } else if (contextText) {
      contents.push({ role: "user", parts: [{ text: `Вътрешен REMI Контекст:\n${contextText}` }] });
    } else if (input.prompt) {
      contents.push({ role: "user", parts: [{ text: input.prompt }] });
    }
    if (!contents.length) throw new Error("Няма подаден контекст, prompt или съобщения към GeminiAiProvider.");

    const generationConfig: Record<string, unknown> = {};
    if (typeof input.temperature === "number") generationConfig.temperature = input.temperature;
    if (typeof input.maxTokens === "number") generationConfig.maxOutputTokens = input.maxTokens;
    if (input.jsonMode || input.responseSchema) generationConfig.responseMimeType = "application/json";
    if (input.responseSchema) generationConfig.responseSchema = input.responseSchema;

    const response = await fetch(`${GEMINI_API_ENDPOINT}/${this.model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": this.apiKey },
      body: JSON.stringify({
        contents,
        ...(input.instructions ? { system_instruction: { parts: [{ text: input.instructions }] } } : {}),
        ...(Object.keys(generationConfig).length ? { generationConfig } : {}),
      }),
    });
    if (!response.ok) {
      const raw = await response.text();
      let detail = raw;
      try { detail = (JSON.parse(raw) as { error?: { message?: string } }).error?.message ?? raw; } catch { /* raw response */ }
      if (response.status === 429) throw new Error(`Gemini rate limit (429): ${detail}`);
      if (response.status === 401 || response.status === 403) throw new Error(`Gemini authentication error (${response.status}): ${detail}`);
      throw new Error(`Gemini API error (${response.status}): ${detail}`);
    }

    const data = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }> };
    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
    if (!text.trim()) throw new Error(`Gemini API върна празен отговор${data.candidates?.[0]?.finishReason ? ` (finishReason: ${data.candidates[0].finishReason})` : ""}.`);
    const trimmedText = text.trim();
    let parsedData: T | undefined;
    if (input.jsonMode || input.responseSchema) {
      try { parsedData = JSON.parse(trimmedText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim()) as T; }
      catch { throw new Error(`Gemini върна невалиден JSON при изискван структуриран режим: ${trimmedText}`); }
    }
    return { text: trimmedText, data: parsedData, provider: "gemini", model: this.model };
  }

  async generateText(input: AiExecutionInput): Promise<AiExecutionResult<string>> {
    const result = await this.execute<string>(input);
    return { text: result.text, data: result.text, provider: result.provider, model: result.model };
  }
}
