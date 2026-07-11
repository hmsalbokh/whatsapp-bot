"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { MessageCircle, ChevronRight, Check, Loader2, Building2, User, Phone as PhoneIcon, Mail, CreditCard } from "lucide-react";

const plans = [
  { slug: "free", name: "مجاني", price: "مجاني", desc: "للتجربة الأولية" },
  { slug: "pro", name: "احترافي", price: "٩٩ ريال/شهر", desc: "للشركات الصغيرة" },
  { slug: "enterprise", name: "غير محدود", price: "٢٩٩ ريال/شهر", desc: "للشركات الكبيرة" },
];

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [planSlug, setPlanSlug] = useState("free");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, phone, companyName, planSlug }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "حدث خطأ");
        setLoading(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setError("حدث خطأ في الاتصال");
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <div className="rounded-3xl bg-white p-10 shadow-xl border border-slate-200/60">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
              <Check className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="font-display text-2xl font-bold text-brand-navy-text mb-3">
              تم استلام طلبك 🎉
            </h1>
            <p className="text-slate-500 leading-relaxed mb-6">
              سنقوم بمراجعة طلبك وتفعيل حسابك قريباً. سيتم إشعارك عبر البريد الإلكتروني
              عند التفعيل.
            </p>
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 mb-8 text-right">
              <p className="text-xs text-slate-400 mb-1">ملخص الطلب</p>
              <p className="text-sm font-medium text-brand-navy-text">{fullName}</p>
              <p className="text-sm text-slate-500">{email}</p>
              <p className="text-sm text-slate-500">{companyName}</p>
              <p className="text-sm text-slate-500">الخطة: {plans.find(p => p.slug === planSlug)?.name}</p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-brand-navy text-white px-8 py-3 text-sm font-semibold shadow-md hover:shadow-lg transition-all"
            >
              <ChevronRight className="w-4 h-4" />
              العودة للرئيسية
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-brand-navy to-brand-navy-light shadow-md">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-lg font-semibold text-brand-navy-text">واتساب بوت</span>
          </Link>
          <h1 className="font-display text-3xl font-bold text-brand-navy-text">طلب اشتراك جديد</h1>
          <p className="mt-2 text-slate-500">املأ البيانات وسيتم تفعيل حسابك من قبل الإدارة</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-white p-8 md:p-10 shadow-xl border border-slate-200/60"
        >
          {/* Steps indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${
                    step >= s
                      ? "bg-brand-navy text-white"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {s}
                </div>
                {s < 2 && <div className={`w-12 h-0.5 rounded ${step > s ? "bg-brand-navy" : "bg-slate-200"}`} />}
              </div>
            ))}
            <div className="text-xs text-slate-400 mr-2">
              {step === 1 ? "البيانات" : "الخطة"}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                <div>
                  <label className="block text-sm font-medium text-brand-navy-text mb-1.5">
                    الاسم الكامل
                  </label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 py-3 pr-10 pl-4 text-sm outline-none focus:border-brand-navy focus:ring-1 focus:ring-brand-navy transition-all"
                      placeholder="محمد أحمد"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-navy-text mb-1.5">
                    البريد الإلكتروني
                  </label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      dir="ltr"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 py-3 pr-10 pl-4 text-sm outline-none focus:border-brand-navy focus:ring-1 focus:ring-brand-navy transition-all"
                      placeholder="admin@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-navy-text mb-1.5">
                    رقم الجوال (اختياري)
                  </label>
                  <div className="relative">
                    <PhoneIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      dir="ltr"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 py-3 pr-10 pl-4 text-sm outline-none focus:border-brand-navy focus:ring-1 focus:ring-brand-navy transition-all"
                      placeholder="+966 5x xxx xxxx"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-navy-text mb-1.5">
                    اسم الشركة / المؤسسة
                  </label>
                  <div className="relative">
                    <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 py-3 pr-10 pl-4 text-sm outline-none focus:border-brand-navy focus:ring-1 focus:ring-brand-navy transition-all"
                      placeholder="مؤسسة مثال للتجارة"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full rounded-xl bg-brand-navy text-white py-3 text-sm font-semibold hover:bg-brand-navy-text transition-colors shadow-md"
                >
                  التالي: اختر الخطة
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                <div className="grid gap-4">
                  {plans.map((plan) => {
                    const isSelected = planSlug === plan.slug;
                    const isPopular = plan.slug === "pro";
                    return (
                      <button
                        key={plan.slug}
                        type="button"
                        onClick={() => setPlanSlug(plan.slug)}
                        className={`relative flex items-center gap-4 rounded-2xl border p-5 text-right transition-all ${
                          isSelected
                            ? "border-brand-navy bg-brand-navy/5 ring-1 ring-brand-navy"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {isPopular && (
                          <span className="absolute -top-2.5 right-4 rounded-full bg-brand-navy px-3 py-0.5 text-[10px] font-semibold text-white">
                            الأكثر طلباً
                          </span>
                        )}
                        <div className={`flex items-center justify-center w-12 h-12 rounded-2xl transition-all ${
                          isSelected ? "bg-brand-navy text-white" : "bg-slate-100 text-slate-400"
                        }`}>
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-brand-navy-text">{plan.name}</p>
                          <p className="text-xs text-slate-500">{plan.desc}</p>
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-brand-navy">{plan.price}</p>
                        </div>
                        {isSelected && (
                          <div className="absolute left-4 top-1/2 -translate-y-1/2">
                            <Check className="w-5 h-5 text-brand-navy" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 rounded-xl border border-slate-200 text-slate-600 py-3 text-sm font-semibold hover:bg-slate-50 transition-colors"
                  >
                    السابق
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-xl bg-brand-navy text-white py-3 text-sm font-semibold hover:bg-brand-navy-text transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        جاري الإرسال...
                      </>
                    ) : (
                      "إرسال الطلب"
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            لديك حساب بالفعل؟{" "}
            <Link href="/auth/login" className="text-brand-navy font-medium hover:underline">
              تسجيل الدخول
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
