"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewProjectPage() {
  const [tenantName, setTenantName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [industry, setIndustry] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantName,
          projectName,
          industry: industry || null,
          companyDescription: companyDescription || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "حدث خطأ");
        return;
      }

      router.push(`/projects/${data.project.id}`);
      router.refresh();
    } catch {
      setError("فشل الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-xl font-bold text-gray-800 mb-6">إنشاء مشروع جديد</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            اسم المؤسسة <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={tenantName}
            onChange={(e) => setTenantName(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="مثال: شركة السلام للتجارة"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            اسم المشروع <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="مثال: خدمة عملاء واتساب"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            المجال
          </label>
          <input
            type="text"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="مثال: تجارة إلكترونية"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            وصف الشركة
          </label>
          <textarea
            rows={3}
            value={companyDescription}
            onChange={(e) => setCompanyDescription(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="وصف قصير عن الشركة ونشاطها..."
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "جاري الإنشاء..." : "إنشاء المشروع"}
        </button>
      </form>
    </div>
  );
}
