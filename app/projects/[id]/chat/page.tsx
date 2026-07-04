"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

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

const TOOL_NAMES: Record<string, string> = {
  get_order_status: "🔍 الاستعلام عن الطلب",
  search_faq: "📚 البحث في الأسئلة الشائعة",
  create_support_ticket: "🎫 إنشاء تذكرة دعم",
  handoff_to_human: "👤 تحويل إلى وكيل بشري",
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

export default function ChatPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const [phone, setPhone] = useState("966501234567");
  const [body, setBody] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const doSend = useCallback(async () => {
    const text = body.trim();
    if (!text || !phone || sending) return;

    setSending(true);
    setErrMsg("");

    const userMsg: Message = {
      id: generateId(),
      role: "user",
      body: text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setBody("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: phone, body: text, projectId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrMsg(data.detail ?? data.error ?? `خطأ ${res.status}`);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: "assistant",
          body: data.reply,
          timestamp: Date.now(),
          toolCalls: data.toolCalls?.length ? data.toolCalls : undefined,
        },
      ]);
    } catch {
      setErrMsg("خطأ في الاتصال");
    } finally {
      setSending(false);
    }
  }, [body, phone, sending, projectId]);

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 49px)" }}>
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
            🤖
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">محاكي المحادثة</p>
            <p className="text-xs text-gray-500">اختبر البوت قبل الربط بواتساب</p>
          </div>
        </div>
        <button
          onClick={() => setMessages([])}
          className="rounded-lg px-2.5 py-1 text-xs text-red-600 hover:bg-red-50"
        >
          🗑️ مسح
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-[#e8f5e9] p-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-4xl mb-2">🤖</p>
              <p className="text-sm text-gray-400">
                أرسل رسالة لبدء المحادثة مع البوت الذكي
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
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
                          <span className="font-semibold">المدخلات:</span> {tc.args}
                        </p>
                        <p className="text-gray-500">
                          <span className="font-semibold">النتيجة:</span> {tc.result}
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
              <span
                className="h-2 w-2 animate-bounce rounded-full bg-white/70"
                style={{ animationDelay: "0.1s" }}
              />
              <span
                className="h-2 w-2 animate-bounce rounded-full bg-white/70"
                style={{ animationDelay: "0.2s" }}
              />
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
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="رقم الجوال"
            className="w-36 shrink-0 rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 ltr"
            dir="ltr"
          />
          <input
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
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
            disabled={sending || !body.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? "..." : "إرسال"}
          </button>
        </div>
        <div className="mt-1.5 text-[10px] text-gray-400">
          يستخدم <b>OpenRouter AI</b> + <b>OpenWA</b>
        </div>
      </div>
    </div>
  );
}
