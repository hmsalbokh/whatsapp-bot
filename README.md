# 🤖 WhatsApp Bot — خدمة العملاء الذكية

بوت واتساب متقدم لخدمة العملات مكتوب بـ **Next.js 15 (App Router) + TypeScript + Tailwind v4**، جاهز للنشر على **Vercel**.

## 🧱 المعمارية

```
WhatsApp → OpenWA → Webhook → OpenRouter → Tool Calling → OpenWA Reply
```

| الطبقة | التقنية |
|--------|---------|
| واجهة المحادثة | WhatsApp |
| منصة واتساب API | [OpenWA](https://openwa.dev) |
| نقطة الاستقبال | Next.js Route Handler (`app/api/openwa/webhook/route.ts`) |
| الذكاء الاصطناعي | [OpenRouter](https://openrouter.ai) (Chat Completions + Function Calling) |
| الأدوات | `get_order_status` · `search_faq` · `create_support_ticket` · `handoff_to_human` |
| الرد | OpenWA Send API |

## 🚀 البدء السريع

```bash
git clone <repo>
cd whatsapp-bot
cp .env.example .env.local
npm install
npm run dev
```

## 🔐 المتغيرات البيئية (`.env.local`)

```
OPENROUTER_API_KEY=sk-or-v1-...
OPENWA_BASE_URL=https://your-instance.openwa.app
OPENWA_API_TOKEN=your-token

OPENROUTER_MODEL=google/gemini-2.5-flash-preview-04-17
SYSTEM_PROMPT=
```

## 📁 هيكل المشروع

```
whatsapp-bot/
├── app/
│   ├── api/openwa/webhook/route.ts    # ← نقطة استقبال Webhook
│   ├── globals.css                     # شيلل تايلويند
│   ├── layout.tsx                      # الـ Root Layout
│   └── page.tsx                        # الصفحة الرئيسية
├── lib/
│   ├── memory.ts                       # ذاكرة المحادثة (لكل رقم)
│   ├── mock-data.ts                    # بيانات وهمية
│   ├── openrouter.ts                   # OpenRouter API client
│   ├── openwa.ts                       # OpenWA API client
│   └── tools/
│       ├── index.ts                    # تسجيل الأدوات
│       ├── get-order-status.ts         # الاستعلام عن الطلب
│       ├── search-faq.ts               # البحث في الأسئلة
│       ├── create-support-ticket.ts    # إنشاء تذكرة دعم
│       └── handoff-to-human.ts         # تحويل بشري
├── types/index.ts                      # أنواع TypeScript
├── .env.example
├── .gitignore
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tsconfig.json
└── README.md
```

## 🧰 الأدوات (Functions / Tools)

| الأداة | الوظيفة |
|--------|---------|
| `get_order_status` | الاستعلام عن حالة طلب برقم الطلب |
| `search_faq` | البحث في قاعدة الأسئلة الشائعة |
| `create_support_ticket` | إنشاء تذكرة دعم فني |
| `handoff_to_human` | تحويل المحادثة إلى وكيل بشري |

كل أداة تستخدم **Zod** للتحقق من المدخلات وتعيد ردًا منسقًا لـ OpenRouter.

## 🧠 الذاكرة

يحفظ البوت سياق المحادثة لكل رقم واتساب في `Map` داخل الذاكرة (لا حاجة لقاعدة بيانات). يتم مسح الذاكرة عند إعادة تشغيل الخادم. كل محادثة تحتفظ بآخر ٤٠ رسالة.

## 🌐 Webhook Endpoint

```
POST /api/openwa/webhook
Content-Type: application/json

{
  "from": "9665xxxxxxxxx",
  "body": "السلام عليكم، أين طلبي؟",
  "messageId": "optional",
  "timestamp": 1234567890
}
```

الرد:

```json
{
  "status": "ok",
  "replySent": true,
  "duration": 1234
}
```

## 🚢 النشر على Vercel

1. ادفع الكود إلى GitHub
2. استورد المشروع في [Vercel](https://vercel.com/new)
3. أضف المتغيرات البيئية
4. انشر 🎉

## 📝 System Prompt

النظام مبرمج مسبقًا بـ System Prompt عربي احترافي لخدمة العملات. يمكنك تخصيصه عبر متغير `SYSTEM_PROMPT` أو تعديله مباشرة في `lib/memory.ts`.

## 📄 الترخيص

MIT
