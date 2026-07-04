"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ListSkeleton, EmptyState } from "@/components/ui";
import { toast } from "@/components/toast";

interface Handoff {
  id: string;
  conversation_id: string;
  requested_by: string;
  reason: string | null;
  status: string;
  created_at: string;
  conversations: { contact_id: string } | null;
}

export default function HandoffsPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const [handoffs, setHandoffs] = useState<Handoff[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/handoffs?projectId=${projectId}&status=${filter}`)
      .then((r) => r.json())
      .then((data) => setHandoffs(data.handoffs ?? []))
      .finally(() => setLoading(false));
  }, [projectId, filter]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/handoffs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast("success", status === "accepted" ? "تم قبول طلب التحويل" : status === "closed" ? "تم إغلاق الطلب" : "تم رفض الطلب");
      load();
    } else {
      toast("error", "حدث خطأ");
    }
  }

  const statusLabels: Record<string, string> = {
    pending: "قيد الانتظار",
    accepted: "مقبول",
    rejected: "مرفوض",
    closed: "مغلق",
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    accepted: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    closed: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">👤 طلبات التحويل للدعم البشري</h1>
        <p className="text-sm text-gray-500">إدارة طلبات تحويل المحادثات إلى وكلاء بشريين</p>
      </div>

      <div className="mb-4 flex gap-2">
        {["pending", "accepted", "rejected", "closed"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              filter === s
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {statusLabels[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <ListSkeleton count={3} />
      ) : handoffs.length === 0 ? (
        <EmptyState
          icon="✅"
          title="لا توجد طلبات تحويل"
          description={`لا توجد طلبات بحالة "${statusLabels[filter]}"`}
        />
      ) : (
        <div className="space-y-3">
          {handoffs.map((h) => (
            <div key={h.id} className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[h.status]}`}>
                      {statusLabels[h.status]}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(h.created_at).toLocaleString("ar-SA")}
                    </span>
                  </div>
                  {h.reason && (
                    <p className="text-sm text-gray-700 mb-1">{h.reason}</p>
                  )}
                  <p className="text-[10px] text-gray-400">
                    بواسطة: {h.requested_by === "ai" ? "الوكيل الذكي" : h.requested_by === "contact" ? "العميل" : "مدير"}
                  </p>
                </div>
                {h.status === "pending" && (
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => updateStatus(h.id, "accepted")}
                      className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                    >
                      قبول
                    </button>
                    <button
                      onClick={() => updateStatus(h.id, "rejected")}
                      className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200"
                    >
                      رفض
                    </button>
                  </div>
                )}
                {h.status === "accepted" && (
                  <button
                    onClick={() => updateStatus(h.id, "closed")}
                    className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 shrink-0"
                  >
                    إغلاق
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
