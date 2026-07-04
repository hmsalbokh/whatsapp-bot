# مشروع WhatsApp Bot — خدمة العملاء الذكية

## نظرة عامة

بوت واتساب ذكي لخدمة العملات مكتوب بـ **Next.js 15 (App Router) + TypeScript + Tailwind v4**،
يستقبل رسائل واتساب عبر **OpenWA**، يعالجها بالذكاء الاصطناعي عبر **OpenRouter** مع **Function Calling**،
ويخزن المحادثات في **Supabase (PostgreSQL)**.

---

## معماریة النظام

```
WhatsApp → OpenWA → Webhook → Next.js Route Handler
    → Supabase (تخزين) → OpenRouter (ذكاء اصطناعي)
        → تنفيذ أداة → إرسال الرد عبر OpenWA → WhatsApp
```

| الطبقة | التقنية |
|--------|---------|
| واجهة المحادثة | WhatsApp |
| منصة واتساب API | [OpenWA](https://openwa.dev) |
| نقطة الاستقبال | Next.js Route Handler (`app/api/openwa/webhook/route.ts`) |
| الذكاء الاصطناعي | [OpenRouter](https://openrouter.ai) — Chat Completions + Function Calling |
| قاعدة البيانات | Supabase (PostgreSQL) مع service_role key |
| التحقق من البيانات | Zod v3 |
| الواجهة الأمامية | Next.js + Tailwind v4 (لوحة تحكم تجريبية) |

---

## هيكل المشروع

```
whatsapp-bot/
├── .env.example                        # قالب المتغيرات البيئية
├── .env.local                          # المتغيرات الفعلية
├── .gitignore
├── next.config.ts                      # إعدادات Next.js
├── package.json                        # التبعيات والسكريبتات
├── tsconfig.json                       # إعدادات TypeScript
├── postcss.config.mjs                  # PostCSS + Tailwind
├── eslint.config.mjs                   # ESLint
├── README.md                           # توثيق بالعربية
├── project.md                          # هذا الملف
│
├── types/
│   └── index.ts                        # كل أنواع TypeScript
│
├── supabase/
│   └── migration.sql                   # مخطط قاعدة البيانات كامل
│
├── app/
│   ├── globals.css                     # @import "tailwindcss"
│   ├── layout.tsx                      # Root Layout (RTL, lang=ar)
│   ├── page.tsx                        # لوحة تحكم محاكي المحادثة
│   │
│   └── api/
│       ├── openwa/webhook/route.ts     # Webhook الرئيسي (POST + GET)
│       └── chat/route.ts              # API داخلية للوحة التحكم
│
├── lib/
│   ├── supabase.ts                     # عميل Supabase
│   ├── memory.ts                       # إدارة المحادثات (CRUD)
│   ├── openrouter.ts                   # عميل OpenRouter API
│   ├── openwa.ts                       # عميل OpenWA API
│   ├── mock-data.ts                    # بيانات وهمية (طلبات، أسئلة)
│   │
│   └── tools/
│       ├── index.ts                    # تسجيل وتنفيذ الأدوات
│       ├── get-order-status.ts         # الاستعلام عن طلب
│       ├── search-faq.ts               # البحث في الأسئلة الشائعة
│       ├── create-support-ticket.ts    # إنشاء تذكرة دعم
│       └── handoff-to-human.ts         # تحويل لوكيل بشري
│
└── openwa-whatsapp-ai-agent/          # مشروع فرعي منفصل
```

---

## تدفق العمل (Webhook Flow)

### 1. استقبال الرسالة
`OpenWA` يرسل طلب POST إلى `/api/openwa/webhook`:
```json
{
  "from": "9665xxxxxxxxx",
  "body": "السلام عليكم، أين طلبي؟",
  "messageId": "optional",
  "timestamp": 1234567890
}
```

### 2. التحقق والتخزين
- التحقق من الصحة عبر **Zod**
- تخزين رسالة المستخدم في جدول `messages` عبر `addMessage(phone, ...)`
- إنشاء محادثة جديدة إذا كان الرقم جديدًا (`getOrCreateConversation`)

### 3. المعالجة بالذكاء الاصطناعي
- جلب آخر 50 رسالة من قاعدة البيانات + الـ System Prompt
- استدعاء **OpenRouter** مع تعريفات الأدوات (`toolDefinitions`)
- **Tool Loop** (حد أقصى 5 جولات):

  **أ.** إرسال المحادثة الكاملة إلى OpenRouter
  
  **ب.** إذا رد بـ `tool_calls`:
     - تخزين رد المساعد مع `tool_calls`
     - لكل أداة: تحليل المعطيات → تنفيذ الهاندلر → تخزين النتيجة
     - العودة للخطوة (أ) لإرسال نتائج الأدوات للذكاء الاصطناعي

  **ج.** إذا رد بنص عادي (`stop`):
     - تخزين الرد النهائي
     - إرجاع النص

### 4. إرسال الرد
- إرسال النص عبر OpenWA: `POST {baseUrl}/api/send`
- إرجاع الاستجابة: `{ status: "ok", replySent: true, duration: 1234 }`

### 5. مسار بديل (لوحة التحكم)
`POST /api/chat` يعمل بنفس المنطق لكن يعيد `{ reply, toolCalls, duration }` للمتصفح بدل إرسال واتساب.

---

## الأدوات (Tools)

| الأداة | الوظيفة | المعطيات |
|--------|---------|----------|
| `get_order_status` | الاستعلام عن حالة طلب | `order_id: string` |
| `search_faq` | البحث في الأسئلة الشائعة | `query: string` |
| `create_support_ticket` | إنشاء تذكرة دعم فني | `customer_name, issue, priority?` |
| `handoff_to_human` | تحويل المحادثة لوكيل بشري | `reason: string` |

كل أداة تستخدم **Zod** للتحقق من المدخلات وتعيد `ToolResult`:
```typescript
type ToolResult =
  | { status: "success"; data: unknown }
  | { status: "error"; message: string };
```

### get_order_status
- يبحث في `mockOrders` (3 طلبات وهمية: ORD-1001, ORD-1002, ORD-1003)
- يعيد حالة الطلب، المنتجات، المجموع، تاريخ التحديث

### search_faq
- يبحث في `mockFaq` (5 أسئلة شائعة)
- يطابق الاستعلام مع السؤال، الكلمات المفتاحية، والإجابة

### create_support_ticket
- ينشئ تذكرة برقم تصاعدي (TKT-0001, TKT-0002...)
- الأولوية: `low | medium | high` (الافتراضي: medium)

### handoff_to_human
- يضبط `human_handoff = true` في قاعدة البيانات
- جميع الرسائل اللاحقة تعيد: "تم تحويل محادثتك إلى فريق الدعم البشري"

---

## قاعدة البيانات (Supabase)

### جدول `conversations`

| العمود | النوع | القيد | الوصف |
|--------|------|------|-------|
| `id` | `uuid` | PK, `gen_random_uuid()` | معرف المحادثة |
| `customer_phone` | `text` | UNIQUE, NOT NULL | رقم واتساب العميل |
| `customer_name` | `text` | nullable | اسم العميل |
| `bot_enabled` | `boolean` | DEFAULT true | هل البوت نشط |
| `human_handoff` | `boolean` | DEFAULT false | هل تم التحويل لبشر |
| `assigned_agent` | `text` | nullable | الوكيل البشري أو سبب التحويل |
| `last_message_at` | `timestamptz` | nullable | آخر رسالة |
| `last_inbound_at` | `timestamptz` | nullable | آخر رسالة واردة |
| `last_outbound_at` | `timestamptz` | nullable | آخر رسالة صادرة |
| `bot_paused_until` | `timestamptz` | nullable | إيقاف البوت مؤقتًا حتى |
| `created_at` | `timestamptz` | DEFAULT now() | تاريخ الإنشاء |
| `updated_at` | `timestamptz` | DEFAULT now() | آخر تحديث (تلقائي) |

### جدول `messages`

| العمود | النوع | القيد | الوصف |
|--------|------|------|-------|
| `id` | `uuid` | PK, `gen_random_uuid()` | معرف الرسالة |
| `conversation_id` | `uuid` | FK → conversations(id) CASCADE | المحادثة الأم |
| `external_message_id` | `text` | nullable | معرف خارجي (من واتساب) |
| `direction` | `text` | CHECK ('inbound', 'outbound') | اتجاه الرسالة |
| `role` | `text` | CHECK ('user','assistant','system','admin','tool') | دور الرسالة |
| `message_type` | `text` | DEFAULT 'text' | نوعها (text, tool_calls) |
| `status` | `text` | nullable | حالة التوصيل |
| `content` | `text` | NOT NULL | نص الرسالة |
| `raw_payload` | `jsonb` | nullable | البيانات الخام (tool_calls) |
| `created_at` | `timestamptz` | DEFAULT now() | تاريخ الإنشاء |

### جدول `webhook_events`
مسجل أحداث webhook (للتدقيق المستقبلي — لا يُستخدم حاليًا في الكود).

### الفهارس (Indexes)
- `messages`: `conversation_id`, `created_at`, `external_message_id`
- `conversations`: `customer_phone`, `last_message_at DESC`
- `webhook_events`: `created_at DESC`

### المحفز (Trigger)
`set_conversations_updated_at` — يضبط `updated_at = now()` تلقائيًا قبل كل UPDATE.

---

## المتغيرات البيئية

| المتغير | مطلوب | الافتراضي | الشرح |
|---------|-------|-----------|-------|
| `OPENROUTER_API_KEY` | ✅ | — | مفتاح OpenRouter (`sk-or-v1-...`) |
| `OPENWA_BASE_URL` | ✅ | — | رابط خادم OpenWA |
| `OPENWA_API_TOKEN` | ✅ | — | توكن OpenWA (`owa_k1_...`) |
| `SUPABASE_URL` | ✅ | — | رابط مشروع Supabase |
| `SUPABASE_SERVICE_KEY` | ✅ | — | مفتاح service_role (يتجاوز RLS) |
| `OPENROUTER_MODEL` | ❌ | `openai/gpt-4o-mini` | اسم الموديل |
| `SYSTEM_PROMPT` | ❌ | مدمج (عربي) | تعليمات النظام المخصصة |

---

## أنواع TypeScript الرئيسية

```typescript
// رسالة المحادثة (لـ OpenRouter)
ConversationMessage {
  role: "system" | "user" | "assistant" | "tool"
  content: string
  tool_call_id?: string
  name?: string
  tool_calls?: OpenRouterToolCall[]
}

// استدعاء أداة من OpenRouter
OpenRouterToolCall {
  id: string
  type: "function"
  function: { name: string; arguments: string }
}

// تعريف الأداة
ToolDefinition {
  type: "function"
  function: { name: string; description: string; parameters: object }
}

// نتيجة تنفيذ الأداة
ToolResult =
  | { status: "success"; data: unknown }
  | { status: "error"; message: string }

// صفوف قاعدة البيانات
DbConversation { id, customer_phone, customer_name, bot_enabled, ... }
DbMessage { id, conversation_id, direction, role, content, raw_payload, ... }
```

---

## سكريبتات npm

| السكريبت | الأمر | الوظيفة |
|----------|-------|---------|
| `dev` | `next dev` | تشغيل خادم التطوير |
| `build` | `next build` | بناء للإنتاج |
| `start` | `next start` | تشغيل الإنتاج |
| `lint` | `next lint` | فحص الكود |
| `typecheck` | `tsc --noEmit` | فحص الأنواع |

---

## التخزين (Memory Layer)

ملف `lib/memory.ts` هو الواجهة الوحيدة لقاعدة البيانات:

| الدالة | الوظيفة |
|--------|---------|
| `getOrCreateConversation(phone)` | إيجاد أو إنشاء محادثة |
| `addMessage(phone, message)` | تخزين رسالة + تحديث التوقيتات |
| `getMessages(phone)` | جلب آخر 50 رسالة + System Prompt |
| `setHandoffRequested(phone, reason)` | تفعيل التحويل البشري |
| `isHandoffRequested(phone)` | التحقق من حالة التحويل |
| `clearMemory(phone)` | حذف المحادثة ورسائلها |

---

## واجهة المستخدم (Dashboard)

`app/page.tsx` — لوحة تحكم كاملة لمحاكاة المحادثة:
- واجهة RTL عربية
- شريط جانبي بقائمة المحادثات
- فقاعات محادثة (المستخدم = أبيض، البوت = أزرق)
- لوحة تفاصيل الأدوات (أصفر، قابل للطي)
- حقل إدخال رقم الهاتف والرسالة
- إضافة وحذف المحادثات

---

## ملاحظات هامة

1. **المشروع لا يستخدم RLS** — يتصل Supabase بـ `service_role key` من الخادم فقط
2. **جدول `webhook_events`** موجود في قاعدة البيانات لكن لا يُستخدم في الكود حاليًا
3. **الحد الأقصى لدورة الأدوات** هو 5 جولات، بعدها يعيد رسالة اعتذار
4. **لا يوجد توثيق (Authentication)** للـ Webhook — أي طلب POST مقبول
5. **النظام حاليًا بدون Webhook Auth** — يُنصح بإضافته للإنتاج
6. **البيانات الوهمية** (الطلبات والأسئلة) قابلة للاستبدال بقاعدة بيانات حقيقية
