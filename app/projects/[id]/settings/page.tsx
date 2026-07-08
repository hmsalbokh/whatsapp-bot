"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Smartphone, CheckCircle2, XCircle, Loader2, Save, Plus,
  RefreshCw, Scan, Wifi
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  industry: string | null;
  company_description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
}

interface AgentSettings {
  model: string;
  language: string;
  temperature: number;
  max_tokens: number;
  system_prompt: string | null;
}

interface WhatsAppSession {
  id: string;
  provider: string;
  phone_number_id: string | null;
  config: Record<string, unknown>;
  is_active: boolean;
  updated_at: string;
}

type ConnectionStatus = "idle" | "creating" | "waiting_qr" | "connecting" | "connected" | "error";

export default function SettingsPage() {
  const { id } = useParams<{ id: string }>();
  const qrPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingWA, setSavingWA] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    industry: "",
    company_description: "",
    contact_email: "",
    contact_phone: "",
  });

  const [agent, setAgent] = useState<AgentSettings>({
    model: "qwen/qwen-2.5-72b-instruct",
    language: "ar",
    temperature: 0.7,
    max_tokens: 1024,
    system_prompt: "",
  });

  const [session, setSession] = useState<WhatsAppSession | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("idle");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrError, setQrError] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [waError, setWaError] = useState("");

  const [waForm, setWaForm] = useState({
    baseUrl: "",
    apiToken: "",
    sessionName: "",
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${id}`).then((r) => r.json()),
      fetch(`/api/projects/${id}/agent-settings`).then((r) => r.json()),
      fetch(`/api/projects/${id}/whatsapp-session`).then((r) => r.json()),
    ]).then(([projectData, agentData, sessionData]) => {
      if (projectData.project) {
        const p = projectData.project;
        setForm({
          name: p.name ?? "",
          industry: p.industry ?? "",
          company_description: p.company_description ?? "",
          contact_email: p.contact_email ?? "",
          contact_phone: p.contact_phone ?? "",
        });
      }
      if (agentData.settings) {
        const s = agentData.settings;
        setAgent({
          model: s.model ?? "openai/gpt-4o-mini",
          language: s.language ?? "ar",
          temperature: s.temperature ?? 0.7,
          max_tokens: s.max_tokens ?? 1024,
          system_prompt: s.system_prompt ?? "",
        });
      }
      const s = sessionData.session;
      setSession(s);
      if (s?.config) {
        const cfg = s.config as Record<string, string>;
        setWaForm({
          baseUrl: cfg.baseUrl ?? "",
          apiToken: cfg.apiToken ?? "",
          sessionName: cfg.sessionName ?? "",
        });
        if (s.phone_number_id) setPhoneNumber(s.phone_number_id);
        if (s.is_active && cfg.sessionName) setConnectionStatus("connected");
      }
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    return () => {
      if (qrPollRef.current) clearInterval(qrPollRef.current);
    };
  }, []);

  function updateWAField(field: string, value: string) {
    setWaForm((prev) => ({ ...prev, [field]: value }));
    setWaError("");
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const res = await fetch(`/api/projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setMessage(res.ok ? "✅ تم حفظ الملف التجاري" : "❌ حدث خطأ");
    setSaving(false);
  }

  async function handleSaveAgent(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const res = await fetch(`/api/projects/${id}/agent-settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(agent),
    });

    setMessage(res.ok ? "✅ تم حفظ إعدادات الوكيل" : "❌ حدث خطأ");
    setSaving(false);
  }

  async function handleSaveWA() {
    setSavingWA(true);
    try {
      const res = await fetch(`/api/projects/${id}/whatsapp-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "openwa",
          phoneNumberId: phoneNumber || null,
          config: {
            baseUrl: waForm.baseUrl,
            apiToken: waForm.apiToken,
            sessionName: waForm.sessionName,
          },
          isActive: connectionStatus === "connected",
        }),
      });
      const data = await res.json();
      if (data.saved) {
        setMessage("✅ تم حفظ إعدادات واتساب");
        setSession(data.session);
      }
    } catch {
      setWaError("فشل الحفظ");
    }
    setSavingWA(false);
  }

  async function handleCreateSession() {
    if (!waForm.baseUrl || !waForm.apiToken || !waForm.sessionName) {
      setWaError("يرجى تعبئة جميع الحقول");
      return;
    }
    setWaError("");
    setQrError("");
    setQrCode(null);
    setConnectionStatus("creating");
    setPhoneNumber("");

    try {
      const res = await fetch(`/api/projects/${id}/whatsapp-session/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(waForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setWaError(data.error || "فشل إنشاء الجلسة");
        setConnectionStatus("idle");
        return;
      }
      if (data.qr) {
        setQrCode(data.qr);
        setConnectionStatus("waiting_qr");
        startQrPolling();
      } else {
        setConnectionStatus("connecting");
        startQrPolling();
      }
    } catch {
      setWaError("فشل الاتصال بخادم OpenWA");
      setConnectionStatus("idle");
    }
  }

  function startQrPolling() {
    if (qrPollRef.current) clearInterval(qrPollRef.current);
    qrPollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/projects/${id}/whatsapp-session/check`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(waForm),
        });
        const data = await res.json();
        if (!data.success) return;

        if (data.status === "connected" || data.status === "active") {
          setConnectionStatus("connected");
          if (data.phone) setPhoneNumber(data.phone);
          if (qrPollRef.current) clearInterval(qrPollRef.current);
          handleSaveWA();
          return;
        }

        if (data.status === "connecting" || data.status === "scanning" || data.status === "waiting_for_scan") {
          setConnectionStatus("waiting_qr");
          fetchQRCode();
        }
      } catch {
        // ignore polling errors
      }
    }, 3000);
  }

  async function fetchQRCode() {
    try {
      const res = await fetch(`/api/projects/${id}/whatsapp-session/qr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(waForm),
      });
      const data = await res.json();
      if (data.qr) setQrCode(data.qr);
    } catch {
      setQrError("تعذر الحصول على QR code");
    }
  }

  async function handleDisconnect() {
    if (qrPollRef.current) clearInterval(qrPollRef.current);
    setConnectionStatus("idle");
    setQrCode(null);
    setPhoneNumber("");
    await fetch(`/api/projects/${id}/whatsapp-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: "openwa",
        config: waForm,
        isActive: false,
      }),
    }).catch(() => {});
    setMessage("✅ تم قطع اتصال واتساب");
  }

  async function handleRefreshQR() {
    setQrError("");
    setQrCode(null);
    await fetchQRCode();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8 space-y-10">
      <h1 className="text-xl font-bold text-gray-800">⚙️ إعدادات المشروع</h1>

      {/* Business Profile */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">🏢 الملف التجاري</h2>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم المشروع</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">المجال</label>
            <input type="text" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="مثال: تجارة إلكترونية" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">وصف الشركة</label>
            <textarea rows={4} value={form.company_description} onChange={(e) => setForm({ ...form, company_description: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
            <input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 ltr" dir="ltr" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">رقم الجوال</label>
            <input type="text" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 ltr" dir="ltr" />
          </div>
          <button type="submit" disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            حفظ الملف التجاري
          </button>
        </form>
      </section>

      <hr className="border-gray-200" />

      {/* Agent Settings */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">🧠 إعدادات الوكيل الذكي</h2>
        <form onSubmit={handleSaveAgent} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الموديل</label>
            <select value={agent.model} onChange={(e) => setAgent({ ...agent, model: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500">
              <option value="qwen/qwen-2.5-72b-instruct">Qwen 2.5 72B</option>
              <option value="qwen/qwen-2.5-32b-instruct">Qwen 2.5 32B</option>
              <option value="qwen/qwen-2.5-7b-instruct">Qwen 2.5 7B</option>
              <option value="mistralai/mistral-7b-instruct-v0.3">Mistral 7B</option>
              <option value="mistralai/mixtral-8x7b-instruct">Mixtral 8x7B</option>
              <option value="meta-llama/llama-3.1-8b-instruct">Llama 3.1 8B</option>
              <option value="meta-llama/llama-3.1-70b-instruct">Llama 3.1 70B</option>
              <option value="meta-llama/llama-3.2-3b-instruct">Llama 3.2 3B</option>
              <option value="deepseek/deepseek-chat">DeepSeek V3</option>
              <option value="deepseek/deepseek-r1">DeepSeek R1</option>
              <option value="microsoft/phi-4">Phi-4</option>
              <option value="google/gemma-2-9b-it">Gemma 2 9B</option>
              <option value="google/gemma-2-27b-it">Gemma 2 27B</option>
            </select>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">اللغة</label>
              <select value={agent.language} onChange={(e) => setAgent({ ...agent, language: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500">
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">الحرارة (Temperature)</label>
              <input type="number" step="0.05" min="0" max="2" value={agent.temperature}
                onChange={(e) => setAgent({ ...agent, temperature: parseFloat(e.target.value) || 0.7 })}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الحد الأقصى للتوكنز</label>
            <input type="number" min="128" max="8192" step="128" value={agent.max_tokens}
              onChange={(e) => setAgent({ ...agent, max_tokens: parseInt(e.target.value) || 1024 })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              تعليمات مخصصة (System Prompt)
              <span className="text-gray-400 font-normal mr-1">— اختياري</span>
            </label>
            <textarea rows={6} value={agent.system_prompt ?? ""}
              onChange={(e) => setAgent({ ...agent, system_prompt: e.target.value || null })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 font-mono"
              placeholder="إذا تركت فارغًا، سيتم إنشاء التعليمات تلقائيًا من الملف التجاري وقاعدة المعرفة" />
          </div>
          <button type="submit" disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            حفظ إعدادات الوكيل
          </button>
        </form>
      </section>

      <hr className="border-gray-200" />

      {/* WhatsApp Connection */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">📱 اتصال واتساب</h2>

        {/* Connection status banner */}
        <AnimatePresence>
          {connectionStatus !== "idle" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`rounded-2xl border p-5 mb-6 ${
                connectionStatus === "connected"
                  ? "bg-green-50 border-green-200"
                  : connectionStatus === "error"
                  ? "bg-red-50 border-red-200"
                  : "bg-blue-50 border-blue-200"
              }`}
            >
              <div className="flex items-center gap-3">
                {connectionStatus === "connected" ? (
                  <Wifi className="w-6 h-6 text-green-600" />
                ) : connectionStatus === "creating" ? (
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                ) : connectionStatus === "waiting_qr" ? (
                  <Scan className="w-6 h-6 text-blue-600" />
                ) : connectionStatus === "connecting" ? (
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-500" />
                )}
                <div className="flex-1">
                  <p className={`font-semibold ${
                    connectionStatus === "connected" ? "text-green-800" : "text-blue-800"
                  }`}>
                    {connectionStatus === "connected" && "✅ الجلسة متصلة"}
                    {connectionStatus === "creating" && "جاري إنشاء الجلسة..."}
                    {connectionStatus === "waiting_qr" && "امسح QR code بهاتفك"}
                    {connectionStatus === "connecting" && "جاري الاتصال..."}
                    {connectionStatus === "error" && "خطأ في الاتصال"}
                  </p>
                  {phoneNumber && (
                    <p className="text-sm text-green-600 mt-0.5" dir="ltr">
                      {phoneNumber}
                    </p>
                  )}
                </div>
                {connectionStatus === "connected" && (
                  <button onClick={handleDisconnect}
                    className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors">
                    قطع الاتصال
                  </button>
                )}
              </div>

              {/* QR Code display */}
              {(connectionStatus === "waiting_qr" || connectionStatus === "connecting") && (
                <div className="mt-5 flex flex-col items-center">
                  {qrCode ? (
                    <div className="relative">
                      <img src={qrCode} alt="QR Code"
                        className="w-56 h-56 rounded-2xl bg-white border-2 border-blue-200 shadow-lg" />
                      <div className="absolute inset-0 rounded-2xl ring-2 ring-blue-400/50 animate-pulse pointer-events-none" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-56 h-56 rounded-2xl bg-white border-2 border-blue-200">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                    </div>
                  )}
                  <p className="text-xs text-blue-600 mt-3 text-center max-w-xs">
                    افتح واتساب على هاتفك ← الإعدادات ← الأجهزة المرتبطة ← ربط جهاز ← امسح QR code
                  </p>
                  <button onClick={handleRefreshQR}
                    className="mt-3 flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors">
                    <RefreshCw className="w-3.5 h-3.5" />
                    تحديث QR code
                  </button>
                  {qrError && <p className="text-xs text-red-500 mt-2">{qrError}</p>}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* OpenWA form */}
        <div className="space-y-4 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Smartphone className="w-5 h-5 text-slate-500" />
            <h3 className="font-semibold text-[#0a1b33]">إعدادات OpenWA</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">رابط خادم OpenWA</label>
            <input type="url" dir="ltr" value={waForm.baseUrl}
              onChange={(e) => updateWAField("baseUrl", e.target.value)}
              className="block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#0a152d] transition-all"
              placeholder="https://your-openwa.onrender.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">رمز API (API Token)</label>
            <input type="text" dir="ltr" value={waForm.apiToken}
              onChange={(e) => updateWAField("apiToken", e.target.value)}
              className="block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#0a152d] transition-all font-mono"
              placeholder="owa_k1_..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">اسم الجلسة</label>
            <input type="text" dir="ltr" value={waForm.sessionName}
              onChange={(e) => updateWAField("sessionName", e.target.value)}
              className="block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#0a152d] transition-all font-mono"
              placeholder="my-bot" />
          </div>

          {waError && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {waError}
            </div>
          )}

          {session && connectionStatus === "connected" && (
            <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-green-700 font-medium">✅ متصل</span>
                <span className="text-green-600 text-xs">{session.updated_at ? new Date(session.updated_at).toLocaleDateString("ar-SA") : ""}</span>
              </div>
              {phoneNumber && <p className="text-green-600 font-mono" dir="ltr">{phoneNumber}</p>}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button onClick={handleCreateSession}
              disabled={connectionStatus === "creating" || connectionStatus === "waiting_qr" || connectionStatus === "connecting"}
              className="flex items-center gap-2 rounded-xl bg-[#0a152d] text-white px-6 py-2.5 text-sm font-semibold hover:bg-[#0a1b33] transition-all shadow-sm disabled:opacity-50">
              {(connectionStatus === "creating" || connectionStatus === "connecting") ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {connectionStatus === "waiting_qr" ? "انتظار المسح..." : "إنشاء جلسة جديدة"}
            </button>

            <button onClick={handleSaveWA} disabled={savingWA}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50">
              {savingWA ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              حفظ الإعدادات
            </button>

            {(connectionStatus === "waiting_qr" || connectionStatus === "connecting") && (
              <button onClick={handleRefreshQR}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-all">
                <RefreshCw className="w-4 h-4" />
                تحديث QR
              </button>
            )}
          </div>
        </div>
      </section>

      {message && (
        <div className={`rounded-lg px-3 py-2 text-sm ${
          message.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
        }`}>
          {message}
        </div>
      )}
    </div>
  );
}
