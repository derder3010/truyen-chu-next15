import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST() {
  try {
    // Clear the auth token by setting an expired cookie
    const response = NextResponse.json({ success: true });

    // Set cookie with a past expiration date to effectively delete it
    response.cookies.set({
      name: "token",
      value: "",
      expires: new Date(0),
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Sign out API error:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}
