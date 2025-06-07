import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { cache } from "react";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { UserRole } from "@/types/auth";

const JWT_SECRET =
  process.env.JWT_SECRET || "fallback-secret-do-not-use-in-production";

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
};

export type Session = {
  user: SessionUser;
  expires: Date;
};

// Create a JWT token
export async function createToken(userId: number): Promise<string> {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "8h" });
}

// Verify the JWT token
export async function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    return decoded;
  } catch {
    return null;
  }
}

// Get the current session
export const getSession = cache(async (): Promise<Session | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  const userData = await db.query.users.findFirst({
    where: eq(users.id, payload.userId),
    columns: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  if (!userData) return null;

  return {
    user: userData as SessionUser,
    expires: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours from now
  };
});

// Verify the session
export const verifySession = cache(async () => {
  const session = await getSession();
  return session;
});

// Auth check that requires admin role
export async function requireAdmin() {
  const session = await verifySession();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/admin/error?message=Unauthorized: Admin access required");
  }

  return session;
}

// Auth check that requires any authenticated user
export async function requireAuth() {
  const session = await verifySession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

// Get user by credentials
export async function getUserByCredentials(email: string, password: string) {
  const { default: bcrypt } = await import("bcryptjs");

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) return null;

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

// ADDITIONAL SERVER METHODS FROM MIDDLEWARE.TS

// Get token from cookies (server-only)
export async function getAuthToken() {
  const cookieStore = await cookies();
  return cookieStore.get("token")?.value;
}

// Check auth and redirect if not authenticated (server-only)
export async function checkAuth() {
  const token = await getAuthToken();
  if (!token) {
    redirect("/login");
  }

  const payload = await verifyToken(token);
  if (!payload) {
    redirect("/login");
  }

  return payload;
}
