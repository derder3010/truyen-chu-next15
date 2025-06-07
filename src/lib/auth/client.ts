"use client";

import { useEffect, useState } from "react";
import { UserRole } from "@/types/auth";

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

// Client-side function to get user session data
export async function getClientSession(): Promise<Session | null> {
  try {
    const res = await fetch("/api/auth/session");
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch session:", error);
    return null;
  }
}

// Custom hook for session data
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      try {
        const data = await getClientSession();
        setSession(data);
      } catch (error) {
        console.error("Failed to load session:", error);
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, []);

  return { session, loading, isAuthenticated: !!session };
}

// Custom hook to check admin role
export function useRequireAdmin() {
  const { session, loading, isAuthenticated } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated && session?.user.role === "admin") {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [loading, isAuthenticated, session]);

  return { session, loading, isAuthenticated, isAdmin };
}

// Sign out function
export async function signOut() {
  try {
    const res = await fetch("/api/auth/signout", { method: "POST" });
    if (!res.ok) throw new Error("Failed to sign out");
    window.location.href = "/login";
  } catch (error) {
    console.error("Sign out error:", error);
    throw error;
  }
}

// Sign in function
export async function signIn(email: string, password: string) {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to sign in");
    }

    return { success: true, user: data.user };
  } catch (error) {
    console.error("Sign in error:", error);
    throw error;
  }
}
