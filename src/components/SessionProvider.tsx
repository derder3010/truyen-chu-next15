"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { usePathname } from "next/navigation";

// Định nghĩa các types cho session
type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type SessionContextType = {
  user: User | null;
  status: "loading" | "authenticated" | "unauthenticated";
  refresh: () => Promise<void>;
};

const SessionContext = createContext<SessionContextType>({
  user: null,
  status: "loading",
  refresh: async () => {},
});

export const useSession = () => useContext(SessionContext);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<
    "loading" | "authenticated" | "unauthenticated"
  >("loading");
  const pathname = usePathname();

  const fetchSession = async () => {
    try {
      const response = await fetch("/api/auth/session");

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
          setStatus("authenticated");
        } else {
          setUser(null);
          setStatus("unauthenticated");
        }
      } else {
        setUser(null);
        setStatus("unauthenticated");
      }
    } catch (error) {
      console.error("Failed to fetch session:", error);
      setUser(null);
      setStatus("unauthenticated");
    }
  };

  useEffect(() => {
    fetchSession();
  }, [pathname]);

  // Giá trị của context
  const contextValue = {
    user,
    status,
    refresh: fetchSession,
  };

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
}
