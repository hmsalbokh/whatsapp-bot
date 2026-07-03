export interface IncomingMessage {
  from: string;
  body: string;
  messageId?: string;
  timestamp?: number;
}

export interface OutgoingMessage {
  to: string;
  text: string;
}

export interface ConversationMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  name?: string;
  tool_calls?: OpenRouterToolCall[];
}

export interface OpenRouterToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface OpenRouterChoice {
  index: number;
  finish_reason: 'stop' | 'tool_calls' | 'length';
  message: {
    role: 'assistant';
    content: string | null;
    tool_calls?: OpenRouterToolCall[];
  };
}

export interface OpenRouterResponse {
  id: string;
  choices: OpenRouterChoice[];
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface ToolResult {
  status: 'success' | 'error';
  data?: unknown;
  message?: string;
}

export type ToolHandler = (
  args: Record<string, unknown>,
  conversationId?: string
) => Promise<ToolResult>;

export interface Conversation {
  id: string;
  customer_phone: string;
  customer_name: string | null;
  bot_enabled: boolean;
  human_handoff: boolean;
  assigned_agent: string | null;
  last_message_at: string | null;
  last_inbound_at: string | null;
  last_outbound_at: string | null;
  bot_paused_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  external_message_id: string | null;
  direction: 'inbound' | 'outbound';
  role: 'user' | 'assistant' | 'system' | 'admin';
  message_type: string;
  status: string | null;
  content: string;
  raw_payload: Record<string, unknown> | null;
  created_at: string;
}

export interface WebhookEvent {
  id: string;
  source: string;
  event_key: string;
  payload: Record<string, unknown>;
  processed: boolean;
  created_at: string;
}
