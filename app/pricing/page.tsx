"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  limits: {
    projects: number;
    contacts: number;
    messages_per_month: number;
    teams: number;
  };
}

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [yearly, setYearly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/plans")
      .then((r) => r.json())
      .then((d) => setPlans(d.plans ?? []))
      .finally(() => setLoading(false));
  }, []);

  const price = (p: Plan) => (yearly ? p.price_yearly : p.price_monthly);
  const period = (p: Plan) => {
    if (p.price_monthly === 0) return "";
    return yearly ? "/السنة" : "/الشهر";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="flex items-center justify-between border-b bg-white/80 px-6 py-3 backdrop-blur">
        <Link href="/" className="text-lg font-bold text-gray-800">
          🤖 WhatsApp Bot
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="rounded-lg px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-100"
          >
            دخول
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-700"
          >
            بدء التجربة
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">
            اختر خطتك المناسبة
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            ابدأ مجاناً، ثم ترقى عندما تحتاج المزيد. جميع الخطط تشمل بوت ذكاء
            اصطناعي متكامل.
          </p>
        </div>

        <div className="mb-10 flex items-center justify-center gap-3">
          <span className={`text-sm ${!yearly ? "font-semibold text-gray-900" : "text-gray-500"}`}>شهري</span>
          <button
            onClick={() => setYearly(!yearly)}
            className={`relative h-6 w-12 rounded-full transition ${yearly ? "bg-blue-600" : "bg-gray-300"}`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${yearly ? "translate-x-6" : ""}`}
            />
          </button>
          <span className={`text-sm ${yearly ? "font-semibold text-gray-900" : "text-gray-500"}`}>سنوي
            <span className="mr-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">وفر ١٧٪</span>
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : (
          <div className={`grid gap-8 ${plans.length === 3 ? "md:grid-cols-3" : `md:grid-cols-${plans.length}`}`}>
            {plans.map((plan) => {
              const isFree = plan.price_monthly === 0;
              const isPopular = plan.slug === "pro";
              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-2xl border bg-white p-8 shadow-sm transition hover:shadow-lg ${isPopular ? "border-blue-300 ring-2 ring-blue-500" : "border-gray-200"}`}
                >
                  {isPopular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-1 text-xs font-semibold text-white">
                      الأكثر طلباً
                    </span>
                  )}
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900">{plan.name}</h2>
                    <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
                  </div>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">
                      {isFree ? "مجاني" : `${price(plan)}`}
                    </span>
                    {!isFree && (
                      <span className="mr-1 text-lg text-gray-500">{period(plan)}</span>
                    )}
                  </div>
                  <ul className="mb-8 flex-1 space-y-3">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="text-green-500">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={isFree ? "/auth/signup" : "/auth/signup"}
                    className={`block rounded-xl px-4 py-3 text-center text-sm font-semibold transition ${
                      isPopular
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {isFree ? "ابدأ مجاناً" : "ابدأ التجربة"}
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
