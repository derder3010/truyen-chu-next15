"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth/client";
import Link from "next/link";
import Image from "~image";

type PurchaseLink = {
  store: string;
  url: string;
};

type Ebook = {
  id: number;
  title: string;
  slug: string;
  author: string;
  description: string | null;
  coverImage: string | null;
  genres: string | null;
  status: "ongoing" | "completed";
  purchaseLinks: PurchaseLink[];
  viewCount: number;
  createdAt: number;
  updatedAt: number;
};

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

// Main content component
function EbooksContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, loading, isAuthenticated } = useSession();

  const [ebooks, setEbooks] = useState<Ebook[]>([]);
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
  const [ebookToDelete, setEbookToDelete] = useState<Ebook | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Function to fetch ebooks
  const fetchEbooks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = searchParams.get("page") || "1";

    try {
      const response = await fetch(
        `/api/ebooks?page=${page}${status ? `&status=${status}` : ""}${
          search ? `&search=${search}` : ""
        }`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch ebooks");
      }

      const data = await response.json();
      setEbooks(data.stories || []);
      setPagination(
        data.pagination || {
          total: data.stories?.length || 0,
          page: parseInt(page, 10),
          limit: 10,
          totalPages: Math.ceil((data.stories?.length || 0) / 10),
        }
      );
      setActiveStatus(status);
    } catch (error) {
      console.error("Error loading ebooks:", error);
      setError("Không thể tải danh sách ebooks. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  }, [searchParams]);

  // Fetch ebooks on page load and when params change
  useEffect(() => {
    if (isAuthenticated && session?.user.role === "admin") {
      fetchEbooks();
    }
  }, [isAuthenticated, session, searchParams, fetchEbooks]);

  // Handle status filter click
  const handleStatusFilter = (status: string | null) => {
    const params = new URLSearchParams(searchParams.toString());

    if (status) {
      params.set("status", status);
    } else {
      params.delete("status");
    }

    params.set("page", "1"); // Reset to first page on filter change
    router.push(`/admin/ebooks?${params.toString()}`);
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
    router.push(`/admin/ebooks?${params.toString()}`);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/admin/ebooks?${params.toString()}`);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!ebookToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/ebooks/${ebookToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete ebook");
      }

      // Refresh the ebooks list
      fetchEbooks();

      // Close modal
      setEbookToDelete(null);
    } catch (error) {
      console.error("Error deleting ebook:", error);
      setError("Không thể xóa ebook. Vui lòng thử lại sau.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Check authentication and admin role
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
        <h1 className="text-2xl font-bold">Quản lý Ebooks</h1>
        <div className="breadcrumbs text-sm">
          <ul>
            <li>
              <a>Admin</a>
            </li>
            <li>Ebooks</li>
          </ul>
        </div>
      </div>

      <div className="card bg-base-100 shadow-lg">
        <div className="card-body p-4 md:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="card-title">Danh sách Ebooks</h2>
            <Link href="/admin/ebooks/add" className="btn btn-primary btn-sm">
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
              Thêm mới
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
                Đang tiến hành
              </button>
              <button
                className={`btn btn-sm ${
                  activeStatus === "completed" ? "btn-primary" : "btn-ghost"
                }`}
                onClick={() => handleStatusFilter("completed")}
              >
                Hoàn thành
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
                ) : ebooks.length === 0 ? (
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
                        Chưa có ebook nào
                      </div>
                    </td>
                  </tr>
                ) : (
                  ebooks.map((ebook) => (
                    <tr key={ebook.id}>
                      <td className="hidden md:table-cell">{ebook.id}</td>
                      <td>
                        <div className="avatar">
                          <div className="mask mask-squircle w-12 h-12">
                            {ebook.coverImage ? (
                              <Image
                                src={ebook.coverImage}
                                alt={ebook.title}
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
                        <div className="font-bold">{ebook.title}</div>
                      </td>
                      <td className="hidden sm:table-cell">
                        {ebook.author || "Không có"}
                      </td>
                      <td className="hidden lg:table-cell">
                        {ebook.viewCount || 0}
                      </td>
                      <td className="hidden md:table-cell">
                        <span
                          className={`badge truncate ${
                            ebook.status === "ongoing"
                              ? "badge-primary"
                              : "badge-success"
                          }`}
                        >
                          {ebook.status === "ongoing"
                            ? "Đang tiến hành"
                            : "Hoàn thành"}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <Link
                            href={`/admin/ebooks/${ebook.id}/edit`}
                            className="btn btn-sm btn-outline btn-info"
                          >
                            Sửa
                          </Link>
                          <button
                            className="btn btn-sm btn-outline btn-error"
                            onClick={() => setEbookToDelete(ebook)}
                          >
                            Xóa
                          </button>
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
              Hiển thị {ebooks.length} / {pagination.total || ebooks.length} kết
              quả
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
      {ebookToDelete && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-60 flex items-center justify-center p-4">
          <div className="bg-base-100 p-6 rounded-box shadow-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Xác nhận xóa</h3>
            <p>
              Bạn có chắc chắn muốn xóa ebook &ldquo;{ebookToDelete.title}
              &rdquo;? Hành động này không thể hoàn tác.
            </p>
            <div className="modal-action mt-6">
              <button
                className="btn btn-ghost"
                onClick={() => setEbookToDelete(null)}
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
export default function EbooksPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <EbooksContent />
    </Suspense>
  );
} 