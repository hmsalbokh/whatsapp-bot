"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCheck } from "lucide-react";

interface ChatMessage {
  id: number;
  role: "customer" | "bot" | "agent";
  text: string;
  time: string;
}

const script: ChatMessage[] = [
  { id: 1, role: "customer", text: "السلام عليكم، عندي استفسار عن طلب", time: "10:32 ص" },
  { id: 2, role: "customer", text: "رقم الطلب #1245", time: "10:32 ص" },
  { id: 3, role: "bot", text: "وعليكم السلام! طلبك رقم ١٢٤٥ قيد التوصيل، متوقع وصوله غداً 🚚", time: "10:32 ص" },
  { id: 4, role: "customer", text: "شكراً! ممكن أغير عنوان التوصيل؟", time: "10:33 ص" },
  { id: 5, role: "agent", text: "تم تحويلك إلى فريق الدعم البشري للمساعدة", time: "10:33 ص" },
  { id: 6, role: "agent", text: "أهلاً بك! يمكنني تعديل العنوان. الرجاء إرسال العنوان الجديد", time: "10:34 ص" },
];

const typingDurations = [2000, 2400, 1800, 2200];

export default function ChatDemo() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [started, setStarted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!started) return;

    let step = 0;
    let timer: ReturnType<typeof setTimeout>;

    const advance = () => {
      if (step >= script.length) return;

      setIsTyping(true);
      const delay = step < typingDurations.length ? typingDurations[step] : 2000;

      timer = setTimeout(() => {
        setIsTyping(false);
        setVisibleCount(step + 1);
        step++;

        timer = setTimeout(advance, 900);
      }, delay);
    };

    timer = setTimeout(advance, 500);
    return () => clearTimeout(timer);
  }, [started]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleCount, isTyping]);

  return (
    <div className="w-full max-w-sm mx-auto" dir="ltr">
      <div className="rounded-[28px] bg-white shadow-[0_20px_70px_-15px_rgba(0,0,0,0.12)] border border-slate-200/70 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-navy to-brand-navy-light px-5 py-4 flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
              <span className="text-white font-display font-semibold text-sm">ب</span>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-brand-emerald border-2 border-brand-navy" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-display font-semibold truncate">بوت واتساب</p>
            <p className="text-white/60 text-[11px] font-body">بالعادة متاح الآن</p>
          </div>
        </div>

        {/* Messages area */}
        <div
          ref={scrollRef}
          className="h-[400px] overflow-y-auto px-4 py-4 space-y-2.5 bg-[#e8f4f8]"
        >
          {/* Initial bot greeting */}
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-white px-4 py-2.5 shadow-sm">
              <p className="text-xs text-slate-800 font-body leading-relaxed">
                مرحباً! كيف أقدر أساعدك اليوم؟
              </p>
            </div>
          </div>

          {/* Start button */}
          {!started && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center py-2"
            >
              <button
                onClick={() => setStarted(true)}
                className="text-xs text-brand-emerald font-body font-semibold hover:underline cursor-pointer"
              >
                اضغط لبدء المحادثة
              </button>
            </motion.div>
          )}

          {/* Animated messages */}
          <AnimatePresence mode="popLayout">
            {script.slice(0, visibleCount).map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={`flex ${msg.role === "customer" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm ${
                    msg.role === "customer"
                      ? "bg-brand-emerald text-white rounded-tr-sm"
                      : "bg-white text-slate-800 rounded-tl-sm"
                  }`}
                >
                  <p className="text-xs leading-relaxed font-body">{msg.text}</p>
                  <div
                    className={`flex items-center gap-1 mt-1 ${
                      msg.role === "customer" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <span
                      className={`text-[10px] ${
                        msg.role === "customer" ? "text-white/70" : "text-slate-400"
                      }`}
                    >
                      {msg.time}
                    </span>
                    {msg.role !== "customer" && (
                      <CheckCheck className="w-3 h-3 text-blue-400" />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="flex justify-end"
              >
                <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3.5 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce-dot" />
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce-dot" />
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce-dot" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
