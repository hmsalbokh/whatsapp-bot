# OpenWA WhatsApp AI Agent

A production‑ready MVP for an AI‑powered WhatsApp customer service bot built with:

- **Next.js 15** (App Router, TypeScript)
- **OpenWA** as the WhatsApp gateway
- **OpenRouter** (LLM provider) for generating replies
- **Supabase** for persistent conversation memory
- A simple **admin UI** to monitor conversations and toggle auto‑reply

## Features

- Receive WhatsApp messages via an OpenWA webhook
- Store inbound/outbound messages per customer phone number
- Use an LLM (configurable model) with a custom Arabic system prompt
- Optional tool‑calling (business hours, shipping info, escalate to human)
- Persistent memory via Supabase tables `conversations` and `messages`
- Admin dashboard to view conversations, enable/disable auto‑reply, send manual messages
- Designed for easy deployment to Vercel (environment variables only)

## Project Structure

```
openwa-whatsapp-ai-agent/
├─ app/
│  ├─ layout.tsx
│  ├─ page.tsx
│  ├─ admin/
│  │  └─ page.tsx
│  └─ api/
│     ├─ openwa/
│     │  └─ webhook/
│     │     └─ route.ts
│     └─ admin/
│        └─ send/
│           └─ route.ts
├─ lib/
│  ├─ supabase.ts
│  ├─ openwa.ts
│  ├─ openrouter.ts
│  ├─ agent.ts
│  ├─ tools.ts
│  └─ types.ts
├─ .env.example
├─ README.md
├─ next.config.ts
├─ package.json
└─ tsconfig.json
```

## Prerequisites

- Node.js >= 18
- An **OpenWA** instance running and reachable (see below)
- A **Supabase** project (free tier works)
- An **OpenRouter** API key
- (Optional) **ngrok** for local testing if OpenWA runs on localhost

## Setup

### 1. Clone & install

```bash
git clone <your-repo-url>
cd openwa-whatsapp-ai-agent
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` (for development) or set the variables in your Vercel project settings.

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual values:

```
OPENWA_BASE_URL=http://localhost:2785          # or your public URL (ngrok etc.)
OPENWA_API_TOKEN=owa_k1_...                    # from OpenWA dashboard
OPENROUTER_API_KEY=sk-or-v1-...                # from OpenRouter
OPENROUTER_MODEL=openai/gpt-4o-mini            # or any supported model
SYSTEM_PROMPT=                                 # optional override

SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=service_role:...

ADMIN_SECRET=change_this_to_a_random_string   # used to protect admin endpoints

BUSINESS_NAME=مثال للتجارة
BUSINESS_DESCRIPTION=متجر إلكتروني للسلع الاستهلاكية
BUSINESS_HOURS=9:00 ص - 5:00 م (السبت - الأربعاء)
BUSINESS_TONE=محترف ومهذب
```

### 3. Database schema

Run the following SQL in your Supabase SQL editor to create the required tables:

```sql
create table conversations (
    id uuid primary key default uuid_generate_v4(),
    customer_phone text not null unique,
    customer_name text,
    bot_enabled boolean not null default true,
    human_handoff boolean not null default false,
    last_message_at timestamptz,
    created_at timestamptz default now()
);

create table messages (
    id uuid primary key default uuid_generate_v4(),
    conversation_id uuid not null references conversations(id) on delete cascade,
    direction text not null check (direction in ('inbound','outbound')),
    role text not null check (role in ('user','assistant','system')),
    text text not null,
    raw_payload jsonb,
    created_at timestamptz default now()
);

create index idx_messages_conversation_id on messages(conversation_id);
create index idx_messages_created_at on messages(created_at);
```

### 4. Running locally

Make sure your OpenWA instance is running and accessible at the URL you set in `OPENWA_BASE_URL`.  
If you are running OpenWA locally (`http://localhost:2785`) and want to test from your machine, expose it with ngrok:

```bash
ngrok http 2785
```

Take the forwarded HTTPS URL (e.g., `https://abcd1234.ngrok.io`) and set `OPENWA_BASE_URL` to that value in `.env.local`.

Then start the Next.js dev server:

```bash
npm run dev
```

Visit `http://localhost:3000` for the landing page, and `/admin` for the admin dashboard.

### 5. Deploying to Vercel

1. Push the code to a GitHub/GitLab/Bitbucket repository.
2. Import the repository in Vercel.
3. Add the same environment variables (from `.env`) in the project settings.
4. Deploy! Vercel will automatically serve the app.

**Note:** Since `OPENWA_BASE_URL` must point to a publicly reachable OpenWA instance, you will need to run OpenWA on a server or use a service like ngrok with a stable subdomain (paid) or a cloud VM.

### 6. Testing the webhook

You can simulate an inbound WhatsApp message with curl:

```bash
curl -X POST https://your-vercel-app.vercel.app/api/openwa/webhook \
  -H "Content-Type: application/json" \
  -d '{
        "from":"96650000000",
        "body":"السلام عليكم، أريد معرفة حالة طلبي",
        "messageId":"test123",
        "timestamp":1730000000
      }'
```

You should receive a JSON response like `{"status":"ok","replySent":true}` and see a reply sent back via your OpenWA instance.

### 7. Admin panel usage

- The admin page lists all conversations (phone number, last message time, bot enabled flag, human handoff flag).
- Click a conversation to see the recent message exchange.
- Use the “Send manual message” form at the bottom to reply directly via OpenWA.
- Toggle the button to enable/disable auto‑reply for a specific conversation (useful when a human agent takes over).

### 8. How the bot works

1. **Webhook** receives `message.received` from OpenWA.
2. It loads (or creates) the conversation for the sender’s phone number.
3. If the conversation is marked `human_handoff=true` or `bot_enabled=false`, it stores the message and does **not** generate a reply (you can customise this behavior).
4. Otherwise, it builds a conversation history (system prompt + last 10 messages) and calls **OpenRouter** with the defined tools.
5. The model may decide to use a tool (e.g., `escalate_to_human`, `get_business_hours`). The agent executes the tool, updates the conversation state if needed, and calls the model again to obtain the final text.
6. The final reply is saved, the `last_message_at` timestamp is updated, and the message is sent back to the user via the **OpenWA API**.
7. The webhook returns a 200 OK to acknowledge receipt.

### 9. Customisation

- **System prompt**: adjust via `SYSTEM_PROMPT` env variable.
- **Tools**: edit `lib/tools.ts` to add/remove tools (remember to update the definitions and handlers).
- **Memory window**: change the number of recent messages fetched in `agent.ts` (currently 10).
- **Styling**: the admin page uses Tailwind; modify `app/globals.css` or add a `tailwind.config.js` if needed.

### 10. License

MIT – feel free to fork and adapt.

--- 

**Happy coding!** If you have any questions, open an issue or reach out.