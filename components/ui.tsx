import { AlertCircle } from "lucide-react";

export function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border bg-white p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-full bg-gray-200" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-2/3 rounded bg-gray-200" />
          <div className="h-3 w-1/3 rounded bg-gray-200" />
        </div>
      </div>
      <div className="h-3 w-full rounded bg-gray-100 mb-2" />
      <div className="h-3 w-4/5 rounded bg-gray-100" />
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-xl border bg-white p-4">
          <div className="h-4 w-1/2 rounded bg-gray-200 mb-2" />
          <div className="h-3 w-3/4 rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 animate-pulse">
      <div className="h-6 w-1/3 rounded bg-gray-200 mb-6" />
      <CardSkeleton />
      <div className="mt-4"><CardSkeleton /></div>
      <div className="mt-4"><CardSkeleton /></div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-4">{icon}</div>
        <h3 className="text-lg font-semibold text-gray-800 mb-1">{title}</h3>
        <p className="text-sm text-gray-500 mb-4">{description}</p>
        {action}
      </div>
    </div>
  );
}

export function ErrorState({
  title,
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-1">
          {title || "حدث خطأ"}
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          {description || "تعذر تحميل البيانات. يرجى المحاولة مرة أخرى."}
        </p>
        {action}
      </div>
    </div>
  );
}
