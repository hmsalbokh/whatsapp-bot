"use client";

import { useEffect, useState } from "react";

interface AdminSubscription {
  id: string;
  tenant_id: string;
  plan_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  trial_end: string | null;
  created_at: string;
  subscription_plans: { name: string; slug: string; price_monthly: number };
  tenants: { name: string; slug: string };
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/subscriptions")
      .then((r) => r.json())
      .then((data) => setSubscriptions(data.subscriptions ?? []))
      .finally(() => setLoading(false));
  }, []);

  const statusLabels: Record<string, string> = {
    active: "نشط",
    trialing: "تجريبي",
    past_due: "متأخر",
    canceled: "ملغي",
    expired: "منتهي",
  };

  const statusColors: Record<string, string> = {
    active: "bg-green-50 text-green-700",
    trialing: "bg-blue-50 text-blue-700",
    past_due: "bg-yellow-50 text-yellow-700",
    canceled: "bg-red-50 text-red-700",
    expired: "bg-gray-100 text-gray-500",
  };

  if (loading) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-gray-900">الاشتراكات</h1>
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl border bg-white p-4">
              <div className="h-4 w-1/3 rounded bg-gray-200 mb-2" />
              <div className="h-3 w-1/4 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const groupedByPlan: Record<string, AdminSubscription[]> = {};
  for (const sub of subscriptions) {
    const key = sub.subscription_plans?.slug ?? "unknown";
    if (!groupedByPlan[key]) groupedByPlan[key] = [];
    groupedByPlan[key].push(sub);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">الاشتراكات</h1>
        <p className="text-sm text-gray-500 mt-1">
          إجمالي {subscriptions.length} اشتراك
        </p>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(groupedByPlan).map(([slug, subs]) => (
          <div key={slug} className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">
              {subs[0]?.subscription_plans?.name ?? slug}
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{subs.length}</p>
          </div>
        ))}
      </div>

      {/* Subscriptions Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <table className="w-full text-right text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-4 py-3 font-medium text-gray-600">الشركة</th>
              <th className="px-4 py-3 font-medium text-gray-600">الخطة</th>
              <th className="px-4 py-3 font-medium text-gray-600">الحالة</th>
              <th className="px-4 py-3 font-medium text-gray-600">تاريخ البدء</th>
              <th className="px-4 py-3 font-medium text-gray-600">تاريخ الانتهاء</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((sub) => (
              <tr key={sub.id} className="border-b last:border-b-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {sub.tenants?.name ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium text-gray-700">
                    {sub.subscription_plans?.name ?? "غير معروفة"}
                  </span>
                  <span className="mr-1 text-xs text-gray-400">
                    ({sub.subscription_plans?.price_monthly ?? 0} ريال)
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      statusColors[sub.status] ?? "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {statusLabels[sub.status] ?? sub.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(sub.current_period_start).toLocaleDateString("ar-SA")}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(sub.current_period_end).toLocaleDateString("ar-SA")}
                  {sub.trial_end && (
                    <span className="mr-2 text-xs text-blue-500">
                      (تجربة حتى {new Date(sub.trial_end).toLocaleDateString("ar-SA")})
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {subscriptions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  لا يوجد اشتراكات
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
