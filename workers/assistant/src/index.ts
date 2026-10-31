interface RateLimitRecord {
  minuteKey: number;
  minuteCount: number;
  dayKey: string;
  dayCount: number;
}

interface GlobalLimitRecord {
  dayKey: string;
  count: number;
}

interface DurableObjectTransaction {
  get<T>(key: string): Promise<T | undefined>;
  put<T>(
    key: string,
    value: T,
    options?: { expirationTtl?: number },
  ): Promise<void>;
}

interface DurableObjectStorage {
  get<T>(key: string): Promise<T | undefined>;
  transaction<T>(
    callback: (transaction: DurableObjectTransaction) => Promise<T>,
  ): Promise<T>;
}

interface DurableObjectState {
  storage: DurableObjectStorage;
}

interface DurableObjectId {
  toString(): string;
}

interface DurableObjectStub {
  fetch(request: Request): Promise<Response>;
}

interface DurableObjectNamespace {
  idFromName(name: string): DurableObjectId;
  get(id: DurableObjectId): DurableObjectStub;
}

interface KVNamespace {
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ): Promise<void>;
}

interface WorkerEnv {
  ASSISTANT_ENABLED?: string;
  ALLOWED_ORIGIN?: string;
  PORTFOLIO_ORIGIN?: string;
  LLM_PROVIDER: string;
  LLM_MODEL: string;
  LLM_ENDPOINT: string;
  LLM_API_KEY: string;
  GLOBAL_DAILY_CAP?: string;
  RATE_LIMITER: DurableObjectNamespace;
  DAILY_COUNTER_KV: KVNamespace;
}

type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  headers: HeadersInit = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

function corsHeaders(origin: string): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function readBoundedBody(request: Request): Promise<unknown> {
  const declaredLength = Number(request.headers.get("Content-Length") ?? "0");
  if (declaredLength > 12_000) {
    throw new Error("REQUEST_TOO_LARGE");
  }
  if (!request.body) throw new Error("INVALID_BODY");

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > 12_000) {
      await reader.cancel();
      throw new Error("REQUEST_TOO_LARGE");
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  } catch {
    throw new Error("INVALID_BODY");
  }
}

function parseMessages(value: unknown): ConversationMessage[] | null {
  if (!isRecord(value) || !Array.isArray(value.messages)) return null;
  const rawMessages = value.messages.slice(-6);
  if (rawMessages.length === 0) return null;

  const messages: ConversationMessage[] = [];
  for (const item of rawMessages) {
    if (
      !isRecord(item) ||
      (item.role !== "user" && item.role !== "assistant")
    ) {
      return null;
    }
    if (typeof item.content !== "string") return null;
    const content = item.content
      .split("")
      .filter((character) => {
        const code = character.charCodeAt(0);
        return !(
          code <= 8 ||
          (code >= 11 && code <= 12) ||
          (code >= 14 && code <= 31) ||
          code === 127
        );
      })
      .join("")
      .trim();
    if (!content || content.length > 500) return null;
    messages.push({ role: item.role, content });
  }
  if (messages[messages.length - 1]?.role !== "user") return null;
  return messages;
}

async function getRateLimit(
  namespace: DurableObjectNamespace,
  ipAddress: string,
): Promise<Response> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(ipAddress),
  );
  const name = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  const stub = namespace.get(namespace.idFromName(name));
  return stub.fetch(
    new Request("https://rate-limit/check", { method: "POST" }),
  );
}

async function getGlobalDailyLimit(env: WorkerEnv): Promise<Response> {
  const stub = env.RATE_LIMITER.get(
    env.RATE_LIMITER.idFromName("global-daily"),
  );
  return stub.fetch(
    new Request("https://rate-limit/global", { method: "POST" }),
  );
}

function providerUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/chat/completions`;
}

function providerPayload(
  env: WorkerEnv,
  systemPrompt: string,
  messages: ConversationMessage[],
): string {
  return JSON.stringify({
    model: env.LLM_MODEL,
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    stream: true,
    max_tokens: 300,
    temperature: 0.3,
  });
}

async function fetchProvider(
  env: WorkerEnv,
  body: string,
  signal: AbortSignal,
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(providerUrl(env.LLM_ENDPOINT), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.LLM_API_KEY}`,
          "Content-Type": "application/json",
        },
        body,
        signal,
      });
      if (response.status < 500 || response.status > 599 || attempt === 1) {
        return response;
      }
      await response.body?.cancel();
    } catch (error) {
      lastError = error;
      if (signal.aborted || attempt === 1) throw error;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Provider request failed");
}

