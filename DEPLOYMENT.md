# نشر منصة WhatsApp Bot

## المتطلبات

- Node.js 20+
- Docker (اختياري)
- Supabase project (مجاني)
- OpenRouter API key
- OpenWA instance

## الخيار 1: نشر مباشر

```bash
# 1. تثبيت الاعتماديات
npm ci

# 2. إعداد المتغيرات
cp .env.example .env.local
# عدّل .env.local بالقيم الصحيحة

# 3. تشغيل قاعدة البيانات
# اذهب إلى Supabase dashboard → SQL Editor → شغّل supabase/migration.sql

# 4. بناء وتشغيل
npm run build
npm start
```

## الخيار 2: Docker

```bash
# 1. إعداد المتغيرات
cp .env.example .env.local
# عدّل .env.local بالقيم الصحيحة

# 2. بناء وتشغيل
docker compose up -d

# 3. تشغيل مع n8n sidecar (اختياري)
# افتح docker-compose.yml وأزل التعليق عن قسم n8n
docker compose up -d
```

## الخيار 3: Vercel

```bash
# 1. اربط المستودع بـ Vercel

# 2. أضف متغيرات البيئة في Vercel dashboard:
#    - NEXT_PUBLIC_SUPABASE_URL
#    - NEXT_PUBLIC_SUPABASE_ANON_KEY
#    - SUPABASE_SERVICE_KEY
#    - OPENROUTER_API_KEY
#    - NEXT_PUBLIC_SITE_URL
#    - OPENWA_BASE_URL (اختياري — للربط بـ OpenWA)
#    - OPENWA_API_TOKEN (اختياري)
#    - N8N_WEBHOOK_URL (اختياري — لربط n8n sidecar)

# 3. انشر
vercel --prod
```

## متغيرات البيئة

| المتغير | إجباري | الوصف |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | رابط Supabase project (من settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | المفتاح العام (anon key) |
| `SUPABASE_SERVICE_KEY` | ✅ | مفتاح service_role (للمهام الخلفية) |
| `OPENROUTER_API_KEY` | ✅ | مفتاح OpenRouter API |
| `NEXT_PUBLIC_SITE_URL` | ✅ | رابط الموقع (مثال: https://example.com) |
| `OPENROUTER_MODEL` | ❌ | الموديل الافتراضي (افتراضي: qwen/qwen-2.5-72b-instruct) |
| `OPENWA_BASE_URL` | ❌ | رابط خادم OpenWA |
| `OPENWA_API_TOKEN` | ❌ | رمز OpenWA API |
| `N8N_WEBHOOK_URL` | ❌ | رابط Webhook الخاص بـ n8n (لـ sidecar) |

## بنية النظام

```
┌─────────────────────────────────────┐
│        Next.js (Core App)           │
│  ┌───────┐ ┌───────┐ ┌──────────┐  │
│  │ Auth  │ │ Agent │ │ Memory   │  │
│  └───────┘ └───────┘ └──────────┘  │
│  ┌───────┐ ┌───────┐ ┌──────────┐  │
│  │ Tools │ │ Audit │ │ Retry    │  │
│  └───────┘ └───────┘ └──────────┘  │
└──────────┬──────────────────────────┘
           │
    ┌──────┴──────┐
    │  Supabase   │
    │  (DB + Auth)│
    └──────┬──────┘
           │
    ┌──────┴──────┐
    │  OpenRouter │ ← AI Models
    └─────────────┘
           │
    ┌──────┴──────┐
    │   OpenWA    │ ← WhatsApp Gateway
    └─────────────┘
           │
    ┌──────┴──────┐
    │  n8n (اختياري)│ ← Workflow Sidecar
    └─────────────┘
```

## التكاملات الخارجية

### n8n Sidecar
- `POST /api/sidecar/n8n` — n8n يستقبل events من Next.js
- n8n يرسل أوامر مثل `send_message`, `trigger_handoff`
- متغير البيئة: `N8N_WEBHOOK_URL`

### تكاملات عامة (Zapier, Make, إلخ)
- `POST /api/integrations/webhook` — استقبال أحداث من خدمات خارجية
- الحمولة: `{ source, event, projectId, phone?, payload? }`

### الإشعارات
- `GET /api/notifications?projectId=` — عرض الإشعارات
- `POST /api/notifications` — إنشاء إشعار

### لوحة القيادة
- `GET /api/health` — فحص شامل لحالة النظام
- `GET /api/handoffs?projectId=` — طلبات التحويل
- `GET /api/failed-jobs?projectId=` — الوظائف الفاشلة

## السلامة والأداء

- جميع المفاتيح السرية في متغيرات البيئة فقط
- RLS على مستوى الصف في Supabase
- service_role key للإجراءات الخلفية فقط (ليس في المتصفح)
- `withRetry()` يعيد المحاولة تلقائيًا 3 مرات للفشل
- `emitN8nEvent()` هو fire-and-forget — لا يحجب المعالجة الأساسية
- Idempotency عبر `external_message_id` يمنع المعالجة المكررة
