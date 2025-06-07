import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error("Session API error:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}
