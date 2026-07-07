"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const navItems = [
  { href: "/admin", label: "لوحة التحكم", icon: "📊" },
  { href: "/admin/registrations", label: "طلبات التسجيل", icon: "📋" },
  { href: "/admin/users", label: "المستخدمين", icon: "👥" },
  { href: "/admin/tenants", label: "الشركات والمشاريع", icon: "🏢" },
  { href: "/admin/subscriptions", label: "الاشتراكات", icon: "💳" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/auth/user")
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) {
          router.push("/auth/login?redirect=/admin");
          return;
        }
        return fetch("/api/admin/stats");
      })
      .then((r) => {
        if (r && r.ok) setAuthorized(true);
        else if (r) {
          router.push("/");
        }
      })
      .catch(() => router.push("/auth/login?redirect=/admin"));
  }, [router]);

  if (authorized === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 border-l bg-white p-4 shadow-sm">
        <div className="mb-6">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-800">⚙️ لوحة التحكم</span>
          </Link>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  isActive
                    ? "bg-blue-50 font-medium text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-8 border-t pt-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            ← العودة للتطبيق
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  );
}
