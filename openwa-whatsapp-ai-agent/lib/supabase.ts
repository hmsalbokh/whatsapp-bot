import { createClient } from '@supabase/supabase-js';
import type { Conversation, Message } from '@/lib/types';

let _supabase: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (_supabase) return _supabase;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  }
  _supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  return _supabase;
}

function db(table: string) {
  return (getSupabase()).from(table) as any;
}

export async function getOrCreateConversation(
  phone: string,
  name?: string | null
): Promise<Conversation> {
  const { data: existing, error: errSelect } = await db('conversations')
    .select('*')
    .eq('customer_phone', phone)
    .single();

  if (!errSelect && existing) {
    const conv = existing as Conversation;
    if (name && conv.customer_name !== name) {
      await db('conversations')
        .update({ customer_name: name, updated_at: new Date().toISOString() })
        .eq('id', conv.id);
    }
    return conv;
  }

  const now = new Date().toISOString();
  const { data, error } = await db('conversations')
    .insert([{
      customer_phone: phone,
      customer_name: name ?? null,
      bot_enabled: true,
      human_handoff: false,
      last_message_at: now,
      last_inbound_at: now,
      created_at: now,
      updated_at: now,
    }])
    .single();

  if (error) throw error;
  return data as Conversation;
}

export async function saveInboundMessage(
  conversationId: string,
  content: string,
  rawPayload?: unknown,
  externalMessageId?: string
): Promise<Message> {
  const { data, error } = await db('messages')
    .insert([{
      conversation_id: conversationId,
      external_message_id: externalMessageId ?? null,
      direction: 'inbound',
      role: 'user',
      message_type: 'text',
      content,
      raw_payload: rawPayload ?? null,
      created_at: new Date().toISOString(),
    }])
    .single();

  if (error) throw error;
  return data as Message;
}

export async function saveOutboundMessage(
  conversationId: string,
  content: string,
  rawPayload?: unknown,
  role: 'assistant' | 'admin' = 'assistant'
): Promise<Message> {
  const { data, error } = await db('messages')
    .insert([{
      conversation_id: conversationId,
      direction: 'outbound',
      role,
      message_type: 'text',
      content,
      raw_payload: rawPayload ?? null,
      created_at: new Date().toISOString(),
    }])
    .single();

  if (error) throw error;
  return data as Message;
}

export async function getRecentMessagesForContext(
  conversationId: string,
  limit: number = 10
): Promise<Message[]> {
  const { data, error } = await db('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return ((data ?? []) as Message[]).reverse();
}

export async function getMessages(
  conversationId: string,
  ascending: boolean = true
): Promise<Message[]> {
  const { data, error } = await db('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending });

  if (error) throw error;
  return (data ?? []) as Message[];
}

export async function setHumanHandoff(
  conversationId: string,
  handoff: boolean
): Promise<void> {
  const { error } = await db('conversations')
    .update({ human_handoff: handoff, updated_at: new Date().toISOString() })
    .eq('id', conversationId);
  if (error) throw error;
}

export async function toggleBot(
  conversationId: string,
  enabled: boolean
): Promise<void> {
  const { error } = await db('conversations')
    .update({ bot_enabled: enabled, updated_at: new Date().toISOString() })
    .eq('id', conversationId);
  if (error) throw error;
}

export async function updateLastMessageAt(
  conversationId: string,
  direction: 'inbound' | 'outbound' = 'inbound'
): Promise<void> {
  const now = new Date().toISOString();
  const updates: Record<string, string> = { last_message_at: now, updated_at: now };
  if (direction === 'inbound') updates.last_inbound_at = now;
  else updates.last_outbound_at = now;
  const { error } = await db('conversations')
    .update(updates)
    .eq('id', conversationId);
  if (error) throw error;
}

export async function getConversations(): Promise<Conversation[]> {
  const { data, error } = await db('conversations')
    .select('*')
    .order('last_message_at', { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as Conversation[];
}
