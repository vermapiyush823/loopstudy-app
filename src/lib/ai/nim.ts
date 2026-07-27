import "server-only";

const BASE_URL = process.env.NVIDIA_NIM_BASE_URL ?? "https://integrate.api.nvidia.com/v1";
const MODEL = process.env.NVIDIA_NIM_MODEL ?? "openai/gpt-oss-120b";
const MAX_RETRIES = 2;

export class NimError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = "NimError";
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
  if (!(err instanceof Error)) return "NIM request failed";

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
  const apiKey = process.env.NVIDIA_NIM_API_KEY;
  if (!apiKey) {
    throw new NimError("NVIDIA_NIM_API_KEY is not configured");
  }

  const body: Record<string, unknown> = {
    model: MODEL,
    messages,
    temperature: options.temperature ?? 0.4,
    max_tokens: options.maxTokens ?? 2048,
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
        throw new NimError(`NIM request failed (${res.status}): ${text}`, res.status);
      }

      const data = await res.json();
      const choice = data?.choices?.[0];
      const content = choice?.message?.content;
      if (typeof content !== "string") {
        if (choice?.finish_reason === "length") {
          throw new NimError(
            "NIM ran out of tokens before producing a response (model spent its budget reasoning) — try increasing maxTokens"
          );
        }
        throw new NimError("NIM response missing message content");
      }
      return content;
    } catch (err) {
      lastError = err;
      if (err instanceof NimError) throw err;
      // A TLS trust failure is deterministic — retrying just burns time.
      if (isTlsTrustError(err)) throw new NimError(describeFetchError(err));
      if (attempt < MAX_RETRIES) {
        await sleep(500 * 2 ** attempt);
        continue;
      }
    }
  }

  throw new NimError(describeFetchError(lastError));
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
    throw new NimError("NIM returned invalid JSON for structured output");
  }
}
