"use client";

import { useEffect, useState, useCallback } from "react";
import { ErrorState } from "@/components/ui";

interface UserEntry {
  userId: string;
  tenants: { id: string; name: string; slug: string; role: string }[];
  firstSeen: string;
  projectCount: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchUsers = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/admin/users")
      .then((r) => {
        if (!r.ok) throw new Error("فشل تحميل المستخدمين");
        return r.json();
      })
      .then((data) => setUsers(data.users ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = users.filter((u) =>
    u.userId.toLowerCase().includes(search.toLowerCase()) ||
    u.tenants.some((t) => t.name.includes(search))
  );

  if (loading) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-gray-900">المستخدمين</h1>
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-white border p-4">
              <div className="h-4 w-1/3 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-gray-900">المستخدمين</h1>
        <ErrorState
          description={error}
          action={
            <button
              onClick={fetchUsers}
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
          <h1 className="text-2xl font-bold text-gray-900">المستخدمين</h1>
          <p className="text-sm text-gray-500 mt-1">
            إجمالي {users.length} مستخدم
          </p>
        </div>
        <input
          type="text"
          placeholder="بحث..."
          aria-label="بحث عن مستخدم"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 rounded-xl border border-gray-300 px-4 py-2 text-sm outline-none focus:border-brand-navy focus:ring-1 focus:ring-brand-navy/40"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <table className="w-full text-right text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th scope="col" className="px-4 py-3 font-medium text-gray-600">المستخدم</th>
              <th scope="col" className="px-4 py-3 font-medium text-gray-600">الشركات</th>
              <th scope="col" className="px-4 py-3 font-medium text-gray-600">المشاريع</th>
              <th scope="col" className="px-4 py-3 font-medium text-gray-600">أول ظهور</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.userId} className="border-b last:border-b-0 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-gray-700">
                    {u.userId.slice(0, 8)}...
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {u.tenants.map((t) => (
                      <span
                        key={t.id}
                        className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
                      >
                        {t.name}
                        <span className="text-[10px] text-blue-400">({t.role})</span>
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-700">{u.projectCount}</td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(u.firstSeen).toLocaleDateString("ar-SA")}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  لا يوجد مستخدمين
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