type ParsedSseEvent = {
  done: boolean;
  text?: string;
};

function parseSseData(data: string): ParsedSseEvent {
  const payload = data.trim();
  if (!payload) return { done: false };
  if (payload === "[DONE]") return { done: true };

  let chunk: unknown;
  try {
    chunk = JSON.parse(payload) as unknown;
  } catch {
    return { done: false };
  }
  if (!isRecord(chunk) || !Array.isArray(chunk.choices)) {
    return { done: false };
  }
  const choice = chunk.choices[0];
  if (!isRecord(choice) || !isRecord(choice.delta)) {
    return { done: false };
  }

  // Only the user-facing content field is forwarded; reasoning fields are ignored.
  return typeof choice.delta.content === "string"
    ? { done: false, text: choice.delta.content }
    : { done: false };
}

export class RateLimiter {
  constructor(
    private readonly state: DurableObjectState,
    private readonly env: WorkerEnv,
  ) {}

  async fetch(request: Request): Promise<Response> {
    if (new URL(request.url).pathname === "/global") {
      return this.fetchGlobalLimit();
    }

    const now = new Date();
    const minuteKey = Math.floor(now.getTime() / 60_000);
    const dayKey = now.toISOString().slice(0, 10);

    const result = await this.state.storage.transaction(async (transaction) => {
      const previous =
        (await transaction.get<RateLimitRecord>("counts")) ??
        ({
          minuteKey,
          minuteCount: 0,
          dayKey,
          dayCount: 0,
        } satisfies RateLimitRecord);
      const current: RateLimitRecord = {
        minuteKey,
        minuteCount:
          previous.minuteKey === minuteKey ? previous.minuteCount : 0,
        dayKey,
        dayCount: previous.dayKey === dayKey ? previous.dayCount : 0,
      };

      if (current.minuteCount >= 10) {
        return {
          allowed: false,
          retryAfter: Math.max(1, (minuteKey + 1) * 60 - now.getTime() / 1000),
        };
      }
      if (current.dayCount >= 40) {
        const tomorrow = new Date(`${dayKey}T00:00:00.000Z`);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
        return {
          allowed: false,
          retryAfter: Math.max(
            1,
            Math.ceil((tomorrow.getTime() - now.getTime()) / 1000),
          ),
        };
      }

      current.minuteCount += 1;
      current.dayCount += 1;
      await transaction.put("counts", current, { expirationTtl: 172800 });
      return { allowed: true, retryAfter: 0 };
    });

    return jsonResponse(
      { allowed: result.allowed, retryAfter: result.retryAfter },
      result.allowed ? 200 : 429,
      result.allowed
        ? {}
        : {
            "Retry-After": String(Math.ceil(result.retryAfter)),
          },
    );
  }

  private async fetchGlobalLimit(): Promise<Response> {
    const now = new Date();
    const dayKey = now.toISOString().slice(0, 10);
    const parsedCap = Number.parseInt(this.env.GLOBAL_DAILY_CAP ?? "800", 10);
    const cap = Number.isFinite(parsedCap) && parsedCap > 0 ? parsedCap : 800;
    const result = await this.state.storage.transaction(async (transaction) => {
      const previous =
        (await transaction.get<GlobalLimitRecord>("global-count")) ??
        ({ dayKey, count: 0 } satisfies GlobalLimitRecord);
      const current: GlobalLimitRecord = {
        dayKey,
        count: previous.dayKey === dayKey ? previous.count : 0,
      };
      if (current.count >= cap) {
        return { allowed: false, count: current.count };
      }

      current.count += 1;
      await transaction.put("global-count", current, { expirationTtl: 172800 });
      return { allowed: true, count: current.count };
    });

    try {
      await this.env.DAILY_COUNTER_KV.put(dayKey, String(result.count), {
        expirationTtl: 172800,
      });
    } catch {
      console.error("ASSISTANT_DAILY_COUNTER_UNAVAILABLE");
      return jsonResponse({ allowed: false }, 503);
    }

    return jsonResponse(
      { allowed: result.allowed },
      result.allowed ? 200 : 429,
      result.allowed
        ? {}
        : {
            "Retry-After": String(
              Math.max(
                1,
                Math.ceil(
                  (Date.UTC(
                    now.getUTCFullYear(),
                    now.getUTCMonth(),
                    now.getUTCDate() + 1,
                  ) -
                    now.getTime()) /
                    1000,
                ),
              ),
            ),
          },
    );
  }
}

