"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_monthly: number;
  features: string[];
  limits: {
    projects: number;
    contacts: number;
    messages_per_month: number;
    teams: number;
  };
}

interface Subscription {
  id: string;
  status: string;
  current_period_end: string;
  trial_end: string | null;
  subscription_plans: Plan;
}

interface UsageData {
  usage: { projects: number; messages: number; contacts: number } | null;
  limits: { projects: number; contacts: number; messages_per_month: number; teams: number } | null;
}

function UsageBar({ current, limit, label }: { current: number; limit: number; label: string }) {
  const pct = limit > 0 ? Math.min((current / limit) * 100, 100) : 0;
  const color = pct > 90 ? "bg-red-500" : pct > 70 ? "bg-yellow-500" : "bg-blue-500";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">{current} / {limit === 999999 ? "غير محدود" : limit}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-200">
        <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/subscriptions").then((r) => r.json()),
      fetch("/api/plans").then((r) => r.json()),
      fetch("/api/subscriptions/usage").then((r) => r.json()),
    ]).then(([subData, plansData, usageData]) => {
      setSub(subData.subscription ?? null);
      setPlans(plansData.plans ?? []);
      setUsage(usageData);
    }).catch((err) => console.error("Failed to load subscription data:", err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const currentPlan = sub?.subscription_plans;
  const limits = usage?.limits;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">إدارة الاشتراك</h1>

      {sub ? (
        <div className="space-y-8">
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">الخطة الحالية</p>
                <h2 className="text-2xl font-bold text-gray-900">{currentPlan?.name ?? "غير معروفة"}</h2>
                <p className="mt-1 text-sm text-gray-600">
                  الحالة: <span className="font-medium text-green-600">{sub.status === "trialing" ? "فترة تجريبية" : "نشط"}</span>
                  {sub.trial_end && (
                    <span className="mr-2 text-gray-500">
                      — تنتهي التجربة في {new Date(sub.trial_end).toLocaleDateString("ar-SA")}
                    </span>
                  )}
                </p>
              </div>
              <Link
                href="/pricing"
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                تغيير الخطة
              </Link>
            </div>
          </div>

          {limits && (
            <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6">
              <h3 className="font-semibold text-gray-900">استخدامك في الدورة الحالية</h3>
              <UsageBar current={usage?.usage?.projects ?? 0} limit={limits.projects} label="المشاريع" />
              <UsageBar current={usage?.usage?.messages ?? 0} limit={limits.messages_per_month} label="الرسائل" />
              <UsageBar current={usage?.usage?.contacts ?? 0} limit={limits.contacts} label="جهات الاتصال النشطة" />
            </div>
          )}

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h3 className="mb-4 font-semibold text-gray-900">ترقية خطتك</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {plans.filter((p) => p.slug !== currentPlan?.slug).map((plan) => (
                <div key={plan.id} className="rounded-xl border border-gray-200 p-4 transition hover:border-blue-300">
                  <h4 className="font-bold text-gray-900">{plan.name}</h4>
                  <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
                  <p className="mt-2 text-lg font-bold text-blue-600">
                    {plan.price_monthly === 0 ? "مجاني" : `${plan.price_monthly} ريال/شهر`}
                  </p>
                  <Link
                    href={`/auth/login?redirect=/pricing`}
                    className="mt-3 inline-block rounded-lg border border-blue-600 px-4 py-1.5 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
                  >
                    التبديل إلى {plan.name}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
          <p className="mb-2 text-lg font-semibold text-gray-900">لا يوجد اشتراك نشط</p>
          <p className="mb-6 text-sm text-gray-500">ابدأ بإنشاء مشروع أو اشترك في إحدى خططنا</p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/pricing"
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              عرض الخطط
            </Link>
            <Link
              href="/projects/new"
              className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              إنشاء مشروع
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
