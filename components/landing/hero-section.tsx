"use client";

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  ChevronLeft,
  MessageCircle,
  BookOpen,
  Users,
  BarChart3,
  Phone,
  Workflow,
  Bot,
  Sparkles,
} from "lucide-react";

const logos = [
  {
    src: "https://svgl.app/library/procure.svg",
    alt: "Procure",
    gradient: { from: "#3b82f6", to: "#1d4ed8" },
  },
  {
    src: "https://svgl.app/library/shopify.svg",
    alt: "Shopify",
    gradient: { from: "#fbbf24", to: "#f59e0b" },
  },
  {
    src: "https://svgl.app/library/blender.svg",
    alt: "Blender",
    gradient: { from: "#3b82f6", to: "#1d4ed8" },
  },
  {
    src: "https://svgl.app/library/figma.svg",
    alt: "Figma",
    gradient: { from: "#a855f7", to: "#7c3aed" },
  },
  {
    src: "https://svgl.app/library/spotify.svg",
    alt: "Spotify",
    gradient: { from: "#ec4899", to: "#ef4444" },
  },
  {
    src: "https://svgl.app/library/lottielab.svg",
    alt: "Lottielab",
    gradient: { from: "#eab308", to: "#22c55e" },
  },
  {
    src: "https://svgl.app/library/google-cloud.svg",
    alt: "Google Cloud",
    gradient: { from: "#93c5fd", to: "#3b82f6" },
  },
  {
    src: "https://svgl.app/library/bing.svg",
    alt: "Bing",
    gradient: { from: "#22d3ee", to: "#0d9488" },
  },
];

const features = [
  { icon: Bot, title: "ذكاء اصطناعي", desc: "بوت ذكي يجيب على استفسارات العملاء تلقائياً على مدار الساعة" },
  { icon: BookOpen, title: "قاعدة معرفة", desc: "أضف أسئلة وأجوبة مخصصة لمجالك الخاص" },
  { icon: Users, title: "تحويل بشري", desc: "حول المحادثة لفريق الدعم البشري بنقرة واحدة" },
  { icon: BarChart3, title: "تقارير وأداء", desc: "تابع أداء البوت ورضا العملاء بإحصائيات دقيقة" },
  { icon: Phone, title: "اتصال واتساب", desc: "اربط البوت مباشرة برقم واتساب وأرسل واستقبل الرسائل" },
  { icon: Workflow, title: "أتمتة ذكية", desc: "أتمتة سير العمل والتكامل مع أنظمتك بسهولة" },
];

