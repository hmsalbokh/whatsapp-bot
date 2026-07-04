"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Project {
  id: string;
  name: string;
  industry: string | null;
  company_description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
}

interface AgentSettings {
  model: string;
  language: string;
  temperature: number;
  max_tokens: number;
  system_prompt: string | null;
}

export default function SettingsPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    industry: "",
    company_description: "",
    contact_email: "",
    contact_phone: "",
  });

  const [agent, setAgent] = useState<AgentSettings>({
    model: "qwen/qwen-2.5-72b-instruct",
    language: "ar",
    temperature: 0.7,
    max_tokens: 1024,
    system_prompt: "",
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${id}`).then((r) => r.json()),
      fetch(`/api/projects/${id}/agent-settings`).then((r) => r.json()),
    ]).then(([projectData, agentData]) => {
      if (projectData.project) {
        const p = projectData.project;
        setForm({
          name: p.name ?? "",
          industry: p.industry ?? "",
          company_description: p.company_description ?? "",
          contact_email: p.contact_email ?? "",
          contact_phone: p.contact_phone ?? "",
        });
      }
      if (agentData.settings) {
        const s = agentData.settings;
        setAgent({
          model: s.model ?? "openai/gpt-4o-mini",
          language: s.language ?? "ar",
          temperature: s.temperature ?? 0.7,
          max_tokens: s.max_tokens ?? 1024,
          system_prompt: s.system_prompt ?? "",
        });
      }
    }).finally(() => setLoading(false));
  }, [id]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const res = await fetch(`/api/projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setMessage(res.ok ? "✅ تم حفظ الملف التجاري" : "❌ حدث خطأ");
    setSaving(false);
  }

  async function handleSaveAgent(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const res = await fetch(`/api/projects/${id}/agent-settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(agent),
    });

    setMessage(res.ok ? "✅ تم حفظ إعدادات الوكيل" : "❌ حدث خطأ");
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8 space-y-10">
      <h1 className="text-xl font-bold text-gray-800">⚙️ إعدادات المشروع</h1>

      {/* Business Profile */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">🏢 الملف التجاري</h2>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم المشروع</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">المجال</label>
            <input type="text" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="مثال: تجارة إلكترونية" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">وصف الشركة</label>
            <textarea rows={4} value={form.company_description} onChange={(e) => setForm({ ...form, company_description: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
            <input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 ltr" dir="ltr" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">رقم الجوال</label>
            <input type="text" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 ltr" dir="ltr" />
          </div>
          <button type="submit" disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            حفظ الملف التجاري
          </button>
        </form>
      </section>

      <hr className="border-gray-200" />

      {/* Agent Settings */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">🧠 إعدادات الوكيل الذكي</h2>
        <form onSubmit={handleSaveAgent} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الموديل</label>
            <select value={agent.model} onChange={(e) => setAgent({ ...agent, model: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500">
              <option value="qwen/qwen-2.5-72b-instruct">Qwen 2.5 72B</option>
              <option value="qwen/qwen-2.5-32b-instruct">Qwen 2.5 32B</option>
              <option value="qwen/qwen-2.5-7b-instruct">Qwen 2.5 7B</option>
              <option value="mistralai/mistral-7b-instruct-v0.3">Mistral 7B</option>
              <option value="mistralai/mixtral-8x7b-instruct">Mixtral 8x7B</option>
              <option value="meta-llama/llama-3.1-8b-instruct">Llama 3.1 8B</option>
              <option value="meta-llama/llama-3.1-70b-instruct">Llama 3.1 70B</option>
              <option value="meta-llama/llama-3.2-3b-instruct">Llama 3.2 3B</option>
              <option value="deepseek/deepseek-chat">DeepSeek V3</option>
              <option value="deepseek/deepseek-r1">DeepSeek R1</option>
              <option value="microsoft/phi-4">Phi-4</option>
              <option value="google/gemma-2-9b-it">Gemma 2 9B</option>
              <option value="google/gemma-2-27b-it">Gemma 2 27B</option>
            </select>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">اللغة</label>
              <select value={agent.language} onChange={(e) => setAgent({ ...agent, language: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500">
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">الحرارة (Temperature)</label>
              <input type="number" step="0.05" min="0" max="2" value={agent.temperature}
                onChange={(e) => setAgent({ ...agent, temperature: parseFloat(e.target.value) || 0.7 })}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الحد الأقصى للتوكنز</label>
            <input type="number" min="128" max="8192" step="128" value={agent.max_tokens}
              onChange={(e) => setAgent({ ...agent, max_tokens: parseInt(e.target.value) || 1024 })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              تعليمات مخصصة (System Prompt)
              <span className="text-gray-400 font-normal mr-1">— اختياري</span>
            </label>
            <textarea rows={6} value={agent.system_prompt ?? ""}
              onChange={(e) => setAgent({ ...agent, system_prompt: e.target.value || null })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 font-mono"
              placeholder="إذا تركت فارغًا، سيتم إنشاء التعليمات تلقائيًا من الملف التجاري وقاعدة المعرفة" />
          </div>
          <button type="submit" disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            حفظ إعدادات الوكيل
          </button>
        </form>
      </section>

      {message && (
        <div className={`rounded-lg px-3 py-2 text-sm ${
          message.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
        }`}>
          {message}
        </div>
      )}
    </div>
  );
}
