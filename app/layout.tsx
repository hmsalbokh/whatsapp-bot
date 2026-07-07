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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    isAdmin = await checkAdmin(user.id);
  }

  return (
    <html lang="ar" dir="rtl">
      <body className="bg-gray-50 text-gray-900 antialiased">
        {user && <Header user={{ email: user.email!, id: user.id }} isAdmin={isAdmin} />}
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
