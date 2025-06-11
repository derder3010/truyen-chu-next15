"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth/client";
import Image from "~image";
import { adminGetAllNovels, adminDeleteNovel } from "@/lib/actions";

// Novel type definition
interface Novel {
  id: number;
  title: string;
  slug: string;
  author: string | null;
  status: string;
  coverImage: string | null;
  viewCount: number;
  createdAt: number;
  updatedAt: number;
}

// Pagination type
interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Loading fallback
function LoadingFallback() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="loading loading-spinner loading-lg text-primary"></div>
    </div>
  );
}

// Main content component that uses useSearchParams
function NovelsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, loading, isAuthenticated } = useSession();

  // State for novels data
  const [novels, setNovels] = useState<Novel[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [novelToDelete, setNovelToDelete] = useState<Novel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Function to fetch novels
  const fetchNovels = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1", 10);

    try {
      // Use server action instead of API call
      const data = await adminGetAllNovels(page, 10, status, search);

      if ("error" in data) {
        throw new Error(data.error as string);
      }

      setNovels(data.novels as Novel[]);
      setPagination(data.pagination);
      setActiveStatus(status);
    } catch (err) {
      console.error("Error fetching novels:", err);
      setError("Không thể tải danh sách truyện. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  }, [searchParams]);

  // Fetch novels on page load and when params change
  useEffect(() => {
    if (isAuthenticated && session?.user.role === "admin") {
      fetchNovels();
    }
  }, [isAuthenticated, session, searchParams, fetchNovels]);

  // Handle status filter click
  const handleStatusFilter = (status: string | null) => {
    const params = new URLSearchParams(searchParams.toString());

    if (status) {
      params.set("status", status);
    } else {
      params.delete("status");
    }

    params.set("page", "1"); // Reset to first page on filter change
    router.push(`/admin/novels?${params.toString()}`);
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams(searchParams.toString());

    if (searchTerm.trim()) {
      params.set("search", searchTerm.trim());
    } else {
      params.delete("search");
    }

    params.set("page", "1"); // Reset to first page on search
    router.push(`/admin/novels?${params.toString()}`);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/admin/novels?${params.toString()}`);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!novelToDelete) return;

    setIsDeleting(true);
    try {
      // Use server action instead of API call
      const result = await adminDeleteNovel(novelToDelete.id);

      if (!result.success) {
        throw new Error(result.error || "Failed to delete novel");
      }

      // Refresh the novels list
      fetchNovels();

      // Close modal
      setNovelToDelete(null);
    } catch (err) {
      console.error("Error deleting novel:", err);
      setError("Không thể xóa truyện. Vui lòng thử lại sau.");
    } finally {
      setIsDeleting(false);
    }
  };

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
        <h1 className="text-2xl font-bold">Quản lý truyện</h1>
        <div className="breadcrumbs text-sm">
          <ul>
            <li>
              <a>Admin</a>
            </li>
            <li>Truyện</li>
          </ul>
        </div>
      </div>

      <div className="card bg-base-100 shadow-lg">
        <div className="card-body p-4 md:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="card-title">Danh sách truyện</h2>
            <Link href="/admin/novels/add" className="btn btn-primary btn-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Thêm truyện mới
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
            <div className="flex flex-wrap gap-2">
              <button
                className={`btn btn-sm ${
                  activeStatus === null ? "btn-primary" : "btn-ghost"
                }`}
                onClick={() => handleStatusFilter(null)}
              >
                Tất cả
              </button>
              <button
                className={`btn btn-sm ${
                  activeStatus === "ongoing" ? "btn-primary" : "btn-ghost"
                }`}
                onClick={() => handleStatusFilter("ongoing")}
              >
                Đang ra
              </button>
              <button
                className={`btn btn-sm ${
                  activeStatus === "completed" ? "btn-primary" : "btn-ghost"
                }`}
                onClick={() => handleStatusFilter("completed")}
              >
                Hoàn thành
              </button>
              <button
                className={`btn btn-sm ${
                  activeStatus === "paused" ? "btn-primary" : "btn-ghost"
                }`}
                onClick={() => handleStatusFilter("paused")}
              >
                Tạm ngưng
              </button>
            </div>

            <form onSubmit={handleSearch} className="join w-full sm:w-auto">
              <input
                className="input input-bordered input-sm join-item w-full"
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                type="submit"
                className="btn btn-sm join-item btn-primary"
              >
                Tìm
              </button>
            </form>
          </div>

          {error && (
            <div className="alert alert-error mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead className="bg-base-200">
                <tr>
                  <th className="hidden md:table-cell">ID</th>
                  <th className="w-16">Ảnh bìa</th>
                  <th>Tiêu đề</th>
                  <th className="hidden sm:table-cell">Tác giả</th>
                  <th className="hidden lg:table-cell">Lượt xem</th>
                  <th className="hidden md:table-cell">Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8">
                      <div className="loading loading-spinner loading-md"></div>
                    </td>
                  </tr>
                ) : novels.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8">
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
                        Chưa có truyện nào
                      </div>
                    </td>
                  </tr>
                ) : (
                  novels.map((novel) => (
                    <tr key={novel.id}>
                      <td className="hidden md:table-cell">{novel.id}</td>
                      <td>
                        <div className="avatar">
                          <div className="mask mask-squircle w-12 h-12">
                            {novel.coverImage ? (
                              <Image
                                src={novel.coverImage}
                                alt={novel.title}
                                width={48}
                                height={48}
                              />
                            ) : (
                              <div className="bg-base-300 w-full h-full flex items-center justify-center text-xs">
                                No img
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="font-bold">{novel.title}</div>
                      </td>
                      <td className="hidden sm:table-cell">
                        {novel.author || "Không có"}
                      </td>
                      <td className="hidden lg:table-cell">
                        {novel.viewCount || 0}
                      </td>
                      <td className="hidden md:table-cell">
                        <span
                          className={`badge truncate ${
                            novel.status === "ongoing"
                              ? "badge-primary"
                              : novel.status === "completed"
                              ? "badge-success"
                              : "badge-warning"
                          }`}
                        >
                          {novel.status === "ongoing"
                            ? "Đang ra"
                            : novel.status === "completed"
                            ? "Hoàn thành"
                            : "Tạm ngưng"}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <Link
                            href={`/admin/novels/${novel.id}/view`}
                            className="btn btn-sm btn-outline btn-success"
                          >
                            Xem
                          </Link>
                          <Link
                            href={`/admin/novels/${novel.id}/edit`}
                            className="btn btn-sm btn-outline btn-info"
                          >
                            Sửa
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-2">
            <div className="text-sm text-base-content/70 order-2 sm:order-1">
              Hiển thị {novels.length} / {pagination.total} kết quả
            </div>

            {pagination.totalPages > 1 && (
              <div className="join order-1 sm:order-2">
                <button
                  className={`join-item btn btn-sm ${
                    pagination.page <= 1 ? "btn-disabled" : ""
                  }`}
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  «
                </button>

                {Array.from({ length: pagination.totalPages }).map((_, i) => (
                  <button
                    key={i}
                    className={`join-item btn btn-sm ${
                      pagination.page === i + 1 ? "btn-primary" : ""
                    }`}
                    onClick={() => handlePageChange(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  className={`join-item btn btn-sm ${
                    pagination.page >= pagination.totalPages
                      ? "btn-disabled"
                      : ""
                  }`}
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  »
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {novelToDelete && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-60 flex items-center justify-center p-4">
          <div className="bg-base-100 p-6 rounded-box shadow-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Xác nhận xóa</h3>
            <p>
              Bạn có chắc chắn muốn xóa truyện &ldquo;{novelToDelete.title}
              &rdquo;? Hành động này không thể hoàn tác.
            </p>
            <div className="modal-action mt-6">
              <button
                className="btn btn-ghost"
                onClick={() => setNovelToDelete(null)}
                disabled={isDeleting}
              >
                Hủy
              </button>
              <button
                className="btn btn-error"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    Đang xóa...
                  </>
                ) : (
                  "Xóa"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Main page component wrapped in Suspense
export default function NovelsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <NovelsContent />
    </Suspense>
  );
}
