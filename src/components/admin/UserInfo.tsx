"use client";

import { signOut } from "@/lib/auth/client";

export function UserInfo({ name }: { name: string }) {
  const handleLogout = async () => {
    try {
      await signOut();
      // Note: signOut already handles redirection
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium">{name}</span>
        </div>
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 mt-2"
      >
        <li>
          <a>Thông tin tài khoản</a>
        </li>
        <li>
          <a onClick={handleLogout} className="text-error">
            Đăng xuất
          </a>
        </li>
      </ul>
    </div>
  );
}
