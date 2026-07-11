"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { MessageCircle, ChevronLeft, Shield, Globe, Headphones } from "lucide-react";
import HeroSection, { MarqueeScroller, features, FeatureCard } from "@/components/landing/hero-section";

const stats = [
  { value: "٢٤/٧", label: "دعم فني متواصل" },
  { value: "١٠٠٪", label: "أتمتة الردود" },
  { value: "ثوانٍ", label: "زمن الاستجابة" },
  { value: "مجاني", label: "لبدء التجربة" },
];

const highlights = [
  { icon: Shield, title: "آمن وموثوق", desc: "تشفير كامل للمحادثات وحماية بيانات العملاء" },
  { icon: Globe, title: "متعدد اللغات", desc: "يدعم العربية والإنجليزية وأكثر من ٥٠ لغة" },
  { icon: Headphones, title: "دعم فني", desc: "فريق دعم متخصص لمساعدتك على مدار الساعة" },
];

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/user")
      .then((r) => r.json())
      .then((data) => {
        if (data?.user) router.push("/projects");
      })
      .catch(() => {});
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-200/50 bg-white/80 backdrop-blur-lg">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between px-4 h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-navy shadow-sm">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-base font-semibold text-brand-navy-text">
              واتساب بوت
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/pricing"
              className="rounded-lg px-4 py-2 text-sm font-body text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              الخطط
            </Link>
            <Link
              href="/register"
              className="rounded-lg px-4 py-2 text-sm font-body text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              تواصل معنا
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/auth/login"
              className="rounded-lg px-4 py-2 text-sm font-body font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              دخول
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-brand-navy text-white px-5 py-2 text-sm font-body font-semibold hover:bg-brand-navy-light transition-colors shadow-sm"
            >
              ابدأ مجاناً
            </Link>
          </div>
        </div>
      </header>

      <main>
        <HeroSection />

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-[1200px] mx-auto mt-12 px-4"
        >
          <div className="rounded-2xl border border-slate-200/60 bg-white p-6 md:p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <p className="font-display text-3xl font-bold text-brand-navy-text">
                    {s.value}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 font-body">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Trust marquee */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-[1200px] mx-auto mt-16 px-4"
        >
          <p className="text-center text-xs text-slate-400 font-body mb-2 tracking-wider uppercase">
            تستخدمها فرق من جميع أنحاء العالم
          </p>
          <MarqueeScroller />
        </motion.div>

        {/* Features */}
        <section className="max-w-[1200px] mx-auto mt-16 px-4">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-navy/5 px-4 py-1.5 mb-4">
              <MessageCircle className="w-3.5 h-3.5 text-brand-navy" />
              <span className="text-[11px] font-display font-semibold text-brand-navy tracking-wide">
                مميزات المنصة
              </span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-brand-navy-text leading-tight">
              كل ما تحتاجه لإدارة
              <br className="md:hidden" />
              <span className="text-brand-emerald"> خدمة العملاء</span>
            </h2>
            <p className="mt-3 text-slate-500 max-w-md mx-auto font-body text-base">
              منصة متكاملة تجمع بين الذكاء الاصطناعي والأتمتة لتحسين تجربة عملائك
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <FeatureCard key={f.title} feature={f} index={i} />
            ))}
          </div>
        </section>

        {/* Highlights (dark section) */}
        <section className="max-w-[1200px] mx-auto mt-20 px-4">
          <div className="rounded-3xl bg-gradient-to-br from-brand-navy to-brand-navy-light p-8 md:p-14 shadow-xl">
            <div className="text-center mb-10">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-white leading-tight">
                لماذا تختار واتساب بوت؟
              </h2>
              <p className="mt-2 text-white/50 font-body text-sm max-w-md mx-auto">
                منصة بنيت لتعمل — لا مجرد وعد
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {highlights.map((h) => {
                const Icon = h.icon;
                return (
                  <motion.div
                    key={h.title}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4 }}
                    className="text-center"
                  >
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 mb-4">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-display text-base font-semibold text-white mb-1.5">
                      {h.title}
                    </h3>
                    <p className="text-sm text-white/50 leading-relaxed font-body max-w-xs mx-auto">
                      {h.desc}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-[1200px] mx-auto mt-20 px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-emerald/10 px-4 py-1.5 mb-4">
              <span className="w-2 h-2 rounded-full bg-brand-emerald" />
              <span className="text-[11px] font-display font-semibold text-brand-emerald-dark tracking-wide">
                ابدأ اليوم
              </span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-brand-navy-text leading-tight">
              جهز بوتك الذكي اليوم
            </h2>
            <p className="mt-3 text-slate-500 max-w-md mx-auto font-body text-base">
              ابدأ مجاناً بدون بطاقة ائتمان وأطلق العنان لذكاء اصطناعي يخدم عملاءك
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 mt-8 rounded-xl bg-brand-emerald text-white px-8 py-3.5 text-sm font-display font-semibold hover:bg-brand-emerald-dark transition-colors shadow-lg shadow-brand-emerald/20"
            >
              ابدأ مجاناً الآن
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <p className="mt-4 text-xs text-slate-400 font-body">
              لا تحتاج بطاقة ائتمان · إعداد خلال ٥ دقائق
            </p>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="max-w-[1200px] mx-auto mt-20 px-4 border-t border-slate-200/60 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-brand-navy" />
            <span className="font-display text-sm font-semibold text-brand-navy-text">واتساب بوت</span>
          </div>
          <p className="text-xs text-slate-400 font-body">
            © {new Date().getFullYear()} — منصة خدمة العملاء الذكية
          </p>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-xs text-slate-400 hover:text-slate-600 font-body transition-colors">
              الخطط
            </Link>
            <Link href="/register" className="text-xs text-slate-400 hover:text-slate-600 font-body transition-colors">
              التسجيل
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
