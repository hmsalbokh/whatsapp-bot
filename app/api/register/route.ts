import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, email, phone, companyName, planSlug } = body;

    if (!fullName || !email || !companyName) {
      return NextResponse.json(
        { error: "fullName, email, and companyName are required" },
        { status: 400 }
      );
    }

    const admin = getServiceClient();

    const { data: existing } = await admin
      .from("registration_requests")
      .select("id, status")
      .eq("email", email)
      .maybeSingle() as unknown as { data: { id: string; status: string } | null };

    if (existing) {
      if (existing.status === "pending") {
        return NextResponse.json(
          { error: "لديك طلب تسجيل قيد المراجعة بالفعل" },
          { status: 409 }
        );
      }
      if (existing.status === "approved") {
        return NextResponse.json(
          { error: "هذا البريد مسجل بالفعل. يمكنك تسجيل الدخول" },
          { status: 409 }
        );
      }
    }

    const { error } = await admin.from("registration_requests").insert({
      full_name: fullName,
      email,
      phone: phone || null,
      company_name: companyName,
      plan_slug: planSlug || "free",
      status: "pending",
    } as never);

    if (error) {
      return NextResponse.json(
        { error: `فشل التسجيل: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "تم استلام طلبك بنجاح. سنقوم بمراجعته وتفعيل حسابك قريباً",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
