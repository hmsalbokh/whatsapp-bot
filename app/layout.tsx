import type { Metadata } from "next";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import Header from "./header";
import ToastContainer from "@/components/toast";

export const metadata: Metadata = {
  title: "WhatsApp Bot — خدمة العملاء الذكية",
  description: "بوت واتساب ذكي لخدمة العملات يعمل بـ OpenRouter و OpenWA",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="ar" dir="rtl">
      <body className="bg-gray-50 text-gray-900 antialiased">
        {user && <Header user={{ email: user.email!, id: user.id }} />}
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
