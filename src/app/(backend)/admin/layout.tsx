"use client";

import { Suspense, useState, useEffect } from "react";
import { UserInfo } from "@/components/admin/UserInfo";
import { Sidebar } from "@/components/admin/Sidebar";
import { useSession } from "@/lib/auth/client";
import { SessionProvider } from "@/components/SessionProvider";

function HeaderClient({ toggleSidebar }: { toggleSidebar: () => void }) {
  return (
    <div className="navbar bg-base-100 border-b border-base-300 shadow-md px-4">
      <div className="flex-none lg:hidden">
        <button className="btn btn-square btn-ghost" onClick={toggleSidebar}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="inline-block w-5 h-5 stroke-current"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            ></path>
          </svg>
        </button>
      </div>
      <div className="flex-1">
        <span className="text-xl font-bold">Truyện Chữ Admin</span>
      </div>
      <div className="flex-none">
        <UserInfoWrapper />
      </div>
    </div>
  );
}

function UserInfoWrapper() {
  const { session, loading } = useSession();

  if (loading)
    return <div className="animate-pulse h-8 w-20 bg-base-300 rounded"></div>;
  if (!session) return null;

  return <UserInfo name={session.user.name} />;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <SessionProvider>
      <div className="min-h-screen bg-base-200">
        <Suspense fallback={<div className="h-16 bg-base-100 shadow-sm" />}>
          <HeaderClient toggleSidebar={toggleSidebar} />
        </Suspense>

        <div className="drawer lg:drawer-open">
          <input
            id="admin-drawer"
            type="checkbox"
            className="drawer-toggle"
            checked={isMounted && isSidebarOpen}
            onChange={toggleSidebar}
          />
          <div className="drawer-content flex flex-col">
            <main className="flex-1 mx-auto w-full max-w-6xl p-4 lg:p-6">
              {children}
            </main>
          </div>
          <div className="drawer-side z-10">
            <label
              htmlFor="admin-drawer"
              aria-label="close sidebar"
              className="drawer-overlay"
            ></label>
            <div className="bg-base-100 min-h-screen border-r border-base-300">
              <Sidebar />
            </div>
          </div>
        </div>
      </div>
    </SessionProvider>
  );
}
