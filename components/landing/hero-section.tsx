"use client";

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  ChevronLeft,
  Bot,
  BookOpen,
  Users,
  BarChart3,
  Phone,
  Workflow,
} from "lucide-react";
import ChatDemo from "./chat-demo";

const features = [
  { icon: Bot, title: "ذكاء اصطناعي", desc: "بوت ذكي يجيب على استفسارات العملاء تلقائياً على مدار الساعة" },
  { icon: BookOpen, title: "قاعدة معرفة", desc: "أضف أسئلة وأجوبة مخصصة لمجالك الخاص" },
  { icon: Users, title: "تحويل بشري", desc: "حول المحادثة لفريق الدعم البشري بنقرة واحدة" },
  { icon: BarChart3, title: "تقارير وأداء", desc: "تابع أداء البوت ورضا العملاء بإحصائيات دقيقة" },
  { icon: Phone, title: "اتصال واتساب", desc: "اربط البوت مباشرة برقم واتساب وأرسل واستقبل الرسائل" },
  { icon: Workflow, title: "أتمتة ذكية", desc: "أتمتة سير العمل والتكامل مع أنظمتك بسهولة" },
];

const logos = [
  "shopify", "spotify", "figma", "blender",
  "google", "bing", "procure", "lottielab",
];

function MarqueeScroller() {
  return (
    <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
      <div className="animate-marquee flex w-max items-center gap-10 py-6">
        {[...logos, ...logos].map((name, i) => (
          <div
            key={`${name}-${i}`}
            className="h-10 w-28 shrink-0 flex items-center justify-center"
          >
            <span className="text-slate-300 font-display text-sm font-semibold tracking-widest uppercase">
              {name}
            </span>
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
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: "easeOut" }}
      className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm"
    >
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-navy/5 text-brand-navy shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="font-display text-base font-semibold text-brand-navy-text">
          {feature.title}
        </h3>
      </div>
      <p className="text-sm text-slate-500 leading-relaxed font-body">
        {feature.desc}
      </p>
    </motion.div>
  );
}

export default function HeroSection() {
  const router = useRouter();

  return (
    <section className="w-full">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-10 lg:gap-16 py-8 lg:py-12">
          {/* Left: Copy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex-1 lg:max-w-[480px]"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-emerald/10 border border-brand-emerald/20 px-4 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse" />
              <span className="text-[11px] font-display font-semibold text-brand-emerald-dark tracking-wide">
                خدمة عملاء بلا انتظار
              </span>
            </div>

            <h1 className="font-display text-[40px] md:text-[52px] lg:text-[60px] font-bold leading-[1.1] tracking-tight text-brand-navy-text">
              محادثات عملائك
              <br />
              <span className="text-brand-emerald">تبدأ هنا</span>
            </h1>

            <p className="font-body text-base md:text-lg text-slate-500 leading-relaxed mt-5 max-w-md">
              بوت ذكاء اصطناعي يرد على عملائك عبر واتساب تلقائياً،
              يتعلم من قاعدة معرفتك، ويحول المحادثات لفريقك عندما تحتاج.
            </p>

            <div className="flex items-center gap-3 mt-8">
              <button
                onClick={() => router.push("/register")}
                className="rounded-xl bg-brand-emerald text-white px-6 py-3 text-sm font-display font-semibold hover:bg-brand-emerald-dark transition-colors shadow-lg shadow-brand-emerald/20 cursor-pointer"
              >
                ابدأ مجاناً
              </button>
              <button
                onClick={() => router.push("/pricing")}
                className="rounded-xl border border-slate-300 text-slate-600 px-6 py-3 text-sm font-display font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                شاهد الخطط
              </button>
            </div>

            <div className="mt-8 flex items-center gap-6 text-xs text-slate-400 font-body">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald" />
                بدون بطاقة ائتمان
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald" />
                إعداد خلال دقائق
              </span>
            </div>
          </motion.div>

          {/* Right: Chat demo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
            className="flex-1 flex justify-center lg:justify-end"
          >
            <ChatDemo />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export { MarqueeScroller, features, FeatureCard };