async function handleChatRequest(
  request: Request,
  env: WorkerEnv,
  origin: string,
): Promise<Response> {
  const ipAddress = request.headers.get("CF-Connecting-IP");
  if (!ipAddress) {
    return jsonResponse(
      { message: "We couldn't verify this request. Please contact Muhammed." },
      400,
      corsHeaders(origin),
    );
  }

  let ipLimit: Response;
  try {
    ipLimit = await getRateLimit(env.RATE_LIMITER, ipAddress);
  } catch {
    console.error("ASSISTANT_RATE_LIMITER_UNAVAILABLE");
    return jsonResponse(
      { message: "The assistant is unavailable right now." },
      503,
      corsHeaders(origin),
    );
  }
  if (ipLimit.status === 429) {
    return jsonResponse(
      {
        message:
          "The assistant has reached its request limit. Please try again after it resets or contact Muhammed directly.",
      },
      429,
      {
        ...corsHeaders(origin),
        "Retry-After": ipLimit.headers.get("Retry-After") ?? "60",
      },
    );
  }
  if (!ipLimit.ok) {
    console.error("ASSISTANT_RATE_LIMITER_REJECTED");
    return jsonResponse(
      { message: "The assistant is unavailable right now." },
      503,
      corsHeaders(origin),
    );
  }

  let payload: unknown;
  try {
    payload = await readBoundedBody(request);
  } catch (error) {
    const tooLarge =
      error instanceof Error && error.message === "REQUEST_TOO_LARGE";
    return jsonResponse(
      {
        message: tooLarge
          ? "Please send a shorter question."
          : "Please send a valid question.",
      },
      tooLarge ? 413 : 400,
      corsHeaders(origin),
    );
  }

  const messages = parseMessages(payload);
  if (!messages) {
    return jsonResponse(
      { message: "Please send a valid question of up to 500 characters." },
      400,
      corsHeaders(origin),
    );
  }

  let dailyLimit: Response;
  try {
    dailyLimit = await getGlobalDailyLimit(env);
  } catch {
    console.error("ASSISTANT_GLOBAL_LIMITER_UNAVAILABLE");
    return jsonResponse(
      { message: "The assistant is unavailable right now." },
      503,
      corsHeaders(origin),
    );
  }
  if (dailyLimit.status === 429) {
    return jsonResponse(
      {
        message:
          "The assistant is currently unavailable. Please contact Muhammed directly.",
      },
      503,
      {
        ...corsHeaders(origin),
        "Retry-After": dailyLimit.headers.get("Retry-After") ?? "60",
      },
    );
  }
  if (!dailyLimit.ok) {
    console.error("ASSISTANT_GLOBAL_LIMITER_REJECTED");
    return jsonResponse(
      { message: "The assistant is unavailable right now." },
      503,
      corsHeaders(origin),
    );
  }

  let systemPrompt: string;
  try {
    const { buildAssistantSystemPrompt } =
      await import("../../../src/data/assistant-knowledge");
    systemPrompt = buildAssistantSystemPrompt();
  } catch {
    console.error("ASSISTANT_KNOWLEDGE_UNAVAILABLE");
    return jsonResponse(
      { message: "The assistant is unavailable right now." },
      503,
      corsHeaders(origin),
    );
  }

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), 20_000);
  let upstream: Response;
  try {
    upstream = await fetchProvider(
      env,
      providerPayload(env, systemPrompt, messages),
      abortController.signal,
    );
  } catch {
    clearTimeout(timeoutId);
    console.error(
      abortController.signal.aborted
        ? "ASSISTANT_PROVIDER_TIMEOUT"
        : "ASSISTANT_PROVIDER_UNREACHABLE",
    );
    return jsonResponse(
      {
        message:
          "The assistant couldn't reply just now. Please contact Muhammed.",
      },
      503,
      corsHeaders(origin),
    );
  }

  if (upstream.status === 401 || upstream.status === 403) {
    clearTimeout(timeoutId);
    await upstream.body?.cancel();
    console.error("provider auth error");
    return jsonResponse(
      { message: "The assistant is unavailable right now." },
      503,
      corsHeaders(origin),
    );
  }
  if (upstream.status === 429) {
    clearTimeout(timeoutId);
    const header = Number.parseInt(
      upstream.headers.get("Retry-After") ?? "60",
      10,
    );
    const retryAfter = Number.isFinite(header)
      ? Math.min(60, Math.max(1, header))
      : 60;
    await upstream.body?.cancel();
    return jsonResponse(
      {
        message:
          "The assistant is busy. Please try again in a minute or contact Muhammed directly.",
      },
      429,
      { ...corsHeaders(origin), "Retry-After": String(retryAfter) },
    );
  }
  if (!upstream.ok || !upstream.body) {
    clearTimeout(timeoutId);
    await upstream.body?.cancel();
    console.error(
      upstream.status >= 500
        ? "ASSISTANT_PROVIDER_UNAVAILABLE"
        : "ASSISTANT_PROVIDER_REJECTED",
    );
    return jsonResponse(
      {
        message:
          "The assistant couldn't reply just now. Please contact Muhammed.",
      },
      503,
      corsHeaders(origin),
    );
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let currentResponse = upstream;
      let didForwardText = false;
      let retryCount = 0;
      try {
        while (true) {
          const reader = currentResponse.body?.getReader();
          if (!reader) throw new Error("Provider stream unavailable");
          let buffer = "";
          let dataLines: string[] = [];
          let doneEvent = false;
          const flushEvent = () => {
            if (dataLines.length === 0) return;
            const event = parseSseData(dataLines.join("\n"));
            dataLines = [];
            if (event.done) doneEvent = true;
            if (event.text) {
              didForwardText = true;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ text: event.text })}\n\n`,
                ),
              );
            }
          };
          try {
            while (!doneEvent) {
              const { done, value } = await reader.read();
              buffer += decoder.decode(value, { stream: !done });
              const lines = buffer.split(/\r?\n/);
              buffer = lines.pop() ?? "";
              for (const line of lines) {
                if (!line) flushEvent();
                else if (line.startsWith("data:"))
                  dataLines.push(line.slice(5).replace(/^ /, ""));
                if (doneEvent) break;
              }
              if (done) {
                if (buffer.startsWith("data:"))
                  dataLines.push(buffer.slice(5).replace(/^ /, ""));
                flushEvent();
                break;
              }
            }
            if (doneEvent) await reader.cancel();
          } catch (error) {
            if (
              retryCount === 0 &&
              !didForwardText &&
              !abortController.signal.aborted
            ) {
              retryCount += 1;
              try {
                currentResponse = await fetchProvider(
                  env,
                  providerPayload(env, systemPrompt, messages),
                  abortController.signal,
                );
                if (
                  currentResponse.status === 401 ||
                  currentResponse.status === 403
                ) {
                  console.error("provider auth error");
                  throw error;
                }
                if (!currentResponse.ok || !currentResponse.body) throw error;
                continue;
              } catch {
                throw error;
              }
            }
            throw error;
          } finally {
            reader.releaseLock();
          }
          break;
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch {
        console.error(
          abortController.signal.aborted
            ? "ASSISTANT_PROVIDER_TIMEOUT"
            : "ASSISTANT_STREAM_FAILED",
        );
        controller.error(
          new Error("The assistant couldn't finish responding."),
        );
      } finally {
        clearTimeout(timeoutId);
      }
    },
    async cancel() {
      clearTimeout(timeoutId);
      abortController.abort();
      await upstream.body?.cancel();
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders(origin),
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const origin = request.headers.get("Origin");
    const allowedOrigin = env.ALLOWED_ORIGIN ?? env.PORTFOLIO_ORIGIN;
    if (!origin || !allowedOrigin || origin !== allowedOrigin) {
      return jsonResponse({ message: "This origin is not allowed." }, 403);
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (request.method !== "POST") {
      return jsonResponse(
        { message: "Method not allowed." },
        405,
        corsHeaders(origin),
      );
    }
    if (env.ASSISTANT_ENABLED !== "true") {
      return jsonResponse(
        { message: "The assistant is currently unavailable." },
        404,
        corsHeaders(origin),
      );
    }
    if (
      !env.LLM_API_KEY ||
      !env.LLM_ENDPOINT ||
      !env.LLM_MODEL ||
      !env.LLM_PROVIDER ||
      !env.DAILY_COUNTER_KV
    ) {
      console.error("ASSISTANT_CONFIGURATION_MISSING");
      return jsonResponse(
        { message: "The assistant is temporarily unavailable." },
        503,
        corsHeaders(origin),
      );
    }

    return handleChatRequest(request, env, origin);
  },
};
