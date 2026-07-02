import type { Order, FaqEntry, Ticket } from "@/types";

export const mockOrders: Order[] = [
  {
    id: "ORD-1001",
    customerName: "أحمد محمد",
    items: ["لابتوب HP", "ماوس لاسلكي"],
    total: 4599,
    status: "shipped",
    createdAt: "2026-06-28T10:00:00Z",
    updatedAt: "2026-06-29T14:30:00Z",
  },
  {
    id: "ORD-1002",
    customerName: "سارة علي",
    items: ["هاتف آيفون 16", "غطاء حماية"],
    total: 3899,
    status: "delivered",
    createdAt: "2026-06-25T08:15:00Z",
    updatedAt: "2026-06-27T16:45:00Z",
  },
  {
    id: "ORD-1003",
    customerName: "خالد عمر",
    items: ["سماعة بلوتوث"],
    total: 299,
    status: "pending",
    createdAt: "2026-06-30T09:00:00Z",
    updatedAt: "2026-06-30T09:00:00Z",
  },
];

export const mockFaq: FaqEntry[] = [
  {
    id: "faq-1",
    question: "كم تستغرق مدة التوصيل؟",
    answer:
      "مدة التوصيل تتراوح بين 3-7 أيام عمل حسب منطقتك. يمكنك تتبع طلبك عبر رابط التتبع المرسل إلى بريدك الإلكتروني.",
    keywords: ["توصيل", "شحن", "مدة", "وصل", "استلام"],
    category: "الشحن والتوصيل",
  },
  {
    id: "faq-2",
    question: "كيف يمكنني إرجاع المنتج؟",
    answer:
      "يمكنك إرجاع المنتج خلال 14 يومًا من تاريخ الاستلام. يجب أن يكون المنتج بحالته الأصلية مع العبوة. تواصل معنا لبدء عملية الإرجاع.",
    keywords: ["إرجاع", "استرجاع", "مرتجع", "تبديل", "استبدال"],
    category: "الإرجاع والاستبدال",
  },
  {
    id: "faq-3",
    question: "ما هي طرق الدفع المتاحة؟",
    answer:
      "نقبل الدفع عبر: بطاقات الائتمان (فيزا، ماستركارد)، أبل باي، مدى، والدفع عند الاستلام (لطلب بقيمة أقل من 5000 ريال).",
    keywords: ["دفع", "طرق الدفع", "فيزا", "مدى", "أبل باي", "كاش"],
    category: "الدفع",
  },
  {
    id: "faq-4",
    question: "كيف أتتبع طلبي؟",
    answer:
      "بعد شحن طلبك، ستصلك رسالة بريد إلكتروني تحتوي على رابط التتبع. يمكنك أيضًا استخدام رقم الطلب للاستعلام عن حالته.",
    keywords: ["تتبع", "طلب", "شحن", "أين طلبي"],
    category: "الشحن والتوصيل",
  },
  {
    id: "faq-5",
    question: "هل يمكنني تغيير عنوان التوصيل بعد الطلب؟",
    answer:
      "نعم، يمكنك تغيير عنوان التوصيل إذا لم يتم شحن الطلب بعد. يرجى التواصل معنا فورًا لتحديث العنوان.",
    keywords: ["تغيير", "عنوان", "تعديل", "توصيل"],
    category: "الشحن والتوصيل",
  },
];

let ticketCounter = 0;

export function createMockTicket(
  customerName: string,
  issue: string,
  priority: "low" | "medium" | "high"
): Ticket {
  ticketCounter++;
  return {
    id: `TKT-${String(ticketCounter).padStart(4, "0")}`,
    customerName,
    issue,
    priority,
    status: "open",
    createdAt: new Date().toISOString(),
  };
}

export function findOrderById(orderId: string): Order | undefined {
  return mockOrders.find(
    (o) => o.id.toLowerCase() === orderId.toLowerCase()
  );
}

export function searchFaq(query: string): FaqEntry[] {
  const q = query.toLowerCase();
  return mockFaq.filter(
    (faq) =>
      faq.question.toLowerCase().includes(q) ||
      faq.keywords.some((k) => k.toLowerCase().includes(q)) ||
      faq.answer.toLowerCase().includes(q)
  );
}

export function getStatusText(status: Order["status"]): string {
  const map: Record<Order["status"], string> = {
    pending: "قيد الانتظار",
    confirmed: "تم التأكيد",
    shipped: "تم الشحن",
    delivered: "تم التوصيل",
    cancelled: "ملغي",
  };
  return map[status];
}
