"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Project {
  id: string;
  name: string;
  industry: string | null;
  company_description: string | null;
  created_at: string;
  tenants: { name: string; slug: string };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => setProjects(data.projects ?? []))
      .catch((err) => console.error("Failed to load projects:", err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400">جاري التحميل...</p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <p className="text-5xl mb-4">🚀</p>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            مرحباً بك في منصة WhatsApp Bot
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            ابدأ بإنشاء مشروعك الأول لربط البوت الذكي بخدمة العملاء عبر واتساب
          </p>
          <button
            onClick={() => router.push("/projects/new")}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            + إنشاء مشروع جديد
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">المشاريع</h1>
        <button
          onClick={() => router.push("/projects/new")}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + مشروع جديد
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => router.push(`/projects/${project.id}`)}
            className="rounded-xl border bg-white p-5 text-right shadow-sm transition hover:shadow-md hover:border-blue-200"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-lg">
                🏢
              </div>
              <div>
                <p className="font-semibold text-gray-800">{project.name}</p>
                <p className="text-xs text-gray-400">
                  {project.tenants?.name ?? "—"}
                </p>
              </div>
            </div>
            {project.industry && (
              <p className="text-xs text-gray-500 mb-1">
                المجال: {project.industry}
              </p>
            )}
            {project.company_description && (
              <p className="text-xs text-gray-400 line-clamp-2">
                {project.company_description}
              </p>
            )}
            <p className="mt-2 text-[10px] text-gray-300">
              تم الإنشاء: {new Date(project.created_at).toLocaleDateString("ar-SA")}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
