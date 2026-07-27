import "server-only";

const BASE_URL = process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1";
const MODEL = process.env.GROQ_MODEL ?? "openai/gpt-oss-120b";
const MAX_RETRIES = 2;

export class LlmError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = "LlmError";
  }
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  jsonSchema?: { name: string; schema: Record<string, unknown> };
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const TLS_TRUST_CODES = new Set([
  "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
  "SELF_SIGNED_CERT_IN_CHAIN",
  "DEPTH_ZERO_SELF_SIGNED_CERT",
  "CERT_SIGNATURE_FAILURE",
]);

function causeOf(err: unknown): { code?: string; message?: string } | undefined {
  return (err as { cause?: { code?: string; message?: string } })?.cause;
}

function isTlsTrustError(err: unknown): boolean {
  const code = causeOf(err)?.code;
  return code !== undefined && TLS_TRUST_CODES.has(code);
}

/**
 * `fetch` collapses every network failure into "fetch failed" and buries the
 * real reason in `cause`. Dig it out — behind a TLS-inspecting corporate proxy
 * the actual error is UNABLE_TO_GET_ISSUER_CERT_LOCALLY, which is actionable.
 */
function describeFetchError(err: unknown): string {
  if (!(err instanceof Error)) return "LLM request failed";

  const cause = causeOf(err);
  if (!cause) return err.message;

  if (isTlsTrustError(err)) {
    return `TLS trust failure (${cause.code}): the connection is being intercepted by a proxy whose root CA Node doesn't trust. Usually a corporate network — export that CA and set NODE_EXTRA_CA_CERTS to its path.`;
  }

  return `${err.message}: ${cause.code ?? ""} ${cause.message ?? ""}`.trim();
}

export async function chatCompletion(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new LlmError("GROQ_API_KEY is not configured");
  }

  const body: Record<string, unknown> = {
    model: MODEL,
    messages,
    temperature: options.temperature ?? 0.4,
    max_tokens: options.maxTokens ?? 2048,
    // GPT-OSS always reasons internally; this just keeps that chain-of-thought
    // out of the wire response since we never want to show or parse it.
    reasoning_format: "hidden",
  };

  if (options.jsonSchema) {
    body.response_format = {
      type: "json_schema",
      json_schema: {
        name: options.jsonSchema.name,
        schema: options.jsonSchema.schema,
      },
    };
  }

  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`${BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        if (res.status >= 500 && attempt < MAX_RETRIES) {
          await sleep(500 * 2 ** attempt);
          continue;
        }
        throw new LlmError(`LLM request failed (${res.status}): ${text}`, res.status);
      }

      const data = await res.json();
      const choice = data?.choices?.[0];
      const content = choice?.message?.content;
      if (typeof content !== "string") {
        if (choice?.finish_reason === "length") {
          throw new LlmError(
            "LLM ran out of tokens before producing a response — try increasing maxTokens"
          );
        }
        throw new LlmError("LLM response missing message content");
      }
      return content;
    } catch (err) {
      lastError = err;
      if (err instanceof LlmError) throw err;
      // A TLS trust failure is deterministic — retrying just burns time.
      if (isTlsTrustError(err)) throw new LlmError(describeFetchError(err));
      if (attempt < MAX_RETRIES) {
        await sleep(500 * 2 ** attempt);
        continue;
      }
    }
  }

  throw new LlmError(describeFetchError(lastError));
}

/**
 * Streams plain-text content deltas only. `reasoning_format: "hidden"` keeps
 * GPT-OSS's chain-of-thought out of the response entirely, so every delta
 * that arrives here is real, user-facing content.
 */
export async function* streamChatCompletion(
  messages: ChatMessage[],
  options: ChatOptions = {}
): AsyncGenerator<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new LlmError("GROQ_API_KEY is not configured");
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: options.temperature ?? 0.4,
        max_tokens: options.maxTokens ?? 2048,
        reasoning_format: "hidden",
        stream: true,
      }),
    });
  } catch (err) {
    throw new LlmError(describeFetchError(err));
  }

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new LlmError(`LLM stream request failed (${res.status}): ${text}`, res.status);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) continue;
      const payload = trimmed.slice(6);
      if (payload === "[DONE]") return;

      let chunk: {
        choices?: Array<{ delta?: { content?: string } }>;
      };
      try {
        chunk = JSON.parse(payload);
      } catch {
        continue;
      }
      const content = chunk.choices?.[0]?.delta?.content;
      if (content) yield content;
    }
  }
}

export async function chatCompletionJSON<T = unknown>(
  messages: ChatMessage[],
  jsonSchema: { name: string; schema: Record<string, unknown> },
  options: Omit<ChatOptions, "jsonSchema"> = {}
): Promise<T> {
  const content = await chatCompletion(messages, { ...options, jsonSchema });
  try {
    return JSON.parse(content) as T;
  } catch {
    throw new LlmError("LLM returned invalid JSON for structured output");
  }
}
