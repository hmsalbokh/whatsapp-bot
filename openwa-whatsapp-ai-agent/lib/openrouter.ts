import type {
  OpenRouterResponse,
  ConversationMessage,
  ToolDefinition,
} from '@/lib/types';
import { logger } from './logger';

export class OpenRouterError extends Error {
  constructor(
    message: string,
    public status?: number,
    public model?: string
  ) {
    super(message);
    this.name = 'OpenRouterError';
  }
}

const apiKey = process.env.OPENROUTER_API_KEY ?? '';
const primaryModel = process.env.OPENROUTER_MODEL ?? 'google/gemini-2.5-flash';
const fallbackModel = process.env.OPENROUTER_FALLBACK_MODEL ?? 'openai/gpt-4o-mini';
const maxTokens = Number(process.env.OPENROUTER_MAX_TOKENS) || 1024;
const requestTimeout = Number(process.env.OPENROUTER_TIMEOUT_MS) || 15000;

async function callModel(
  messages: ConversationMessage[],
  model: string,
  tools?: ToolDefinition[]
): Promise<OpenRouterResponse> {
  if (!apiKey) {
    throw new OpenRouterError('OPENROUTER_API_KEY is not configured', 500);
  }

  const payload: Record<string, unknown> = {
    model,
    messages: messages.map((m) => {
      const msg: Record<string, unknown> = { role: m.role, content: m.content };
      if (m.tool_call_id) msg.tool_call_id = m.tool_call_id;
      if (m.name) msg.name = m.name;
      if (m.tool_calls) msg.tool_calls = m.tool_calls;
      return msg;
    }),
    max_tokens: maxTokens,
    temperature: 0.7,
  };

  if (tools && tools.length > 0) {
    payload.tools = tools;
    payload.tool_choice = 'auto';
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeout);

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_BASE_URL || 'http://localhost:3000',
        'X-Title': 'OpenWA WhatsApp AI Agent',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new OpenRouterError(
        `OpenRouter API error (${response.status}): ${errorText}`,
        response.status,
        model
      );
    }

    const data = (await response.json()) as OpenRouterResponse;
    logger.info('OpenRouter response', {
      model,
      choices: data.choices?.length,
      finish_reason: data.choices?.[0]?.finish_reason,
    });
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

export async function chat(
  messages: ConversationMessage[],
  tools?: ToolDefinition[]
): Promise<OpenRouterResponse> {
  try {
    return await callModel(messages, primaryModel, tools);
  } catch (primaryErr) {
    const primaryError = primaryErr as OpenRouterError;
    logger.warn('Primary model failed, trying fallback', {
      model: primaryModel,
      error: primaryError.message,
    });

    try {
      return await callModel(messages, fallbackModel, tools);
    } catch (fallbackErr) {
      const fallbackError = fallbackErr as OpenRouterError;
      logger.error('Both models failed', {
        primary: primaryModel,
        fallback: fallbackModel,
        error: fallbackError.message,
      });
      throw fallbackError;
    }
  }
}
