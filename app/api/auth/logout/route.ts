import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revokeSession, clearSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("chad_session")?.value;
    if (token) {
      await revokeSession(token);
    }
    await clearSessionCookie();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
