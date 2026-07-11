import Link from "next/link";
import { MessageCircle, Settings } from "lucide-react";

export default function Header({
  user,
  isAdmin = false,
}: {
  user: { email: string; id: string };
  isAdmin?: boolean;
}) {
  return (
    <header className="flex items-center justify-between border-b bg-white px-4 py-2 shadow-sm">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-brand-navy" />
          <span className="text-lg font-bold text-brand-navy">WhatsApp Bot</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/projects" className="text-gray-600 hover:text-gray-900">
            المشاريع
          </Link>
          <Link href="/projects/new" className="text-gray-600 hover:text-gray-900">
            + مشروع جديد
          </Link>
          <Link href="/dashboard/subscription" className="text-gray-600 hover:text-gray-900">
            الاشتراك
          </Link>
          <Link href="/pricing" className="text-gray-600 hover:text-gray-900">
            الخطط
          </Link>
          {isAdmin && (
            <Link href="/admin" className="text-brand-navy hover:text-brand-navy-light font-medium flex items-center gap-1">
              <Settings className="w-4 h-4" />
              لوحة التحكم
            </Link>
          )}
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">{user.email}</span>
        <form action="/auth/signout" method="POST">
          <button
            type="submit"
            className="rounded-lg px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-50 cursor-pointer"
          >
            تسجيل الخروج
          </button>
        </form>
      </div>
    </header>
  );
}
