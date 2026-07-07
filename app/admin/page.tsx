"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface AdminStats {
  users: { total: number };
  tenants: { total: number };
  projects: { total: number };
  messages: { total: number; today: number };
  conversations: { total: number };
  contacts: { total: number };
  knowledge: { total: number };
  handoffs: { total: number };
  subscriptions: { active: number };
  failedJobs: { total: number };
  lastActivity: string | null;
}

function StatCard({
  label,
  value,
  icon,
  href,
  sub,
}: {
  label: string;
  value: number | string;
  icon: string;
  href?: string;
  sub?: string;
}) {
  const card = (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
          {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{card}</Link>;
  }
  return card;
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="h-4 w-20 rounded bg-gray-200 mb-3" />
          <div className="h-8 w-16 rounded bg-gray-300" />
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch stats");
        return r.json();
      })
      .then((data) => {
        setStats(data.stats);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-gray-900">لوحة التحكم</h1>
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-3">⚠️</p>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
        <p className="text-sm text-gray-500 mt-1">
          نظرة عامة على المنصة
          {stats.lastActivity && (
            <span className="mr-2">
              — آخر نشاط: {new Date(stats.lastActivity).toLocaleDateString("ar-SA")}
            </span>
          )}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard
          label="المستخدمين"
          value={stats.users.total}
          icon="👥"
          href="/admin/users"
          sub={stats.users.total > 0 ? `${stats.users.total} مستخدم` : undefined}
        />
        <StatCard
          label="الشركات"
          value={stats.tenants.total}
          icon="🏢"
          href="/admin/tenants"
        />
        <StatCard
          label="المشاريع"
          value={stats.projects.total}
          icon="📁"
          href="/admin/tenants"
        />
        <StatCard
          label="الرسائل"
          value={stats.messages.total.toLocaleString()}
          icon="💬"
          sub={`${stats.messages.today.toLocaleString()} اليوم`}
        />
        <StatCard
          label="المحادثات"
          value={stats.conversations.total}
          icon="🗨️"
        />
        <StatCard
          label="جهات الاتصال"
          value={stats.contacts.total}
          icon="📞"
        />
        <StatCard
          label="قاعدة المعرفة"
          value={stats.knowledge.total}
          icon="📚"
        />
        <StatCard
          label="طلبات التحويل"
          value={stats.handoffs.total}
          icon="🔄"
        />
        <StatCard
          label="الاشتراكات النشطة"
          value={stats.subscriptions.active}
          icon="💳"
          href="/admin/subscriptions"
        />
        <StatCard
          label="الوظائف الفاشلة"
          value={stats.failedJobs.total}
          icon="❌"
          sub={stats.failedJobs.total > 0 ? "بحاجة للمراجعة" : "لا توجد"}
        />
      </div>
    </div>
  );
}
