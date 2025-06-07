"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function AdminError() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message") || "An error occurred";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-16 w-16 text-red-500 mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>

        <h1 className="text-2xl font-bold text-gray-800 mb-4">Lỗi</h1>
        <p className="text-gray-600 mb-6">{message}</p>

        <div className="flex justify-center space-x-4">
          <Link
            href="/login"
            className="btn btn-primary bg-amber-500 text-white border-amber-600 hover:bg-amber-600"
          >
            Đăng nhập lại
          </Link>
          <Link
            href="/"
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
