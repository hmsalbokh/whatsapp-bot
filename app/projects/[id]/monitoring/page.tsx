"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ListSkeleton, EmptyState } from "@/components/ui";
import { toast } from "@/components/toast";

interface FailedJob {
  id: string;
  job_type: string;
  error: string | null;
  attempt: number;
  max_attempts: number;
  created_at: string;
  last_attempt_at: string | null;
}

const JOB_LABELS: Record<string, string> = {
  openrouter_chat: "🧠 استدعاء AI",
  webhook_process: "📩 معالجة Webhook",
  send_message: "📤 إرسال رسالة",
};

export default function MonitoringPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const [jobs, setJobs] = useState<FailedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/failed-jobs?projectId=${projectId}&limit=50`)
      .then((r) => r.json())
      .then((data) => setJobs(data.failedJobs ?? []))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  async function handleRetry(jobId: string) {
    setRetrying(jobId);
    const res = await fetch(`/api/failed-jobs/${jobId}/retry`, { method: "POST" });
    if (res.ok) {
      toast("success", "تم إعادة المحاولة");
      load();
    } else {
      const data = await res.json();
      toast("error", data.error ?? "فشلت إعادة المحاولة");
    }
    setRetrying(null);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">📊 المراقبة والأخطاء</h1>
        <p className="text-sm text-gray-500">الوظائف الفاشلة وإعادة المحاولة</p>
      </div>

      {loading ? (
        <ListSkeleton count={3} />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon="✅"
          title="لا توجد أخطاء"
          description="كل الوظائف تعمل بنجاح ولم يتم تسجيل أي فشل"
        />
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-800">
                      {JOB_LABELS[job.job_type] ?? `🔧 ${job.job_type}`}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      محاولة {job.attempt}/{job.max_attempts}
                    </span>
                  </div>
                  {job.error && (
                    <p className="text-xs text-red-600 mb-1 break-words">{job.error}</p>
                  )}
                  <p className="text-[10px] text-gray-400">
                    {new Date(job.created_at).toLocaleString("ar-SA")}
                  </p>
                </div>
                <button
                  onClick={() => handleRetry(job.id)}
                  disabled={retrying === job.id}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 shrink-0"
                >
                  {retrying === job.id ? "..." : "إعادة محاولة"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
