"use client";

import { useEffect, useState } from "react";
import { Check, X, Loader2, ExternalLink } from "lucide-react";

interface Registration {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company_name: string;
  plan_slug: string;
  status: "pending" | "approved" | "rejected";
  notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

const planLabels: Record<string, string> = {
  free: "مجاني",
  pro: "احترافي",
  enterprise: "غير محدود",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  approved: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

const statusLabels: Record<string, string> = {
  pending: "قيد المراجعة",
  approved: "مقبول",
  rejected: "مرفوض",
};

export default function AdminRegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("pending");
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [approvedInfo, setApprovedInfo] = useState<{ email: string; password: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/registrations")
      .then((r) => r.json())
      .then((data) => setRegistrations(data.registrations ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function handleApprove(id: string) {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/registrations/${id}/approve`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setRegistrations((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: "approved" as const } : r))
        );
        setApprovedInfo({ email: data.userEmail, password: data.tempPassword });
      } else {
        alert(data.error || "فشل الموافقة");
      }
    } catch {
      alert("حدث خطأ");
    }
    setActionLoading(null);
  }

  async function handleReject(id: string) {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/registrations/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json();
      if (data.success) {
        setRegistrations((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: "rejected" as const, notes: rejectReason } : r))
        );
      } else {
        alert(data.error || "فشل الرفض");
      }
    } catch {
      alert("حدث خطأ");
    }
    setActionLoading(null);
    setRejectModal(null);
    setRejectReason("");
  }

  const filtered = registrations.filter((r) => filter === "all" || r.status === filter);

  if (loading) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-gray-900">طلبات التسجيل</h1>
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl border bg-white p-5">
              <div className="h-4 w-1/3 rounded bg-gray-200 mb-2" />
              <div className="h-3 w-1/2 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">طلبات التسجيل</h1>
        <p className="text-sm text-gray-500 mt-1">
          إجمالي {registrations.length} طلب
        </p>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex gap-2">
        {[
          { key: "pending", label: "قيد المراجعة" },
          { key: "approved", label: "مقبول" },
          { key: "rejected", label: "مرفوض" },
          { key: "all", label: "الكل" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              filter === tab.key
                ? "bg-[#0a152d] text-white"
                : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Approved info modal */}
      {approvedInfo && (
        <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-green-800 mb-2">✅ تم التفعيل بنجاح</h3>
              <p className="text-sm text-green-700 mb-1">البريد: {approvedInfo.email}</p>
              <p className="text-sm text-green-700">
                كلمة المرور المؤقتة: <span className="font-mono font-bold bg-green-100 px-2 py-0.5 rounded">{approvedInfo.password}</span>
              </p>
            </div>
            <button
              onClick={() => setApprovedInfo(null)}
              className="text-green-600 hover:text-green-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">
          <h3 className="font-semibold text-red-800 mb-3">سبب الرفض</h3>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full rounded-xl border border-red-200 px-4 py-2.5 text-sm outline-none focus:border-red-500 mb-3"
            rows={3}
            placeholder="أدخل سبب الرفض..."
          />
          <div className="flex gap-2">
            <button
              onClick={() => handleReject(rejectModal)}
              disabled={actionLoading === rejectModal}
              className="rounded-xl bg-red-600 text-white px-5 py-2 text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {actionLoading === rejectModal ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              تأكيد الرفض
            </button>
            <button
              onClick={() => { setRejectModal(null); setRejectReason(""); }}
              className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Registrations list */}
      <div className="space-y-4">
        {filtered.map((reg) => (
          <div
            key={reg.id}
            className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">{reg.full_name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{reg.email}</p>
                {reg.phone && <p className="text-xs text-gray-400">{reg.phone}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full border px-3 py-0.5 text-xs font-medium ${statusColors[reg.status]}`}
                >
                  {statusLabels[reg.status]}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-medium text-slate-600">
                  {planLabels[reg.plan_slug] ?? reg.plan_slug}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700">{reg.company_name}</p>
              <p className="text-xs text-gray-400 mt-1">
                تاريخ الطلب: {new Date(reg.created_at).toLocaleDateString("ar-SA")}
                {reg.reviewed_at && (
                  <> · تاريخ المراجعة: {new Date(reg.reviewed_at).toLocaleDateString("ar-SA")}</>
                )}
              </p>
              {reg.notes && (
                <p className="text-xs text-gray-500 mt-2 italic">{reg.notes}</p>
              )}
            </div>

            {reg.status === "pending" && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(reg.id)}
                  disabled={actionLoading === reg.id}
                  className="flex items-center gap-1.5 rounded-xl bg-green-600 text-white px-4 py-2 text-xs font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {actionLoading === reg.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  تفعيل
                </button>
                <button
                  onClick={() => setRejectModal(reg.id)}
                  disabled={actionLoading === reg.id}
                  className="flex items-center gap-1.5 rounded-xl border border-red-200 text-red-600 px-4 py-2 text-xs font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5" />
                  رفض
                </button>
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="flex min-h-[20vh] items-center justify-center">
            <p className="text-slate-400 text-sm">لا توجد طلبات</p>
          </div>
        )}
      </div>
    </div>
  );
}
