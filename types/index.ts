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
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
  name?: string;
  tool_calls?: OpenRouterToolCall[];
}

export interface OpenRouterToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface OpenRouterChoice {
  index: number;
  finish_reason: "stop" | "tool_calls" | "length";
  message: {
    role: "assistant";
    content: string | null;
    tool_calls?: OpenRouterToolCall[];
  };
}

export interface OpenRouterResponse {
  id: string;
  choices: OpenRouterChoice[];
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export type ToolHandler = (
  args: Record<string, unknown>,
  phone?: string
) =>
  | { status: "success"; data: unknown }
  | { status: "error"; message: string };

export interface MemoryEntry {
  messages: ConversationMessage[];
  handoffRequested: boolean;
  handoffReason?: string;
}

export interface Ticket {
  id: string;
  customerName: string;
  issue: string;
  priority: "low" | "medium" | "high";
  status: "open" | "in_progress" | "resolved";
  createdAt: string;
}

export interface Order {
  id: string;
  customerName: string;
  items: string[];
  total: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  category: string;
}
