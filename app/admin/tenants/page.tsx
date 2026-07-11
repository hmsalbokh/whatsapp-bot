"use client";

import { useEffect, useState, useCallback } from "react";
import { ErrorState } from "@/components/ui";

interface TenantSubscription {
  status: string;
  planName: string;
  planSlug: string;
}

interface TenantProject {
  id: string;
  name: string;
  created_at: string;
}

interface TenantEntry {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  projects: TenantProject[];
  userCount: number;
  subscription: TenantSubscription | null;
}

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<TenantEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchTenants = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/admin/tenants")
      .then((r) => {
        if (!r.ok) throw new Error("فشل تحميل الشركات");
        return r.json();
      })
      .then((data) => setTenants(data.tenants ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchTenants(); }, [fetchTenants]);

  const filtered = tenants.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.slug.includes(search)
  );

  if (loading) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-gray-900">الشركات والمشاريع</h1>
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl border bg-white p-4">
              <div className="h-4 w-1/4 rounded bg-gray-200 mb-3" />
              <div className="h-3 w-1/2 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-gray-900">الشركات والمشاريع</h1>
        <ErrorState
          description={error}
          action={
            <button
              onClick={fetchTenants}
              className="rounded-lg bg-brand-navy px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-navy-light cursor-pointer"
            >
              إعادة المحاولة
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الشركات والمشاريع</h1>
          <p className="text-sm text-gray-500 mt-1">
            إجمالي {tenants.length} شركة
          </p>
        </div>
        <input
          type="text"
          placeholder="بحث..."
          aria-label="بحث عن شركة"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 rounded-xl border border-gray-300 px-4 py-2 text-sm outline-none focus:border-brand-navy focus:ring-1 focus:ring-brand-navy/40"
        />
      </div>

      <div className="space-y-4">
        {filtered.map((tenant) => (
          <div
            key={tenant.id}
            className="rounded-2xl border border-gray-200 bg-white p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900">{tenant.name}</h3>
                <p className="text-xs text-gray-400">
                  {tenant.slug} — {new Date(tenant.created_at).toLocaleDateString("ar-SA")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">
                  {tenant.userCount} مستخدم
                </span>
                {tenant.subscription ? (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      tenant.subscription.status === "active" || tenant.subscription.status === "trialing"
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {tenant.subscription.planName}
                  </span>
                ) : (
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-500">
                    بدون اشتراك
                  </span>
                )}
              </div>
            </div>

            {tenant.projects.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500">المشاريع:</p>
                <div className="flex flex-wrap gap-2">
                  {tenant.projects.map((p) => (
                    <span
                      key={p.id}
                      className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-700"
                    >
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400">لا يوجد مشاريع</p>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="flex min-h-[20vh] items-center justify-center">
            <p className="text-gray-400">لا يوجد شركات</p>
          </div>
        )}
      </div>
    </div>
  );
}