function MarqueeScroller() {
  return (
    <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
      <div className="animate-marquee flex w-max items-center gap-6 py-6">
        {[...logos, ...logos].map((logo, i) => (
          <div
            key={`${logo.alt}-${i}`}
            className="group relative h-28 w-44 shrink-0 flex items-center justify-center rounded-2xl bg-white border border-slate-200/60 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all duration-300 overflow-hidden"
          >
            <div
              className="absolute inset-0 scale-150 opacity-0 transition-all duration-500 group-hover:scale-100 group-hover:opacity-100"
              style={{
                background: `linear-gradient(135deg, ${logo.gradient.from}18, ${logo.gradient.to}18)`,
              }}
            />
            <div
              className="absolute -top-8 -right-8 w-16 h-16 rounded-full blur-2xl opacity-0 group-hover:opacity-40 transition-all duration-500"
              style={{ background: logo.gradient.from }}
            />
            <img
              src={logo.src}
              alt={logo.alt}
              className="relative z-10 h-11 w-auto object-contain transition-all duration-300 group-hover:brightness-0 group-hover:invert"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function FeatureCard({ feature, index }: { feature: typeof features[number]; index: number }) {
  const Icon = feature.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
      className="group relative rounded-2xl border border-slate-200/60 bg-white p-7 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-slate-300 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative z-10">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 text-slate-600 transition-all duration-300 group-hover:from-[#0a152d] group-hover:to-[#1a2d4d] group-hover:text-white group-hover:border-[#0a152d] group-hover:shadow-lg">
          <Icon className="w-6 h-6" />
        </div>
        <h3 className="font-display text-lg font-semibold text-[#0a1b33] group-hover:text-[#0a152d] transition-colors">
          {feature.title}
        </h3>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed group-hover:text-slate-600 transition-colors">
          {feature.desc}
        </p>
      </div>
    </motion.div>
  );
}

export default function HeroSection() {
  const router = useRouter();

  return (
    <div className="relative w-full max-w-[1400px] mx-auto rounded-[48px] bg-white border border-slate-200/50 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.03)] overflow-hidden min-h-[620px] flex flex-col">
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a152d]/70 via-[#0a152d]/30 to-transparent z-10" />
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover scale-105 transition-transform duration-1000"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260505_101331_74f9b798-3f00-4e86-8a01-377aa16ffeaa.mp4"
            type="video/mp4"
          />
        </video>
      </div>

      <div className="absolute top-8 right-8 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl z-10 pointer-events-none" />
      <div className="absolute bottom-32 left-16 w-48 h-48 rounded-full bg-purple-500/10 blur-3xl z-10 pointer-events-none" />

      <div className="relative z-20 flex-1 px-8 md:px-16 pt-16 md:pt-20 flex flex-col items-start">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-md border border-white/20 px-4 py-1.5 text-xs font-semibold text-white shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              منصة واتساب بوت — خدمة عملاء ذكية
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-display text-[44px] md:text-[60px] font-semibold tracking-tight leading-tight text-white max-w-3xl"
            dangerouslySetInnerHTML={{
              __html: "بوت ذكي<br />لخدمة العملاء عبر <span class=\"text-green-300\">واتساب</span>",
            }}
          />
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="font-sans text-[15px] md:text-[16px] mt-6 max-w-xl leading-relaxed text-white/70"
          >
            منصة متكاملة لربط الذكاء الاصطناعي بخدمة العملاء عبر واتساب.
            أتمتة الردود، قاعدة معرفة ذكية، وتحويل سلس للدعم البشري —
            كل ما تحتاجه في مكان واحد.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-10 flex items-center gap-4"
          >
            <motion.button
              onClick={() => router.push("/register")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="rounded-full px-8 py-3.5 text-sm font-semibold text-[#0a152d] transition-colors flex items-center gap-2 bg-white hover:bg-white/90 shadow-xl cursor-pointer"
            >
              ابدأ مجاناً
              <ChevronLeft className="w-4 h-4" />
            </motion.button>
            <motion.button
              onClick={() => router.push("/pricing")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="rounded-full px-8 py-3.5 text-sm font-semibold text-white transition-colors border border-white/30 hover:bg-white/10 cursor-pointer"
            >
              تعرف على المزيد
            </motion.button>
          </motion.div>
        </motion.div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30">
        <motion.nav
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
          className="flex items-center bg-white/95 backdrop-blur-2xl px-2 py-2 rounded-2xl shadow-[0_12px_50px_rgba(0,0,0,0.12)] border border-white/40"
        >
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#0a152d] to-[#1a2d4d] shadow-md">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <button
            onClick={() => router.push("/projects")}
            className="px-5 py-2 text-[13px] font-semibold text-slate-500 hover:text-[#0a1b33] transition-colors cursor-pointer"
          >
            المنتجات
          </button>
          <button
            onClick={() => router.push("/pricing")}
            className="px-5 py-2 text-[13px] font-semibold text-slate-500 hover:text-[#0a1b33] transition-colors cursor-pointer"
          >
            المستندات
          </button>
          <button
            onClick={() => router.push("/register")}
            className="flex items-center gap-1.5 bg-gradient-to-r from-[#0a152d] to-[#1a2d4d] px-6 py-2.5 rounded-xl text-[13px] font-semibold text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            ابدأ الآن
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </motion.nav>
      </div>
    </div>
  );
}

export { MarqueeScroller, features, FeatureCard };
