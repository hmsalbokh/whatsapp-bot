"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <p className="text-6xl mb-4">⚠️</p>
        <h1 className="text-xl font-bold text-gray-800 mb-2">حدث خطأ غير متوقع</h1>
        <p className="text-sm text-gray-500 mb-6">
          {process.env.NODE_ENV === "production"
            ? "نأسف للإزعاج. يرجى المحاولة مرة أخرى."
            : error.message}
        </p>
        <button
          onClick={reset}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          إعادة المحاولة
        </button>
      </div>
    </div>
  );
}
