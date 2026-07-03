export default function Home() {
  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">OpenWA WhatsApp AI Agent</h1>
        <p className="mb-6">
          هذا هو لوحة الوكيل الذكي لخدمة العملاء عبر واتساب. استخدم رابط الإدارة لإدارة الوكلاء وإرسال الرسائل التجريبية.
        </p>
        <a href="/admin" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded">
          الذهاب إلى لوحة الإدارة
        </a>
      </div>
    </div>
  );
}