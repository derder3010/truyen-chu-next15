"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createToken, getUserByCredentials } from "./server";

type LoginState = {
  error?: string;
  success?: boolean;
};

export async function login(
  prevState: LoginState | undefined,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return {
      error: "Email and password are required",
    };
  }

  try {
    const user = await getUserByCredentials(email, password);

    if (!user) {
      return {
        error: "Invalid email or password",
      };
    }

    // Create a JWT token
    const token = await createToken(user.id);

    // Set the token as a cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: "token",
      value: token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 8 * 60 * 60, // 8 hours
    });

    return { success: true };
  } catch (error) {
    console.error("Login error:", error);
    return {
      error: "An unexpected error occurred",
    };
  }
}

export async function logout() {
  // Delete the token cookie
  const cookieStore = await cookies();
  cookieStore.set({
    name: "token",
    value: "",
    expires: new Date(0),
    path: "/",
  });
  redirect("/login");
}
