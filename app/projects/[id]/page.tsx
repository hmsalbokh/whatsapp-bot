"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { Wifi, WifiOff, Loader2, ExternalLink } from "lucide-react";

interface Project {
  id: string;
  name: string;
  industry: string | null;
  company_description: string | null;
  created_at: string;
  tenants: { name: string; slug: string };
}

interface SessionData {
  id: string;
  is_active: boolean;
  phone_number_id: string | null;
  config: Record<string, unknown>;
  updated_at: string;
}

function StatusBadge({ session, projectId }: { session: SessionData | null; projectId: string }) {
  const [checking, setChecking] = useState(false);
  const [liveStatus, setLiveStatus] = useState<"checking" | "connected" | "stopped" | "none">(
    session?.is_active ? "checking" : session ? "stopped" : "none"
  );

  useEffect(() => {
    if (!session?.is_active) return;
    const cfg = session.config as Record<string, string>;
    if (!cfg.baseUrl || !cfg.apiToken || !cfg.sessionName) return;

    setChecking(true);
    fetch(`/api/projects/${projectId}/whatsapp-session/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        baseUrl: cfg.baseUrl,
        apiToken: cfg.apiToken,
        sessionName: cfg.sessionName,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        const connected = ["connected", "active", "started", "working", "pairing"];
        setLiveStatus(connected.includes(data.status?.toLowerCase()) ? "connected" : "stopped");
      })
      .catch(() => setLiveStatus("stopped"))
      .finally(() => setChecking(false));
  }, [session, projectId]);

  if (!session) {
    return (
      <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100">
              <WifiOff className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">واتساب</p>
              <p className="text-xs text-slate-400">غير مضبوط</p>
            </div>
          </div>
          <Link
            href={`/projects/${projectId}/whatsapp`}
            className="text-xs font-medium text-brand-navy hover:underline"
          >
            إعداد
          </Link>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-5 shadow-sm ${
        liveStatus === "connected"
          ? "bg-green-50 border-green-200"
          : "bg-amber-50 border-amber-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${
            liveStatus === "connected" ? "bg-green-100" : "bg-amber-100"
          }`}>
            {checking ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            ) : liveStatus === "connected" ? (
              <Wifi className="w-5 h-5 text-green-600" />
            ) : (
              <WifiOff className="w-5 h-5 text-amber-500" />
            )}
          </div>
          <div>
            <p className={`text-sm font-semibold ${
              liveStatus === "connected" ? "text-green-800" : "text-amber-800"
            }`}>
              واتساب
            </p>
            <p className={`text-xs ${
              liveStatus === "connected" ? "text-green-600" : "text-amber-600"
            }`}>
              {liveStatus === "connected"
                ? `متصل${session.phone_number_id ? ` — ${session.phone_number_id}` : ""}`
                : liveStatus === "checking"
                ? "جاري الفحص..."
                : "غير متصل"}
            </p>
          </div>
        </div>
        <Link
          href={`/projects/${projectId}/whatsapp`}
          className="flex items-center gap-1 text-xs font-medium text-brand-navy hover:underline"
        >
          إدارة
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </motion.div>
  );
}

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${id}`).then((r) => r.json()),
      fetch(`/api/projects/${id}/whatsapp-session`).then((r) => r.json()),
    ])
      .then(([projectData, sessionData]) => {
        if (projectData.error) {
          router.push("/");
          return;
        }
        setProject(projectData.project);
        setSession(sessionData.session ?? null);
      })
      .catch((err) => console.error("Failed to load project:", err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400">جاري التحميل...</p>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{project.name}</h1>
        <p className="text-sm text-gray-500">{project.tenants?.name}</p>
      </div>

      {/* WhatsApp status widget */}
      <div className="mb-6">
        <StatusBadge session={session} projectId={id} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href={`/projects/${id}/chat`}
          className="rounded-xl border bg-white p-6 text-right shadow-sm transition hover:shadow-md hover:border-blue-200"
        >
          <p className="text-3xl mb-2">💬</p>
          <p className="font-semibold text-gray-800 mb-1">محاكي المحادثة</p>
          <p className="text-xs text-gray-500">
            اختبر البوت وأرسل رسائل تجريبية
          </p>
        </Link>

        <Link
          href={`/projects/${id}/knowledge`}
          className="rounded-xl border bg-white p-6 text-right shadow-sm transition hover:shadow-md hover:border-blue-200"
        >
          <p className="text-3xl mb-2">📚</p>
          <p className="font-semibold text-gray-800 mb-1">قاعدة المعرفة</p>
          <p className="text-xs text-gray-500">
            أضف الأسئلة والإجابات الشائعة
          </p>
        </Link>

        <Link
          href={`/projects/${id}/whatsapp`}
          className="rounded-xl border bg-white p-6 text-right shadow-sm transition hover:shadow-md hover:border-blue-200"
        >
          <p className="text-3xl mb-2">📱</p>
          <p className="font-semibold text-gray-800 mb-1">ربط واتساب</p>
          <p className="text-xs text-gray-500">
            ربط رقم الجوال وتفعيل الجلسة
          </p>
        </Link>

        <Link
          href={`/projects/${id}/handoffs`}
          className="rounded-xl border bg-white p-6 text-right shadow-sm transition hover:shadow-md hover:border-blue-200"
        >
          <p className="text-3xl mb-2">👤</p>
          <p className="font-semibold text-gray-800 mb-1">الدعم البشري</p>
          <p className="text-xs text-gray-500">
            إدارة طلبات تحويل المحادثات
          </p>
        </Link>

        <Link
          href={`/projects/${id}/monitoring`}
          className="rounded-xl border bg-white p-6 text-right shadow-sm transition hover:shadow-md hover:border-blue-200"
        >
          <p className="text-3xl mb-2">📊</p>
          <p className="font-semibold text-gray-800 mb-1">المراقبة</p>
          <p className="text-xs text-gray-500">
            الأخطاء وإعادة المحاولة
          </p>
        </Link>

        <Link
          href={`/projects/${id}/settings`}
          className="rounded-xl border bg-white p-6 text-right shadow-sm transition hover:shadow-md hover:border-blue-200"
        >
          <p className="text-3xl mb-2">⚙️</p>
          <p className="font-semibold text-gray-800 mb-1">الإعدادات</p>
          <p className="text-xs text-gray-500">
            الملف التجاري وإعدادات البوت
          </p>
        </Link>
      </div>
    </div>
  );
}
