import { NextRequest, NextResponse } from "next/server";
import { createToken, getUserByCredentials } from "@/lib/auth/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await getUserByCredentials(email, password);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create a JWT token
    const token = await createToken(user.id);

    // Create response with the cookie
    const response = NextResponse.json(
      {
        success: true,
        user: { id: user.id, name: user.name, role: user.role },
      },
      { status: 200 }
    );

    // Set the cookie
    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 8 * 60 * 60, // 8 hours
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
