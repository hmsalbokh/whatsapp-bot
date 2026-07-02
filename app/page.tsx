"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface ToolCall {
  name: string;
  args: string;
  result: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  body: string;
  timestamp: number;
  toolCalls?: ToolCall[];
}

interface Conversation {
  phone: string;
  label: string;
  messages: Message[];
}

const PHONE_LABELS: Record<string, string> = {
  "966501234567": "أحمد محمد",
  "966555555555": "سارة علي",
  "966500000000": "خالد عمر",
};

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

function fmt(ts: number) {
  return new Date(ts).toLocaleTimeString("ar-SA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function label(phone: string) {
  return PHONE_LABELS[phone] ?? phone;
}

function initials(s: string) {
  const t = s.trim();
  return /^\d+$/.test(t) ? t.slice(-4) : t.slice(0, 2);
}

const TOOL_NAMES: Record<string, string> = {
  get_order_status: "🔍 الاستعلام عن الطلب",
  search_faq: "📚 البحث في الأسئلة الشائعة",
  create_support_ticket: "🎫 إنشاء تذكرة دعم",
  handoff_to_human: "👤 تحويل إلى وكيل بشري",
};

export default function Dashboard() {
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      phone: "966501234567",
      label: "أحمد محمد",
      messages: [],
    },
  ]);
  const [activePhone, setActivePhone] = useState("966501234567");
  const [inputBody, setInputBody] = useState("");
  const [sending, setSending] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const active = conversations.find((c) => c.phone === activePhone);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages, sending]);

  const doSend = useCallback(async () => {
    const body = inputBody.trim();
    const phone = activePhone;
    if (!body || !phone || sending) return;

    setSending(true);
    setErrMsg("");

    const userMsg: Message = {
      id: generateId(),
      role: "user",
      body,
      timestamp: Date.now(),
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.phone === phone ? { ...c, messages: [...c.messages, userMsg] } : c,
      ),
    );
    setInputBody("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: phone, body }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrMsg(data.detail ?? data.error ?? `خطأ ${res.status}`);
        return;
      }

      const assistantMsg: Message = {
        id: generateId(),
        role: "assistant",
        body: data.reply,
        timestamp: Date.now(),
        toolCalls: data.toolCalls?.length ? data.toolCalls : undefined,
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.phone === phone
            ? { ...c, messages: [...c.messages, assistantMsg] }
            : c,
        ),
      );
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : "خطأ في الاتصال");
    } finally {
      setSending(false);
    }
  }, [inputBody, activePhone, sending]);

  const addConversation = () => {
    const p = prompt("رقم الهاتف (مثال: 9665xxxxxxxx):");
    if (!p || !/^\d+$/.test(p)) return;
    if (conversations.some((c) => c.phone === p)) {
      setActivePhone(p);
      return;
    }
    setConversations((prev) => [...prev, { phone: p, label: label(p), messages: [] }]);
    setActivePhone(p);
  };

  const clearActive = () => {
    setConversations((prev) =>
      prev.map((c) => (c.phone === activePhone ? { ...c, messages: [] } : c)),
    );
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans" dir="rtl">
      {/* Sidebar */}
      <aside className="flex w-72 flex-col border-l bg-white shadow-sm">
        <div className="flex items-center justify-between border-b p-3">
          <h1 className="text-base font-bold text-gray-800">💬 المحادثات</h1>
          <button
            onClick={addConversation}
            className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700"
          >
            + جديد
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => {
            const last = conv.messages[conv.messages.length - 1];
            const act = conv.phone === activePhone;
            return (
              <button
                key={conv.phone}
                onClick={() => setActivePhone(conv.phone)}
                className={`flex w-full items-center gap-3 border-b px-3 py-3 text-right transition ${
                  act
                    ? "border-r-2 border-r-blue-600 bg-blue-50"
                    : "hover:bg-gray-50"
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                    act ? "bg-blue-600" : "bg-gray-500"
                  }`}
                >
                  {initials(conv.label)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-800">
                      {conv.label}
                    </span>
                    {last && (
                      <span className="text-xs text-gray-400">
                        {fmt(last.timestamp)}
                      </span>
                    )}
                  </div>
                  {last && (
                    <p className="truncate text-xs text-gray-500">
                      {last.role === "user" ? "👤" : "🤖"} {last.body}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Status */}
        <div className="border-t bg-gray-50 p-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
            OpenWA جاهز
            <span className="mr-auto">
              {conversations.reduce((a, c) => a + c.messages.length, 0)} رسالة
            </span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex flex-1 flex-col">
        {/* Header */}
        {active && (
          <div className="flex items-center justify-between border-b bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                {initials(active.label)}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {active.label}
                </p>
                <p className="text-xs text-gray-500">{active.phone}</p>
              </div>
            </div>
            <button
              onClick={clearActive}
              className="rounded-lg px-2.5 py-1 text-xs text-red-600 hover:bg-red-50"
            >
              🗑️ مسح المحادثة
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-[#e8f5e9] p-4">
          {active?.messages.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <p className="text-4xl">🤖</p>
                <p className="mt-2 text-sm text-gray-400">
                  أرسل رسالة لبدء المحادثة مع البوت الذكي
                </p>
              </div>
            </div>
          )}

          {active?.messages.map((msg) => (
            <div key={msg.id}>
              <div
                className={`mb-1 flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${
                    msg.role === "user"
                      ? "rounded-br-sm bg-white text-gray-800"
                      : "rounded-bl-sm bg-blue-600 text-white"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm leading-6">
                    {msg.body}
                  </p>
                  <p
                    className={`mt-1 text-[10px] ${
                      msg.role === "user" ? "text-gray-400" : "text-blue-200"
                    }`}
                  >
                    {fmt(msg.timestamp)}
                  </p>
                </div>
              </div>

              {/* Tool calls */}
              {msg.toolCalls && msg.toolCalls.length > 0 && (
                <div className="mb-3 flex justify-end">
                  <div className="space-y-1">
                    {msg.toolCalls.map((tc, i) => (
                      <details
                        key={i}
                        className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-1.5 text-xs"
                      >
                        <summary className="cursor-pointer font-medium text-yellow-800">
                          {TOOL_NAMES[tc.name] ?? `🔧 ${tc.name}`}
                        </summary>
                        <div className="mt-1 space-y-1">
                          <p className="text-gray-500">
                            <span className="font-semibold">المدخلات:</span>{" "}
                            {tc.args}
                          </p>
                          <p className="text-gray-500">
                            <span className="font-semibold">النتيجة:</span>{" "}
                            {tc.result}
                          </p>
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {sending && (
            <div className="mb-3 flex justify-end">
              <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-blue-600 px-4 py-3 text-white shadow-sm">
                <span className="h-2 w-2 animate-bounce rounded-full bg-white/70" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-white/70" style={{ animationDelay: "0.1s" }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-white/70" style={{ animationDelay: "0.2s" }} />
              </div>
            </div>
          )}

          {errMsg && (
            <div className="mb-3 flex justify-center">
              <div className="rounded-lg bg-red-100 px-4 py-2 text-xs text-red-700">
                ⚠️ {errMsg}
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="border-t bg-white p-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={activePhone}
              onChange={(e) => setActivePhone(e.target.value)}
              placeholder="رقم الجوال"
              className="w-36 shrink-0 rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
              dir="ltr"
            />
            <input
              type="text"
              value={inputBody}
              onChange={(e) => setInputBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  doSend();
                }
              }}
              placeholder="اكتب رسالتك هنا..."
              className="flex-1 rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
            />
            <button
              onClick={doSend}
              disabled={sending || !inputBody.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? "..." : "إرسال"}
            </button>
          </div>
          <div className="mt-1.5 text-[10px] text-gray-400">
            يستخدم <b>OpenRouter AI</b> + <b>OpenWA</b> — البوت يدعم العربية
          </div>
        </div>
      </main>
    </div>
  );
}
