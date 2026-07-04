"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface KnowledgeItem {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  category: string | null;
}

export default function KnowledgePage() {
  const { id: projectId } = useParams<{ id: string }>();
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [keywords, setKeywords] = useState("");
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const loadItems = useCallback(() => {
    fetch(`/api/projects/${projectId}/knowledge`)
      .then((r) => r.json())
      .then((data) => setItems(data.items ?? []))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const kw = keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    if (editId) {
      await fetch(`/api/projects/${projectId}/knowledge/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, answer, keywords: kw, category: category || null }),
      });
    } else {
      await fetch(`/api/projects/${projectId}/knowledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, answer, keywords: kw, category: category || null }),
      });
    }

    setQuestion("");
    setAnswer("");
    setKeywords("");
    setCategory("");
    setEditId(null);
    setShowForm(false);
    setSaving(false);
    loadItems();
  }

  async function handleDelete(id: string) {
    if (!confirm("تأكيد حذف هذا العنصر؟")) return;
    await fetch(`/api/projects/${projectId}/knowledge/${id}`, { method: "DELETE" });
    loadItems();
  }

  function handleEdit(item: KnowledgeItem) {
    setQuestion(item.question);
    setAnswer(item.answer);
    setKeywords(item.keywords.join(", "));
    setCategory(item.category ?? "");
    setEditId(item.id);
    setShowForm(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">📚 قاعدة المعرفة</h1>
          <p className="text-sm text-gray-500">
            أضف الأسئلة والإجابات الشائعة لاستخدامها في ردود البوت
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditId(null);
            setQuestion("");
            setAnswer("");
            setKeywords("");
            setCategory("");
          }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {showForm ? "إلغاء" : "+ إضافة"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="mb-8 rounded-xl border bg-white p-5 space-y-4 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">السؤال</label>
            <input
              type="text"
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              placeholder="مثال: كم مدة التوصيل؟"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الإجابة</label>
            <textarea
              rows={4}
              required
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              placeholder="الإجابة بالعربية..."
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                كلمات مفتاحية (مفصولة بفواصل)
              </label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                placeholder="توصيل, شحن, مدة"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">التصنيف</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                placeholder="شحن وتوصيل"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "جاري الحفظ..." : editId ? "تحديث" : "إضافة"}
          </button>
        </form>
      )}

      {items.length === 0 && !showForm && (
        <div className="text-center py-16">
          <p className="text-4xl mb-2">📚</p>
          <p className="text-sm text-gray-400">لا توجد عناصر في قاعدة المعرفة</p>
        </div>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-semibold text-gray-800 mb-1">{item.question}</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{item.answer}</p>
                {item.keywords && item.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
                {item.category && (
                  <p className="mt-1 text-[10px] text-gray-400">📂 {item.category}</p>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => handleEdit(item)}
                  className="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
