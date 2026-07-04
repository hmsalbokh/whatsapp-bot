-- Drop existing tables (order matters due to foreign keys)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS webhook_events CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

-- Conversations table
create table conversations (
    id uuid primary key default gen_random_uuid(),
    customer_phone text not null unique,
    customer_name text,
    bot_enabled boolean not null default true,
    human_handoff boolean not null default false,
    assigned_agent text,
    last_message_at timestamptz,
    last_inbound_at timestamptz,
    last_outbound_at timestamptz,
    bot_paused_until timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Messages table
create table messages (
    id uuid primary key default gen_random_uuid(),
    conversation_id uuid not null references conversations(id) on delete cascade,
    external_message_id text,
    direction text not null check (direction in ('inbound', 'outbound')),
    role text not null check (role in ('user', 'assistant', 'system', 'admin')),
    message_type text not null default 'text',
    status text,
    content text not null,
    raw_payload jsonb,
    created_at timestamptz not null default now()
);

-- Webhook events table (deduplication + debugging)
create table webhook_events (
    id uuid primary key default gen_random_uuid(),
    source text not null default 'openwa',
    event_key text not null unique,
    payload jsonb not null,
    processed boolean not null default false,
    created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_messages_conversation_id on messages(conversation_id);
create index if not exists idx_messages_created_at on messages(created_at desc);
create index if not exists idx_conversations_last_message_at on conversations(last_message_at desc);
create unique index if not exists idx_messages_external_id on messages(external_message_id) where external_message_id is not null;
create index if not exists idx_webhook_events_event_key on webhook_events(event_key);
