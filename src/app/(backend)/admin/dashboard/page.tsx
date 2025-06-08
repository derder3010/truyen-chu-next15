"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/client";

export default function DashboardPage() {
  const router = useRouter();
  const { session, loading, isAuthenticated } = useSession();

  // Kiểm tra xác thực và phân quyền admin
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (session?.user.role !== "admin") {
        router.push("/admin/error?message=Unauthorized: Admin access required");
      }
    }
  }, [loading, isAuthenticated, session, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  if (!session || session.user.role !== "admin") return null;

  return (
    <>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 mb-6">
        <h1 className="text-2xl font-bold">Bảng điều khiển</h1>
        <div className="breadcrumbs text-sm">
          <ul>
            <li>
              <a>Admin</a>
            </li>
            <li>Bảng điều khiển</li>
          </ul>
        </div>
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="stats shadow bg-primary text-primary-content">
          <div className="stat">
            <div className="stat-title opacity-80">Truyện</div>
            <div className="stat-value">0</div>
            <div className="stat-desc opacity-70">Tổng số truyện</div>
          </div>
        </div>

        <div className="stats shadow bg-secondary text-secondary-content">
          <div className="stat">
            <div className="stat-title opacity-80">Lượt xem</div>
            <div className="stat-value">0</div>
            <div className="stat-desc opacity-70">Tổng số lượt xem</div>
          </div>
        </div>

        <div className="stats shadow bg-accent text-accent-content">
          <div className="stat">
            <div className="stat-title opacity-80">Chương</div>
            <div className="stat-value">0</div>
            <div className="stat-desc opacity-70">Tổng số chương</div>
          </div>
        </div>

        <div className="stats shadow bg-base-100 border border-base-300">
          <div className="stat">
            <div className="stat-title">Người dùng</div>
            <div className="stat-value">1</div>
            <div className="stat-desc text-base-content/70">
              Tổng số quản trị viên
            </div>
          </div>
        </div>
      </div>

      <div className="divider my-6 md:my-8"></div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2">
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body p-4 md:p-6">
            <h2 className="card-title">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              Truyện mới nhất
            </h2>
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Tiêu đề</th>
                    <th>Trạng thái</th>
                    <th className="hidden md:table-cell">Ngày thêm</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={3} className="text-center py-4">
                      <div className="flex flex-col items-center justify-center text-base-content/60">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-10 w-10 mb-2 text-primary"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                          />
                        </svg>
                        Chưa có dữ liệu
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-lg">
          <div className="card-body p-4 md:p-6">
            <h2 className="card-title">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
                />
              </svg>
              Hệ thống
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-base-200 rounded-lg">
                <span className="text-sm">Người dùng:</span>
                <span className="badge badge-ghost truncate max-w-[150px] md:max-w-none">
                  {session.user.name}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-base-200 rounded-lg">
                <span className="text-sm">Vai trò:</span>
                <span className="badge badge-primary">{session.user.role}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-base-200 rounded-lg">
                <span className="text-sm">Email:</span>
                <span className="badge badge-ghost truncate max-w-[150px] md:max-w-none">
                  {session.user.email}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-base-200 rounded-lg">
                <span className="text-sm">Phiên bản:</span>
                <span className="badge badge-outline">1.0.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
