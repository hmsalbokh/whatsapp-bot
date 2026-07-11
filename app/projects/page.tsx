"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ListSkeleton, ErrorState } from "@/components/ui";
import { Building2 } from "lucide-react";

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
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchProjects = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/projects")
      .then((r) => {
        if (!r.ok) throw new Error("فشل تحميل المشاريع");
        return r.json();
      })
      .then((data) => setProjects(data.projects ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <ListSkeleton count={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <ErrorState
          description={error}
          action={
            <button
              onClick={fetchProjects}
              className="rounded-lg bg-brand-navy px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-navy-light cursor-pointer"
            >
              إعادة المحاولة
            </button>
          }
        />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-brand-navy/5">
              <Building2 className="w-7 h-7 text-brand-navy" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            مرحباً بك في منصة WhatsApp Bot
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            ابدأ بإنشاء مشروعك الأول لربط البوت الذكي بخدمة العملاء عبر واتساب
          </p>
          <button
            onClick={() => router.push("/projects/new")}
            className="rounded-lg bg-brand-navy px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-navy-light cursor-pointer"
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
          className="rounded-lg bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-navy-light cursor-pointer"
        >
          + مشروع جديد
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => router.push(`/projects/${project.id}`)}
            className="rounded-xl border bg-white p-5 text-right shadow-sm transition hover:shadow-md hover:border-brand-navy/20 cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-navy/5">
                <Building2 className="w-5 h-5 text-brand-navy" />
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
