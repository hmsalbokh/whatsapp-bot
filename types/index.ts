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

export type ToolResult =
  | { status: "success"; data: unknown }
  | { status: "error"; message: string };

export interface ToolContext {
  phone?: string;
  projectId?: string;
}

export type ToolHandler = (
  args: Record<string, unknown>,
  context?: ToolContext
) => ToolResult | Promise<ToolResult>;

// ---- Multi-Tenant Types ----

export interface DbTenant {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface DbTenantUser {
  id: string;
  tenant_id: string;
  user_id: string;
  role: "admin" | "agent" | "viewer";
  created_at: string;
}

export interface DbProjectProfile {
  id: string;
  tenant_id: string;
  name: string;
  industry: string | null;
  timezone: string;
  language: string;
  welcome_message: string | null;
  company_description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbWhatsAppSession {
  id: string;
  tenant_id: string;
  project_id: string;
  provider: string;
  phone_number_id: string | null;
  webhook_secret: string | null;
  config: unknown;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbContact {
  id: string;
  tenant_id: string;
  project_id: string;
  phone: string;
  name: string | null;
  avatar_url: string | null;
  metadata: unknown;
  created_at: string;
  updated_at: string;
}

export interface DbConversationV2 {
  id: string;
  tenant_id: string;
  project_id: string;
  contact_id: string | null;
  external_session_id: string | null;
  status: "active" | "paused" | "closed" | "handoff";
  bot_enabled: boolean;
  human_handoff: boolean;
  assigned_agent: string | null;
  last_message_at: string | null;
  last_inbound_at: string | null;
  last_outbound_at: string | null;
  bot_paused_until: string | null;
  summary: string | null;
  summary_generated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbMessageV2 {
  id: string;
  tenant_id: string;
  conversation_id: string;
  contact_id: string | null;
  external_message_id: string | null;
  direction: "inbound" | "outbound";
  role: "user" | "assistant" | "system" | "admin" | "tool";
  message_type: string;
  status: string | null;
  content: string;
  raw_payload: unknown;
  created_at: string;
}

export interface DbKnowledgeItem {
  id: string;
  tenant_id: string;
  project_id: string;
  question: string;
  answer: string;
  keywords: string[];
  category: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbAgentSettings {
  id: string;
  tenant_id: string;
  project_id: string;
  model: string;
  system_prompt: string | null;
  temperature: number;
  max_tokens: number;
  max_tool_loops: number;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface DbHandoffRequest {
  id: string;
  tenant_id: string;
  conversation_id: string;
  requested_by: "ai" | "contact" | "admin";
  reason: string | null;
  status: "pending" | "accepted" | "rejected" | "closed";
  assigned_to: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbAuditLog {
  id: string;
  tenant_id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  changes: unknown;
  ip_address: string | null;
  created_at: string;
}

export interface DbFailedJob {
  id: string;
  tenant_id: string | null;
  job_type: string;
  payload: unknown;
  error: string | null;
  attempt: number;
  max_attempts: number;
  last_attempt_at: string | null;
  created_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  limits: {
    projects: number;
    contacts: number;
    messages_per_month: number;
    teams: number;
  };
  is_active: boolean;
  sort_order: number;
}

export interface Subscription {
  id: string;
  tenant_id: string;
  plan_id: string;
  status: "active" | "past_due" | "canceled" | "expired" | "trialing";
  current_period_start: string;
  current_period_end: string;
  trial_end: string | null;
  canceled_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}


