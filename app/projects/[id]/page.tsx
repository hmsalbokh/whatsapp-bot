"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Project {
  id: string;
  name: string;
  industry: string | null;
  company_description: string | null;
  created_at: string;
  tenants: { name: string; slug: string };
}

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          router.push("/");
          return;
        }
        setProject(data.project);
      })
      .catch(console.error)
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
