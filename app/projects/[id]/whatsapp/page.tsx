"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Smartphone,
  CheckCircle2,
  XCircle,
  Loader2,
  Save,
  RefreshCw,
  Plus,
  ArrowLeft,
  Scan,
  Wifi,
  WifiOff,
  ExternalLink,
} from "lucide-react";

interface WhatsAppSession {
  id: string;
  provider: string;
  phone_number_id: string | null;
  config: Record<string, unknown>;
  is_active: boolean;
  updated_at: string;
}

type ConnectionStatus = "idle" | "creating" | "waiting_qr" | "connecting" | "connected" | "error";

export default function WhatsAppPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const qrPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [session, setSession] = useState<WhatsAppSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [error, setError] = useState("");

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("idle");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrError, setQrError] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [form, setForm] = useState({
    baseUrl: "",
    apiToken: "",
    sessionName: "",
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${projectId}`).then((r) => r.json()),
      fetch(`/api/projects/${projectId}/whatsapp-session`).then((r) => r.json()),
    ])
      .then(([projectData, sessionData]) => {
        setProjectName(projectData.project?.name ?? "");
        const s = sessionData.session;
        setSession(s);
        if (s?.config) {
          const cfg = s.config as Record<string, string>;
          setForm({
            baseUrl: cfg.baseUrl ?? "",
            apiToken: cfg.apiToken ?? "",
            sessionName: cfg.sessionName ?? "",
          });
          if (s.phone_number_id) setPhoneNumber(s.phone_number_id);
          if (s.is_active && cfg.sessionName) setConnectionStatus("connected");
        }
      })
      .catch((err) => console.error("Failed to load WhatsApp page:", err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    return () => {
      if (qrPollRef.current) clearInterval(qrPollRef.current);
    };
  }, []);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
    setError("");
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/projects/${projectId}/whatsapp-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "openwa",
          phoneNumberId: phoneNumber || null,
          config: {
            baseUrl: form.baseUrl,
            apiToken: form.apiToken,
            sessionName: form.sessionName,
          },
          isActive: connectionStatus === "connected",
        }),
      });
      const data = await res.json();
      if (data.saved) {
        setSaved(true);
        setSession(data.session);
      }
    } catch {
      setError("فشل الحفظ");
    }
    setSaving(false);
  }

  async function handleCreateSession() {
    if (!form.baseUrl || !form.apiToken || !form.sessionName) {
      setError("يرجى تعبئة جميع الحقول");
      return;
    }
    setError("");
    setQrError("");
    setQrCode(null);
    setConnectionStatus("creating");
    setPhoneNumber("");

    try {
      const res = await fetch(`/api/projects/${projectId}/whatsapp-session/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "فشل إنشاء الجلسة");
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
      setError("فشل الاتصال بخادم OpenWA");
      setConnectionStatus("idle");
    }
  }

  function startQrPolling() {
    if (qrPollRef.current) clearInterval(qrPollRef.current);
    qrPollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/whatsapp-session/check`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!data.success) return;

        if (data.status === "connected" || data.status === "active") {
          setConnectionStatus("connected");
          if (data.phone) setPhoneNumber(data.phone);
          if (qrPollRef.current) clearInterval(qrPollRef.current);
          handleSave();
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
      const res = await fetch(`/api/projects/${projectId}/whatsapp-session/qr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
    await fetch(`/api/projects/${projectId}/whatsapp-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: "openwa",
        config: form,
        isActive: false,
      }),
    }).catch(() => {});
  }

  async function handleRefreshQR() {
    setQrError("");
    setQrCode(null);
    await fetchQRCode();
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <Link
          href={`/projects/${projectId}`}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          العودة للمشروع
        </Link>
        <h1 className="text-2xl font-bold text-[#0a1b33]">ربط واتساب</h1>
        <p className="text-sm text-slate-500 mt-1">{projectName}</p>
      </div>

      <div className="space-y-6">
        {/* Connection status banner */}
        <AnimatePresence>
          {connectionStatus !== "idle" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`rounded-2xl border p-5 ${
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
                  <button
                    onClick={handleDisconnect}
                    className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors"
                  >
                    قطع الاتصال
                  </button>
                )}
              </div>

              {/* QR Code display */}
              {(connectionStatus === "waiting_qr" || connectionStatus === "connecting") && (
                <div className="mt-5 flex flex-col items-center">
                  {qrCode ? (
                    <div className="relative">
                      <img
                        src={qrCode}
                        alt="QR Code"
                        className="w-56 h-56 rounded-2xl bg-white border-2 border-blue-200 shadow-lg"
                      />
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
                  <button
                    onClick={handleRefreshQR}
                    className="mt-3 flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    تحديث QR code
                  </button>
                  {qrError && (
                    <p className="text-xs text-red-500 mt-2">{qrError}</p>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main form */}
        <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#0a152d]/5">
              <Smartphone className="w-5 h-5 text-[#0a152d]" />
            </div>
            <div>
              <h2 className="font-semibold text-[#0a1b33]">إعدادات OpenWA</h2>
              <p className="text-xs text-slate-400">أدخل بيانات خادم OpenWA الخاص بك</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                رابط خادم OpenWA
              </label>
              <input
                type="url"
                dir="ltr"
                value={form.baseUrl}
                onChange={(e) => updateField("baseUrl", e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#0a152d] transition-all"
                placeholder="https://your-openwa.onrender.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                رمز API (API Token)
              </label>
              <input
                type="text"
                dir="ltr"
                value={form.apiToken}
                onChange={(e) => updateField("apiToken", e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#0a152d] transition-all font-mono"
                placeholder="owa_k1_..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                اسم الجلسة
              </label>
              <input
                type="text"
                dir="ltr"
                value={form.sessionName}
                onChange={(e) => updateField("sessionName", e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#0a152d] transition-all font-mono"
                placeholder="my-bot"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                اسم تستخدمه لتمييز هذه الجلسة (حروف إنجليزية وأرقام)
              </p>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handleCreateSession}
              disabled={connectionStatus === "creating" || connectionStatus === "waiting_qr" || connectionStatus === "connecting"}
              className="flex items-center gap-2 rounded-xl bg-[#0a152d] text-white px-6 py-2.5 text-sm font-semibold hover:bg-[#0a1b33] transition-all shadow-sm disabled:opacity-50"
            >
              {(connectionStatus === "creating" || connectionStatus === "connecting") ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {connectionStatus === "waiting_qr" ? "انتظار المسح..." : "إنشاء جلسة جديدة"}
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              حفظ الإعدادات
            </button>

            {(connectionStatus === "waiting_qr" || connectionStatus === "connecting") && (
              <button
                onClick={handleRefreshQR}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                تحديث QR
              </button>
            )}
          </div>
        </div>

        {/* Current session info */}
        {session && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm"
          >
            <h2 className="font-semibold text-[#0a1b33] mb-4">حالة الاتصال</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">الحالة</span>
                <span className={`flex items-center gap-1.5 font-medium ${session.is_active ? "text-green-600" : "text-red-500"}`}>
                  {session.is_active ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  {session.is_active ? "نشط" : "غير نشط"}
                </span>
              </div>
              {phoneNumber && (
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">رقم الجوال</span>
                  <span className="font-mono text-slate-700" dir="ltr">{phoneNumber}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">اسم الجلسة</span>
                <span className="font-mono text-slate-700">{form.sessionName || "—"}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500">آخر تحديث</span>
                <span className="text-slate-700">{new Date(session.updated_at).toLocaleDateString("ar-SA")}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Webhook info */}
        <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <ExternalLink className="w-5 h-5 text-slate-400" />
            <h2 className="font-semibold text-[#0a1b33]">رابط Webhook</h2>
          </div>
          <p className="text-xs text-slate-500 mb-2">
            استخدم هذا الرابط في إعدادات OpenWA (Settings → Webhook URL):
          </p>
          <code
            className="block rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-xs font-mono text-slate-600 break-all select-all"
            dir="ltr"
          >
            {typeof window !== "undefined"
              ? `${window.location.origin}/api/openwa/webhook?projectId=${projectId}`
              : ""}
          </code>
        </div>
      </div>
    </div>
  );
}
