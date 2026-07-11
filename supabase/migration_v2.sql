-- ============================================================
-- Full Schema Reset — Safe to run multiple times
-- Drops everything first, then creates fresh
-- ============================================================

-- ============================================================
-- 0. DROP ALL EXISTING TABLES (reverse FK order)
-- ============================================================
drop table if exists failed_jobs cascade;
drop table if exists audit_logs cascade;
drop table if exists handoff_requests cascade;
drop table if exists webhook_events cascade;
drop table if exists agent_settings cascade;
drop table if exists knowledge_items cascade;
drop table if exists messages cascade;
drop table if exists conversations cascade;
drop table if exists contacts cascade;
drop table if exists whatsapp_sessions cascade;
drop table if exists support_tickets cascade;
drop table if exists orders cascade;
drop table if exists project_profiles cascade;
drop table if exists tenant_users cascade;
drop table if exists tenants cascade;

-- ============================================================
-- 1. TENANTS
-- ============================================================
create table tenants (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    slug text not null unique,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ============================================================
-- 2. TENANT USERS
-- ============================================================
create table tenant_users (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null references tenants(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    role text not null default 'admin' check (role in ('admin', 'agent', 'viewer')),
    created_at timestamptz not null default now(),
    unique (tenant_id, user_id)
);

-- ============================================================
-- 3. PROJECT PROFILES
-- ============================================================
create table project_profiles (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null references tenants(id) on delete cascade,
    name text not null,
    industry text,
    timezone text not null default 'Asia/Riyadh',
    language text not null default 'ar',
    welcome_message text,
    company_description text,
    contact_email text,
    contact_phone text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ============================================================
-- 4. WHATSAPP SESSIONS
-- ============================================================
create table whatsapp_sessions (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null references tenants(id) on delete cascade,
    project_id uuid not null references project_profiles(id) on delete cascade,
    provider text not null default 'openwa',
    phone_number_id text,
    webhook_secret text,
    config jsonb default '{}',
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ============================================================
-- 5. CONTACTS
-- ============================================================
create table contacts (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null references tenants(id) on delete cascade,
    project_id uuid not null references project_profiles(id) on delete cascade,
    phone text not null,
    name text,
    avatar_url text,
    metadata jsonb default '{}',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (project_id, phone)
);

-- ============================================================
-- 6. CONVERSATIONS
-- ============================================================
create table conversations (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null references tenants(id) on delete cascade,
    project_id uuid not null references project_profiles(id) on delete cascade,
    contact_id uuid references contacts(id) on delete set null,
    external_session_id text,
    status text not null default 'active' check (status in ('active', 'paused', 'closed', 'handoff')),
    bot_enabled boolean not null default true,
    human_handoff boolean not null default false,
    assigned_agent text,
    last_message_at timestamptz,
    last_inbound_at timestamptz,
    last_outbound_at timestamptz,
    bot_paused_until timestamptz,
    summary text,
    summary_generated_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ============================================================
-- 7. MESSAGES
-- ============================================================
create table messages (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null references tenants(id) on delete cascade,
    conversation_id uuid not null references conversations(id) on delete cascade,
    contact_id uuid references contacts(id) on delete set null,
    external_message_id text,
    direction text not null check (direction in ('inbound', 'outbound')),
    role text not null check (role in ('user', 'assistant', 'system', 'admin', 'tool')),
    message_type text not null default 'text',
    status text,
    content text not null,
    raw_payload jsonb,
    created_at timestamptz not null default now()
);

-- ============================================================
-- 8. KNOWLEDGE ITEMS
-- ============================================================
create table knowledge_items (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null references tenants(id) on delete cascade,
    project_id uuid not null references project_profiles(id) on delete cascade,
    question text not null,
    answer text not null,
    keywords text[] default '{}',
    category text,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ============================================================
-- 9. AGENT SETTINGS
-- ============================================================
create table agent_settings (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null references tenants(id) on delete cascade,
    project_id uuid not null references project_profiles(id) on delete cascade unique,
    model text not null default 'qwen/qwen-2.5-72b-instruct',
    system_prompt text,
    temperature numeric(3,2) not null default 0.7,
    max_tokens int not null default 1024,
    max_tool_loops int not null default 5,
    language text not null default 'ar',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ============================================================
-- 10. WEBHOOK EVENTS
-- ============================================================
create table webhook_events (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid references tenants(id) on delete set null,
    project_id uuid references project_profiles(id) on delete set null,
    session_id uuid references whatsapp_sessions(id) on delete set null,
    source text not null,
    event_type text,
    status text not null default 'received',
    raw_payload jsonb,
    error text,
    processed_at timestamptz,
    created_at timestamptz not null default now()
);

-- ============================================================
-- 11. HANDOFF REQUESTS
-- ============================================================
create table handoff_requests (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null references tenants(id) on delete cascade,
    conversation_id uuid not null references conversations(id) on delete cascade,
    requested_by text not null default 'ai' check (requested_by in ('ai', 'contact', 'admin')),
    reason text,
    status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'closed')),
    assigned_to text,
    resolved_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ============================================================
-- 12. AUDIT LOGS
-- ============================================================
create table audit_logs (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null references tenants(id) on delete cascade,
    user_id uuid references auth.users(id) on delete set null,
    action text not null,
    entity_type text not null,
    entity_id uuid,
    changes jsonb,
    ip_address text,
    created_at timestamptz not null default now()
);

-- ============================================================
-- 13. FAILED JOBS
-- ============================================================
create table failed_jobs (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid references tenants(id) on delete set null,
    job_type text not null,
    payload jsonb,
    error text,
    attempt int not null default 1,
    max_attempts int not null default 3,
    last_attempt_at timestamptz,
    created_at timestamptz not null default now()
);

-- ============================================================
-- 14. ORDERS
-- ============================================================
create table orders (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null references tenants(id) on delete cascade,
    project_id uuid not null references project_profiles(id) on delete cascade,
    contact_id uuid references contacts(id) on delete set null,
    customer_name text not null,
    items text[] not null default '{}',
    total numeric(10,2) not null,
    status text not null default 'pending' check (status in ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ============================================================
-- 15. SUPPORT TICKETS
-- ============================================================
create table support_tickets (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null references tenants(id) on delete cascade,
    project_id uuid not null references project_profiles(id) on delete cascade,
    contact_id uuid references contacts(id) on delete set null,
    customer_name text not null,
    issue text not null,
    priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
    status text not null default 'open' check (status in ('open', 'in_progress', 'resolved')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_tenant_users_tenant on tenant_users(tenant_id);
create index if not exists idx_tenant_users_user on tenant_users(user_id);
create index if not exists idx_project_profiles_tenant on project_profiles(tenant_id);
create index if not exists idx_whatsapp_sessions_tenant on whatsapp_sessions(tenant_id);
create index if not exists idx_whatsapp_sessions_project on whatsapp_sessions(project_id);
create index if not exists idx_contacts_tenant on contacts(tenant_id);
create index if not exists idx_contacts_project_phone on contacts(project_id, phone);
create index if not exists idx_conversations_tenant on conversations(tenant_id);
create index if not exists idx_conversations_project on conversations(project_id);
create index if not exists idx_conversations_contact on conversations(contact_id);
create index if not exists idx_conversations_status on conversations(status);
create index if not exists idx_conversations_last_message on conversations(last_message_at desc);
create index if not exists idx_messages_tenant on messages(tenant_id);
create index if not exists idx_messages_conversation on messages(conversation_id);
create index if not exists idx_messages_created on messages(created_at);
create index if not exists idx_messages_external on messages(external_message_id);
create index if not exists idx_knowledge_items_tenant on knowledge_items(tenant_id);
create index if not exists idx_knowledge_items_project on knowledge_items(project_id);
create index if not exists idx_knowledge_items_active on knowledge_items(is_active);
create index if not exists idx_agent_settings_project on agent_settings(project_id);
create index if not exists idx_webhook_events_tenant on webhook_events(tenant_id);
create index if not exists idx_webhook_events_created on webhook_events(created_at desc);
create index if not exists idx_handoff_requests_conversation on handoff_requests(conversation_id);
create index if not exists idx_handoff_requests_status on handoff_requests(status);
create index if not exists idx_audit_logs_tenant on audit_logs(tenant_id);
create index if not exists idx_audit_logs_created on audit_logs(created_at desc);
create index if not exists idx_failed_jobs_tenant on failed_jobs(tenant_id);
create index if not exists idx_failed_jobs_type on failed_jobs(job_type);
create index if not exists idx_orders_project on orders(project_id);
create index if not exists idx_orders_tenant on orders(tenant_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_support_tickets_project on support_tickets(project_id);
create index if not exists idx_support_tickets_tenant on support_tickets(tenant_id);
create index if not exists idx_support_tickets_status on support_tickets(status);

-- ============================================================
-- TRIGGER: auto-update updated_at
-- ============================================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists set_tenants_updated_at on tenants;
create trigger set_tenants_updated_at before update on tenants for each row execute function update_updated_at_column();

drop trigger if exists set_project_profiles_updated_at on project_profiles;
create trigger set_project_profiles_updated_at before update on project_profiles for each row execute function update_updated_at_column();

drop trigger if exists set_whatsapp_sessions_updated_at on whatsapp_sessions;
create trigger set_whatsapp_sessions_updated_at before update on whatsapp_sessions for each row execute function update_updated_at_column();

drop trigger if exists set_contacts_updated_at on contacts;
create trigger set_contacts_updated_at before update on contacts for each row execute function update_updated_at_column();

drop trigger if exists set_conversations_updated_at on conversations;
create trigger set_conversations_updated_at before update on conversations for each row execute function update_updated_at_column();

drop trigger if exists set_knowledge_items_updated_at on knowledge_items;
create trigger set_knowledge_items_updated_at before update on knowledge_items for each row execute function update_updated_at_column();

drop trigger if exists set_agent_settings_updated_at on agent_settings;
create trigger set_agent_settings_updated_at before update on agent_settings for each row execute function update_updated_at_column();

drop trigger if exists set_handoff_requests_updated_at on handoff_requests;
create trigger set_handoff_requests_updated_at before update on handoff_requests for each row execute function update_updated_at_column();

drop trigger if exists set_orders_updated_at on orders;
create trigger set_orders_updated_at before update on orders for each row execute function update_updated_at_column();

drop trigger if exists set_support_tickets_updated_at on support_tickets;
create trigger set_support_tickets_updated_at before update on support_tickets for each row execute function update_updated_at_column();

-- ============================================================
-- RLS POLICIES
-- ============================================================
alter table tenants enable row level security;
alter table tenant_users enable row level security;
alter table project_profiles enable row level security;
alter table whatsapp_sessions enable row level security;
alter table contacts enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table knowledge_items enable row level security;
alter table agent_settings enable row level security;
alter table webhook_events enable row level security;
alter table handoff_requests enable row level security;
alter table audit_logs enable row level security;
alter table orders enable row level security;
alter table support_tickets enable row level security;
alter table failed_jobs enable row level security;

-- Tenant users can view their own tenant
drop policy if exists "users can view own tenant" on tenants;
create policy "users can view own tenant"
    on tenants for select
    using (
        id in (
            select tenant_id from tenant_users where user_id = auth.uid()
        )
    );

-- Tenant users can view their own memberships
drop policy if exists "users can view own memberships" on tenant_users;
create policy "users can view own memberships"
    on tenant_users for select
    using (user_id = auth.uid());

-- Helper: create tenant isolation policies for a table
do $$ begin
    -- whatsapp_sessions
    execute 'drop policy if exists "tenant isolation select" on whatsapp_sessions';
    execute 'create policy "tenant isolation select" on whatsapp_sessions for select using (tenant_id in (select tenant_id from tenant_users where user_id = auth.uid()))';
    execute 'drop policy if exists "tenant isolation insert" on whatsapp_sessions';
    execute 'create policy "tenant isolation insert" on whatsapp_sessions for insert with check (tenant_id in (select tenant_id from tenant_users where user_id = auth.uid()))';
    execute 'drop policy if exists "tenant isolation update" on whatsapp_sessions';
    execute 'create policy "tenant isolation update" on whatsapp_sessions for update using (tenant_id in (select tenant_id from tenant_users where user_id = auth.uid()))';
    execute 'drop policy if exists "tenant isolation delete" on whatsapp_sessions';
    execute 'create policy "tenant isolation delete" on whatsapp_sessions for delete using (tenant_id in (select tenant_id from tenant_users where user_id = auth.uid()))';

    -- contacts
    execute 'drop policy if exists "tenant isolation select" on contacts';
    execute 'create policy "tenant isolation select" on contacts for select using (tenant_id in (select tenant_id from tenant_users where user_id = auth.uid()))';
    execute 'drop policy if exists "tenant isolation insert" on contacts';
    execute 'create policy "tenant isolation insert" on contacts for insert with check (tenant_id in (select tenant_id from tenant_users where user_id = auth.uid()))';
    execute 'drop policy if exists "tenant isolation update" on contacts';
    execute 'create policy "tenant isolation update" on contacts for update using (tenant_id in (select tenant_id from tenant_users where user_id = auth.uid()))';
    execute 'drop policy if exists "tenant isolation delete" on contacts';
    execute 'create policy "tenant isolation delete" on contacts for delete using (tenant_id in (select tenant_id from tenant_users where user_id = auth.uid()))';

    -- conversations
    execute 'drop policy if exists "tenant isolation select" on conversations';
    execute 'create policy "tenant isolation select" on conversations for select using (tenant_id in (select tenant_id from tenant_users where user_id = auth.uid()))';
    execute 'drop policy if exists "tenant isolation insert" on conversations';
    execute 'create policy "tenant isolation insert" on conversations for insert with check (tenant_id in (select tenant_id from tenant_users where user_id = auth.uid()))';
    execute 'drop policy if exists "tenant isolation update" on conversations';
    execute 'create policy "tenant isolation update" on conversations for update using (tenant_id in (select tenant_id from tenant_users where user_id = auth.uid()))';
    execute 'drop policy if exists "tenant isolation delete" on conversations';
    execute 'create policy "tenant isolation delete" on conversations for delete using (tenant_id in (select tenant_id from tenant_users where user_id = auth.uid()))';

    -- messages
    execute 'drop policy if exists "tenant isolation select" on messages';
    execute 'create policy "tenant isolation select" on messages for select using (tenant_id in (select tenant_id from tenant_users where user_id = auth.uid()))';
    execute 'drop policy if exists "tenant isolation insert" on messages';
    execute 'create policy "tenant isolation insert" on messages for insert with check (tenant_id in (select tenant_id from tenant_users where user_id = auth.uid()))';
    execute 'drop policy if exists "tenant isolation update" on messages';
    execute 'create policy "tenant isolation update" on messages for update using (tenant_id in (select tenant_id from tenant_users where user_id = auth.uid()))';
    execute 'drop policy if exists "tenant isolation delete" on messages';
    execute 'create policy "tenant isolation delete" on messages for delete using (tenant_id in (select tenant_id from tenant_users where user_id = auth.uid()))';

    -- knowledge_items
    execute 'drop policy if exists "tenant isolation select" on knowledge_items';
    execute 'create policy "tenant isolation select" on knowledge_items for select using (tenant_id in (select tenant_id from tenant_users where user_id = auth.uid()))';
    execute 'drop policy if exists "tenant isolation insert" on knowledge_items';
    execute 'create policy "tenant isolation insert" on knowledge_items for insert with check (tenant_id in (select tenant_id from tenant_users where user_id = auth.uid()))';
    execute 'drop policy if exists "tenant isolation update" on knowledge_items';
    execute 'create policy "tenant isolation update" on knowledge_items for update using (tenant_id in (select tenant_id from tenant_users where user_id = auth.uid()))';
    execute 'drop policy if exists "tenant isolation delete" on knowledge_items';
    execute 'create policy "tenant isolation delete" on knowledge_items for delete using (tenant_id in (select tenant_id from tenant_users where user_id = auth.uid()))';

    -- agent_settings
    execute 'drop policy if exists "tenant isolation select" on agent_settings';
    execute 'create policy "tenant isolation select" on agent_settings for select using (tenant_id in (select tenant_id from tenant_users where user_id = auth.uid()))';
    execute 'drop policy if exists "tenant isolation insert" on agent_settings';
    execute 'create policy "tenant isolation insert" on agent_settings for insert with check (tenant_id in (select tenant_id from tenant_users where user_id = auth.uid()))';
    execute 'drop policy if exists "tenant isolation update" on agent_settings';
    execute 'create policy "tenant isolation update" on agent_settings for update using (tenant_id in (select tenant_id from tenant_users where user_id = auth.uid()))';
    execute 'drop policy if exists "tenant isolation delete" on agent_settings';
    execute 'create policy "tenant isolation delete" on agent_settings for delete using (tenant_id in (select tenant_id from tenant_users where user_id = auth.uid()))';

    -- project_profiles
    execute 'drop policy if exists "tenant isolation select" on project_profiles';
    execute 'create policy "tenant isolation select" on project_profiles for select using (tenant_id in (select tenant_id from tenant_users where user_id = auth.uid()))';
    execute 'drop policy if exists "tenant isolation insert" on project_profiles';
    execute 'create policy "tenant isolation insert" on project_profiles for insert with check (tenant_id in (select tenant_id from tenant_users where user_id = auth.uid()))';
    execute 'drop policy if exists "tenant isolation update" on project_profiles';
    execute 'create policy "tenant isolation update" on project_profiles for update using (tenant_id in (select tenant_id from tenant_users where user_id = auth.uid()))';
    execute 'drop policy if exists "tenant isolation delete" on project_profiles';
    execute 'create policy "tenant isolation delete" on project_profiles for delete using (tenant_id in (select tenant_id from tenant_users where user_id = auth.uid()))';

    -- handoff_requests
    execute 'drop policy if exists "tenant isolation select" on handoff_requests';
    execute 'create policy "tenant isolation select" on handoff_requests for select using (tenant_id in (select tenant_id from tenant_users where user_id = auth.uid()))';
    execute 'drop policy if exists "tenant isolation insert" on handoff_requests';
    execute 'create policy "tenant isolation insert" on handoff_requests for insert with check (tenant_id in (select tenant_id from tenant_users where user_id = auth.uid()))';
    execute 'drop policy if exists "tenant isolation update" on handoff_requests';
    execute 'create policy "tenant isolation update" on handoff_requests for update using (tenant_id in (select tenant_id from tenant_users where user_id = auth.uid()))';
    execute 'drop policy if exists "tenant isolation delete" on handoff_requests';
    execute 'create policy "tenant isolation delete" on handoff_requests for delete using (tenant_id in (select tenant_id from tenant_users where user_id = auth.uid()))';

    -- audit_logs
    execute 'drop policy if exists "tenant isolation select" on audit_logs';
    execute 'create policy "tenant isolation select" on audit_logs for select using (tenant_id in (select tenant_id from tenant_users where user_id = auth.uid()))';

    -- webhook_events
    execute 'drop policy if exists "tenant isolation select" on webhook_events';
    execute 'create policy "tenant isolation select" on webhook_events for select using (tenant_id in (select tenant_id from tenant_users where user_id = auth.uid()))';

    -- failed_jobs
    execute 'drop policy if exists "tenant isolation select" on failed_jobs';
    execute 'create policy "tenant isolation select" on failed_jobs for select using (tenant_id in (select tenant_id from tenant_users where user_id = auth.uid()))';

    -- orders
    execute 'drop policy if exists "tenant isolation select" on orders';
    execute 'create policy "tenant isolation select" on orders for select using (tenant_id in (select tenant_id from tenant_users where user_id = auth.uid()))';
    execute 'drop policy if exists "tenant isolation insert" on orders';
    execute 'create policy "tenant isolation insert" on orders for insert with check (tenant_id in (select tenant_id from tenant_users where user_id = auth.uid()))';
    execute 'drop policy if exists "tenant isolation update" on orders';
    execute 'create policy "tenant isolation update" on orders for update using (tenant_id in (select tenant_id from tenant_users where user_id = auth.uid()))';
    execute 'drop policy if exists "tenant isolation delete" on orders';
    execute 'create policy "tenant isolation delete" on orders for delete using (tenant_id in (select tenant_id from tenant_users where user_id = auth.uid()))';

    -- support_tickets
    execute 'drop policy if exists "tenant isolation select" on support_tickets';
    execute 'create policy "tenant isolation select" on support_tickets for select using (tenant_id in (select tenant_id from tenant_users where user_id = auth.uid()))';
    execute 'drop policy if exists "tenant isolation insert" on support_tickets';
    execute 'create policy "tenant isolation insert" on support_tickets for insert with check (tenant_id in (select tenant_id from tenant_users where user_id = auth.uid()))';
    execute 'drop policy if exists "tenant isolation update" on support_tickets';
    execute 'create policy "tenant isolation update" on support_tickets for update using (tenant_id in (select tenant_id from tenant_users where user_id = auth.uid()))';
    execute 'drop policy if exists "tenant isolation delete" on support_tickets';
    execute 'create policy "tenant isolation delete" on support_tickets for delete using (tenant_id in (select tenant_id from tenant_users where user_id = auth.uid()))';
end $$;
