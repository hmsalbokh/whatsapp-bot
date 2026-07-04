import Link from "next/link";

export default function Header({
  user,
}: {
  user: { email: string; id: string };
}) {
  return (
    <header className="flex items-center justify-between border-b bg-white px-4 py-2 shadow-sm">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-800">🤖 WhatsApp Bot</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            المشاريع
          </Link>
          <Link href="/projects/new" className="text-gray-600 hover:text-gray-900">
            + مشروع جديد
          </Link>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">{user.email}</span>
        <form action="/auth/signout" method="POST">
          <button
            type="submit"
            className="rounded-lg px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-50"
          >
            تسجيل الخروج
          </button>
        </form>
      </div>
    </header>
  );
}
