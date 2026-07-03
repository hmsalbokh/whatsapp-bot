# OpenWA WhatsApp AI Agent - Plan

## Overview
AI-powered WhatsApp customer service bot using OpenWA as gateway, Next.js as webhook backend, OpenRouter as AI provider, and Supabase for memory.

## Architecture
Customer WhatsApp Message → OpenWA → Next.js Webhook → AI Agent (OpenRouter) → Save Memory (Supabase) → Reply via OpenWA API

## Project Structure
```
openwa-whatsapp-ai-agent/
├── app/
│   ├── layout.tsx                    # Root layout, RTL Arabic, Tailwind
│   ├── page.tsx                      # Landing page
│   ├── globals.css                   # Tailwind directives
│   ├── admin/
│   │   └── page.tsx                  # Admin dashboard (client component)
│   └── api/
│       ├── openwa/webhook/route.ts   # POST - Receive webhook from OpenWA
│       ├── admin/send/route.ts       # POST - Send manual message via OpenWA
│       ├── admin/conversations/route.ts  # GET list, PATCH toggle bot/handoff
│       └── admin/messages/route.ts   # GET messages by conversation_id
├── lib/
│   ├── types.ts                      # All TypeScript interfaces
│   ├── supabase.ts                   # Lazy Supabase client + DB helpers
│   ├── openwa.ts                     # OpenWA API wrapper (sendMessage, getStatus)
│   ├── openrouter.ts                 # OpenRouter API wrapper (chat)
│   ├── tools.ts                      # Bot tools (business hours, shipping info, escalate)
│   └── agent.ts                      # AI agent logic (system prompt, tools loop)
├── supabase-schema.sql               # SQL to create conversations + messages tables
├── .env.example                      # Environment variables template
├── .env.local                        # Actual env vars (Supabase, admin secret)
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
└── package.json
```

## What Was Built

### Core Logic
- **Webhook endpoint** (`app/api/openwa/webhook/route.ts`): Receives POST from OpenWA, validates payload, calls agent.processMessage, sends reply via OpenWA API
- **AI Agent** (`lib/agent.ts`): Builds system prompt with business info (Arabic customer-service tone), calls OpenRouter with conversation history (last 10 messages), handles tool calls in a loop (max 3 iterations), detects handoff requests
- **OpenRouter wrapper** (`lib/openrouter.ts`): Configurable model via env var, sends messages with tool definitions, returns parsed response
- **OpenWA wrapper** (`lib/openwa.ts`): sendMessage(to, text) and getStatus() with auth token
- **Tools** (`lib/tools.ts`): 4 tools - get_business_hours, get_shipping_info, escalate_to_human, get_current_time

### Memory (Supabase)
- **2 tables**: `conversations` (per customer) and `messages` (per conversation)
- **Helpers**: getOrCreateConversation, saveInboundMessage, saveOutboundMessage, getRecentMessagesForContext, toggleBot, setHumanHandoff, updateLastMessageAt, getConversations, getMessages
- **Lazy client**: Supabase initialized on first call, not at module load (prevents build failures)

### Admin Dashboard (`/admin`)
- Login prompt for admin secret (no cookies, session-only state)
- Left panel: conversation list with status badges (تلقائي/متوقف/يدوي)
- Right panel: message history with bubble UI, toggle bot on/off, return to bot from handoff
- Manual send form to reply via OpenWA API
- RTL Arabic UI with Tailwind

### Admin API Routes
- `GET /api/admin/conversations` - list all conversations (auth: x-admin-secret)
- `PATCH /api/admin/conversations` - toggle bot_enabled / human_handoff
- `GET /api/admin/messages?conversation_id=xxx` - get messages
- `POST /api/admin/send` - send manual message via OpenWA

## Issues Fixed

| Issue | Fix |
|-------|-----|
| Wrong type import `OpenAIChatMessage` | Changed to `ConversationMessage` |
| System prompt in Russian | Rewritten in professional Arabic |
| Duplicated DB functions in agent.ts | Removed, imported from supabase.ts |
| Invalid dynamic import `from await import` | Fixed to top-level import |
| Wrong property `text` vs `content` | Unified to use `content` |
| Module-level Supabase init (build fail) | Lazy initialization |
| Supabase generic type errors | Removed `.from<T>()` generics, use type assertions |
| `trimEnd('/')` not accepting args | Changed to `replace(/\/+$/, '')` |
| Wrong path `@/types` | Changed to `@/lib/types` in all files |
| Missing `'use client'` in admin page | Added directive |
| Missing React import | Added import |
| Broken `</div>` instead of `</h2>` | Fixed closing tag |
| Broken toggle buttons logic | Fixed conditional rendering |
| Missing admin auth on send endpoint | Added `x-admin-secret` validation |
| Tailwind not configured | Added tailwind.config.ts, postcss.config.mjs, globals.css |
| Hydration mismatch (cookie on server vs client) | Removed cookies, use React state only |
| Client component using process.env (undefined in browser) | Created server-side API routes, admin page fetches from them |
| Multiple lockfile warning | Added `outputFileTracingRoot` to next.config.ts |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENWA_BASE_URL` | OpenWA instance URL |
| `OPENWA_API_TOKEN` | OpenWA API token |
| `OPENROUTER_API_KEY` | OpenRouter API key |
| `OPENROUTER_MODEL` | Model (default: google/gemini-2.5-flash) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `ADMIN_SECRET` | Admin panel password |
| `BUSINESS_NAME` | Company name (Arabic) |
| `BUSINESS_DESCRIPTION` | Company description |
| `BUSINESS_HOURS` | Business hours |
| `BUSINESS_TONE` | Tone of voice |

## How to Run
```bash
cd openwa-whatsapp-ai-agent
cp .env.example .env.local   # Edit with real values
npm install
npm run dev                  # http://localhost:3000
```

## How to Deploy (Vercel)
1. Push to GitHub
2. Import in Vercel
3. Add all env vars in Vercel dashboard
4. Deploy

## User Setup Checklist
- [x] Supabase tables created (SQL schema)
- [x] .env.local created with Supabase keys + admin secret
- [x] Dev server running
- [ ] OpenWA configured + webhook pointed to `/api/openwa/webhook`
- [ ] OpenRouter API key added
- [ ] Business info filled in .env.local
