import type { Metadata } from "next";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase";
import Header from "./header";
import ToastContainer from "@/components/toast";

export const metadata: Metadata = {
  title: "WhatsApp Bot — خدمة العملاء الذكية",
  description: "بوت واتساب ذكي لخدمة العملاء — ذكاء اصطناعي، قاعدة معرفة، وتحويل للدعم البشري",
};

async function checkAdmin(userId: string): Promise<boolean> {
  try {
    const admin = getServiceClient();
    const { data } = await admin
      .from("super_admins")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    return !!data;
  } catch {
    return false;
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  let user: { id: string; email: string } | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user as { id: string; email: string } | null;
  } catch {
    user = null;
  }

  let isAdmin = false;
  if (user) {
    isAdmin = await checkAdmin(user.id);
  }

  return (
    <html lang="ar" dir="rtl">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:rounded-lg focus:bg-brand-navy focus:px-4 focus:py-2 focus:text-sm focus:text-white focus:outline-none"
        >
          تخطى إلى المحتوى الرئيسي
        </a>
        {user && <Header user={{ email: user.email!, id: user.id }} isAdmin={isAdmin} />}
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <ToastContainer />
      </body>
    </html>
  );
}
