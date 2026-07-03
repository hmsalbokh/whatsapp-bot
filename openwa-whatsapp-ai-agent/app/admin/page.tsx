'use client';

import React from 'react';
import type { Conversation, Message } from '@/lib/types';

export default function AdminPage() {
  const [adminSecret, setAdminSecret] = React.useState('');
  const [secretInput, setSecretInput] = React.useState('');
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState<'all' | 'bot' | 'handoff' | 'disabled'>('all');
  const [health, setHealth] = React.useState<Record<string, string> | null>(null);
  const [showHealth, setShowHealth] = React.useState(false);

  function apiHeaders() {
    return {
      'Content-Type': 'application/json',
      'x-admin-secret': adminSecret,
    };
  }

  React.useEffect(() => {
    if (adminSecret) {
      loadConversations();
    }
  }, [adminSecret]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/conversations', { headers: apiHeaders() });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to fetch');
      const data = await res.json();
      setConversations(data.conversations ?? []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const res = await fetch(`/api/admin/messages?conversation_id=${convId}`, {
        headers: apiHeaders(),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to fetch');
      const data = await res.json();
      setMessages(data.messages ?? []);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleBot = async (convId: string, enabled: boolean) => {
    try {
      const res = await fetch('/api/admin/conversations', {
        method: 'PATCH',
        headers: apiHeaders(),
        body: JSON.stringify({ id: convId, bot_enabled: enabled }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed');
      await loadConversations();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleHumanHandoff = async (convId: string, handoff: boolean) => {
    try {
      const res = await fetch('/api/admin/conversations', {
        method: 'PATCH',
        headers: apiHeaders(),
        body: JSON.stringify({ id: convId, human_handoff: handoff }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed');
      await loadConversations();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const sendMessage = async (to: string, text: string) => {
    try {
      const res = await fetch('/api/admin/send', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({ to, text }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to send');
      }
      await loadConversations();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const loadHealth = async () => {
    try {
      const res = await fetch('/api/admin/status', { headers: apiHeaders() });
      if (res.ok) {
        const data = await res.json();
        setHealth(data.checks ?? {});
      }
    } catch {
      setHealth({ error: 'Failed to load health' });
    }
    setShowHealth(true);
  };

  const filteredConversations = React.useMemo(() => {
    let list = conversations;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.customer_phone.toLowerCase().includes(q) ||
          (c.customer_name && c.customer_name.toLowerCase().includes(q))
      );
    }
    switch (filter) {
      case 'bot':
        list = list.filter((c) => c.bot_enabled && !c.human_handoff);
        break;
      case 'handoff':
        list = list.filter((c) => c.human_handoff);
        break;
      case 'disabled':
        list = list.filter((c) => !c.bot_enabled && !c.human_handoff);
        break;
    }
    return list;
  }, [conversations, search, filter]);

  const selectedConv = React.useMemo(
    () => conversations.find((c) => c.id === selectedId),
    [conversations, selectedId]
  );

  if (!adminSecret) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6" dir="rtl">
        <div className="bg-white rounded-xl shadow-sm border p-8 w-full max-w-sm">
          <h1 className="text-xl font-bold mb-4 text-center">لوحة الإدارة</h1>
          <p className="text-sm text-gray-500 mb-4 text-center">الرجاء إدخال مفتاح الأدمن</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (secretInput.trim()) setAdminSecret(secretInput.trim());
            }}
            className="space-y-3"
          >
            <input
              type="password"
              value={secretInput}
              onChange={(e) => setSecretInput(e.target.value)}
              placeholder="Admin Secret"
              className="w-full px-4 py-2 border rounded-lg text-sm text-center"
              required
              autoFocus
            />
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              دخول
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) return <div className="p-6 text-center text-gray-500">جارٍ التحميل...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">لوحة إدارة الوكيل الذكي</h1>
        <button
          onClick={() => { loadHealth(); setShowHealth(!showHealth); }}
          className="text-sm px-3 py-1.5 bg-gray-200 hover:bg-gray-300 rounded-lg"
        >
          {showHealth ? 'إخفاء' : 'حالة النظام'}
        </button>
      </div>

      {showHealth && health && (
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6 text-sm">
          <h3 className="font-semibold mb-2">حالة النظام</h3>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(health).map(([key, val]) => (
              <div key={key}>
                <span className="text-gray-500">{key}: </span>
                <span className={val === 'connected' || val === 'configured' ? 'text-green-600' : 'text-red-600'}>
                  {val}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm">
          {error}
          <button onClick={() => setError(null)} className="mr-2 font-bold">&times;</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border p-4 h-[75vh] flex flex-col">
          <div className="mb-3 space-y-2">
            <input
              type="text"
              placeholder="بحث برقم الجوال أو الاسم..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
            <div className="flex gap-1">
              {(['all', 'bot', 'handoff', 'disabled'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2 py-1 text-xs rounded ${
                    filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {f === 'all' ? 'الكل' : f === 'bot' ? 'تلقائي' : f === 'handoff' ? 'يدوي' : 'متوقف'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <p className="text-gray-400 text-center py-8">لا توجد محادثات</p>
            ) : (
              <ul className="space-y-2">
                {filteredConversations.map((conv) => (
                  <li
                    key={conv.id}
                    className={`p-3 border rounded-lg cursor-pointer transition ${
                      selectedId === conv.id ? 'border-blue-400 bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      setSelectedId(conv.id);
                      loadMessages(conv.id);
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate font-medium text-sm">
                        {conv.customer_name || conv.customer_phone}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {conv.human_handoff && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">يدوي</span>
                        )}
                        {!conv.bot_enabled && !conv.human_handoff && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">متوقف</span>
                        )}
                        {conv.bot_enabled && !conv.human_handoff && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">تلقائي</span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {conv.last_message_at
                        ? new Date(conv.last_message_at).toLocaleString('ar-SA')
                        : new Date(conv.created_at).toLocaleString('ar-SA')}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-4 flex flex-col">
          {selectedId && selectedConv ? (
            <>
              <div className="flex items-center justify-between mb-4 pb-3 border-b">
                <h2 className="text-lg font-semibold text-gray-700">
                  محادثة مع {selectedConv.customer_name || selectedConv.customer_phone}
                </h2>
                <div className="flex gap-2">
                  {selectedConv.human_handoff ? (
                    <button
                      onClick={() => handleHumanHandoff(selectedConv.id, false)}
                      className="px-3 py-1.5 text-sm bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg"
                    >
                      إرجاع للبوت
                    </button>
                  ) : selectedConv.bot_enabled ? (
                    <button
                      onClick={() => handleToggleBot(selectedConv.id, false)}
                      className="px-3 py-1.5 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg"
                    >
                      إيقاف البوت
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleBot(selectedConv.id, true)}
                      className="px-3 py-1.5 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg"
                    >
                      تفعيل البوت
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-[300px] max-h-[50vh]">
                {messages.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">لا توجد رسائل</p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.direction === 'inbound' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[80%] px-4 py-2.5 rounded-xl ${
                          msg.direction === 'inbound'
                            ? 'bg-gray-100 text-gray-800'
                            : msg.role === 'admin'
                            ? 'bg-green-500 text-white'
                            : 'bg-blue-500 text-white'
                        }`}
                      >
                        <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                        <div
                          className={`text-xs mt-1 ${
                            msg.direction === 'inbound' ? 'text-gray-400' : 'text-blue-100'
                          }`}
                        >
                          {msg.role === 'admin' ? 'أدمن' : msg.direction === 'inbound' ? 'العميل' : 'البوت'} ·{' '}
                          {new Date(msg.created_at).toLocaleTimeString('ar-SA')}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-4 border-t mt-auto">
                <h3 className="font-semibold text-sm mb-2 text-gray-600">إرسال رسالة يدوية</h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const text = (form.text as HTMLTextAreaElement).value.trim();
                    if (text && selectedConv) {
                      await sendMessage(selectedConv.customer_phone, text);
                      form.reset();
                      loadMessages(selectedConv.id);
                    }
                  }}
                  className="flex gap-2"
                >
                  <textarea
                    name="text"
                    rows={2}
                    required
                    placeholder="اكتب الرسالة هنا..."
                    className="flex-1 px-3 py-2 border rounded-lg text-sm resize-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm shrink-0 self-end"
                  >
                    إرسال
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              اختر محادثة من القائمة لعرض التفاصيل
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
