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
    <div className="min-h-screen bg-[#f9fafb] flex flex-col items-center px-4 py-6">
      <header className="w-full max-w-[1400px] mx-auto flex items-center justify-between mb-8 px-2">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[#0a152d] to-[#1a2d4d] shadow-md group-hover:shadow-lg transition-all">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <span className="font-display text-lg font-semibold text-[#0a1b33]">
            واتساب بوت
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/auth/login"
            className="rounded-full px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            دخول
          </Link>
          <Link
            href="/register"
            className="rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-all shadow-md hover:shadow-lg"
            style={{ backgroundColor: "#0a152d" }}
          >
            بدء التجربة
          </Link>
        </div>
      </header>

      <HeroSection />

      {/* Stats bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mt-10 w-full max-w-[1400px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-slate-200/60 bg-white p-5 text-center shadow-sm"
          >
            <p className="font-display text-2xl font-bold text-[#0a152d]">{s.value}</p>
            <p className="mt-1 text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Marquee */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mt-12 w-full max-w-[1400px] mx-auto"
      >
        <MarqueeScroller />
      </motion.div>

      {/* Features */}
      <section className="mt-16 w-full max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-[#0a152d]/5 border border-[#0a152d]/10 px-4 py-1.5 text-xs font-semibold text-[#0a152d] mb-4">
            <MessageCircle className="w-3.5 h-3.5" />
            مميزات المنصة
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-[#0a1b33]">
            كل ما تحتاجه لإدارة <span className="text-green-500">خدمة العملاء</span>
          </h2>
          <p className="mt-3 text-slate-500 max-w-xl mx-auto">
            منصة متكاملة تجمع بين الذكاء الاصطناعي والأتمتة لتحسين تجربة عملائك
          </p>
        </motion.div>
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i} />
          ))}
        </div>
      </section>

      {/* Highlights */}
      <section className="mt-16 w-full max-w-[1400px] mx-auto">
        <div className="rounded-3xl bg-gradient-to-br from-[#0a152d] to-[#1a2d4d] p-8 md:p-12 shadow-xl">
          <div className="grid gap-8 md:grid-cols-3">
            {highlights.map((h) => {
              const Icon = h.icon;
              return (
                <motion.div
                  key={h.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="text-center"
                >
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 border border-white/10 mb-5">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-white mb-2">
                    {h.title}
                  </h3>
                  <p className="text-sm text-white/60 leading-relaxed">
                    {h.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mt-16 w-full max-w-[1400px] mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-[#0a1b33]">
            جهز بوتك الذكي اليوم
          </h2>
          <p className="mt-3 text-slate-500 max-w-lg mx-auto">
            ابدأ مجاناً بدون بطاقة ائتمان وأطلق العنان لذكاء اصطناعي يخدم عملاءك
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 mt-8 rounded-full px-8 py-3.5 text-sm font-semibold text-white shadow-xl hover:shadow-2xl transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: "#0a152d" }}
          >
            ابدأ مجاناً الآن
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </motion.div>
      </section>

      <footer className="mt-20 w-full max-w-[1400px] mx-auto border-t border-slate-200/60 py-8 text-center text-sm text-slate-400">
        <div className="flex items-center justify-center gap-2 mb-2">
          <MessageCircle className="w-4 h-4" />
          <span className="font-display font-semibold text-slate-500">واتساب بوت</span>
        </div>
        <p>© {new Date().getFullYear()} — منصة خدمة العملاء الذكية</p>
      </footer>
    </div>
  );
}
