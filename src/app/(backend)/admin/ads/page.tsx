"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth/client";
import Image from "~image";
import {
  clientGetAdvertisements,
  clientUpdateAdvertisement,
  clientDeleteAdvertisement,
} from "@/lib/actions";

// Advertisement type definition
interface Advertisement {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  affiliateUrl: string;
  impressionCount: number | null;
  clickCount: number | null;
  isActive: boolean | null;
  displayFrequency: number | null;
  createdAt: number | null;
  updatedAt: number | null;
  type?:
    | "in-chapter"
    | "priority"
    | "banner"
    | "loading"
    | "ebook-waiting"
    | "other"
    | null;
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
function AdsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, loading, isAuthenticated } = useSession();

  // State for ads data
  const [ads, setAds] = useState<Advertisement[]>([]);
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
  const [adToDelete, setAdToDelete] = useState<Advertisement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Function to fetch advertisements
  const fetchAds = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1", 10);

    try {
      const data = await clientGetAdvertisements(page, 10, status, search);

      if ("error" in data) {
        throw new Error(data.error as string);
      }

      // Initialize with default empty values
      const defaultPagination = {
        total: 0,
        page: page,
        limit: 10,
        totalPages: 0,
      };

      // Handle various response formats including empty object
      if (data && data.advertisements && Array.isArray(data.advertisements)) {
        // Normal response with advertisements array
        setAds(data.advertisements);
        setPagination(data.pagination || defaultPagination);
      } else {
        // Empty response or unexpected format
        console.log("API response format:", data);
        setAds([]);
        setPagination(defaultPagination);
      }

      setActiveStatus(status);
    } catch (err) {
      console.error("Error fetching advertisements:", err);
      setError("Không thể tải danh sách quảng cáo. Vui lòng thử lại sau.");
      // Set empty state on error
      setAds([]);
      setPagination({
        total: 0,
        page: page,
        limit: 10,
        totalPages: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchParams]);

  // Fetch ads on page load and when params change
  useEffect(() => {
    if (isAuthenticated && session?.user.role === "admin") {
      fetchAds();
    }
  }, [isAuthenticated, session, searchParams, fetchAds]);

  // Handle status filter click
  const handleStatusFilter = (status: string | null) => {
    const params = new URLSearchParams(searchParams.toString());

    if (status) {
      params.set("status", status);
    } else {
      params.delete("status");
    }

    params.set("page", "1"); // Reset to first page on filter change
    router.push(`/admin/ads?${params.toString()}`);
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
    router.push(`/admin/ads?${params.toString()}`);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/admin/ads?${params.toString()}`);
  };

  // Toggle ad status
  const toggleAdStatus = async (id: number, currentStatus: boolean) => {
    try {
      const response = await clientUpdateAdvertisement(id, {
        isActive: !currentStatus,
      });

      if ("error" in response) {
        throw new Error(response.error as string);
      }

      // Refresh the ads list
      fetchAds();
    } catch (err) {
      console.error("Error updating advertisement status:", err);
      setError(
        "Không thể cập nhật trạng thái quảng cáo. Vui lòng thử lại sau."
      );
    }
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!adToDelete) return;

    setIsDeleting(true);
    try {
      const response = await clientDeleteAdvertisement(adToDelete.id);

      if ("error" in response) {
        throw new Error(response.error as string);
      }

      // Refresh the ads list
      fetchAds();

      // Close modal
      setAdToDelete(null);
    } catch (err) {
      console.error("Error deleting advertisement:", err);
      setError("Không thể xóa quảng cáo. Vui lòng thử lại sau.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate CTR (Click-Through Rate)
  const calculateCTR = (impressions: number, clicks: number) => {
    if (impressions === 0) return "0%";
    return ((clicks / impressions) * 100).toFixed(2) + "%";
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
        <h1 className="text-2xl font-bold">Quản lý quảng cáo</h1>
        <div className="breadcrumbs text-sm">
          <ul>
            <li>
              <a>Admin</a>
            </li>
            <li>Quảng cáo</li>
          </ul>
        </div>
      </div>

      <div className="card bg-base-100 shadow-lg">
        <div className="card-body p-4 md:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="card-title">Danh sách quảng cáo</h2>
            <Link href="/admin/ads/add" className="btn btn-primary btn-sm">
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
              Thêm quảng cáo mới
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
                  activeStatus === "active" ? "btn-primary" : "btn-ghost"
                }`}
                onClick={() => handleStatusFilter("active")}
              >
                Đang hiển thị
              </button>
              <button
                className={`btn btn-sm ${
                  activeStatus === "inactive" ? "btn-primary" : "btn-ghost"
                }`}
                onClick={() => handleStatusFilter("inactive")}
              >
                Đã ẩn
              </button>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="Tìm kiếm quảng cáo..."
                className="input input-bordered input-sm w-full max-w-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit" className="btn btn-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
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

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="loading loading-spinner loading-lg text-primary"></div>
            </div>
          ) : ads.length === 0 ? (
            <div className="text-center py-12">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mx-auto mb-4 text-base-content/30"
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
              <h3 className="text-lg font-semibold">Chưa có quảng cáo nào</h3>
              <p className="text-base-content/60 mt-1">
                Hãy thêm quảng cáo mới để bắt đầu.
              </p>
              <div className="mt-4">
                <Link href="/admin/ads/add" className="btn btn-primary btn-sm">
                  Thêm quảng cáo
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table table-zebra ">
                  <thead>
                    <tr>
                      <th>Quảng cáo</th>
                      <th>Loại</th>
                      <th>Lượt hiển thị</th>
                      <th>Lượt click</th>
                      <th>CTR</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ads.map((ad) => (
                      <tr key={ad.id}>
                        <td className="min-w-[200px]">
                          <div className="flex items-center space-x-3">
                            <div className="avatar">
                              <div className="mask mask-squircle w-12 h-12">
                                {ad.imageUrl ? (
                                  <Image
                                    src={ad.imageUrl}
                                    alt={ad.title}
                                    width={48}
                                    height={48}
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="bg-base-300 w-full h-full flex items-center justify-center">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-6 w-6 text-base-content/30"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                      />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="font-bold">{ad.title}</div>
                              <div className="text-sm opacity-50 truncate max-w-[200px]">
                                {ad.description || "Không có mô tả"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-outline truncate">
                            {ad.type === "in-chapter" && "Trong chương"}
                            {ad.type === "priority" && "Ưu tiên"}
                            {ad.type === "banner" && "Banner"}
                            {ad.type === "loading" && "Màn hình chờ"}
                            {ad.type === "ebook-waiting" && "Chờ ebook"}
                            {ad.type === "other" && "Khác"}
                            {!ad.type && "Trong chương"}
                          </span>
                        </td>
                        <td>
                          {(ad.impressionCount || 0).toLocaleString("vi-VN")}
                        </td>
                        <td>{(ad.clickCount || 0).toLocaleString("vi-VN")}</td>
                        <td>
                          {calculateCTR(
                            ad.impressionCount || 0,
                            ad.clickCount || 0
                          )}
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <span
                              className={`badge ${
                                ad.isActive
                                  ? "badge-success truncate"
                                  : "badge-ghost truncate"
                              }`}
                            >
                              {ad.isActive ? "Đang hiển thị" : "Đã ẩn"}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-1">
                            <button
                              className="btn btn-ghost btn-xs"
                              onClick={() =>
                                toggleAdStatus(ad.id, ad.isActive || false)
                              }
                            >
                              {ad.isActive ? "Ẩn" : "Hiển thị"}
                            </button>
                            <Link
                              href={`/admin/ads/edit/${ad.id}`}
                              className="btn btn-ghost btn-xs"
                            >
                              Sửa
                            </Link>
                            <button
                              className="btn btn-ghost btn-xs text-error"
                              onClick={() => setAdToDelete(ad)}
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <div className="join">
                    <button
                      className="join-item btn btn-sm"
                      onClick={() => handlePageChange(1)}
                      disabled={pagination.page === 1}
                    >
                      «
                    </button>
                    <button
                      className="join-item btn btn-sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      ‹
                    </button>
                    {Array.from({ length: pagination.totalPages }, (_, i) => (
                      <button
                        key={i + 1}
                        className={`join-item btn btn-sm ${
                          pagination.page === i + 1 ? "btn-active" : ""
                        }`}
                        onClick={() => handlePageChange(i + 1)}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      className="join-item btn btn-sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      ›
                    </button>
                    <button
                      className="join-item btn btn-sm"
                      onClick={() => handlePageChange(pagination.totalPages)}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      »
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {adToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-base-100 p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="font-bold text-lg mb-4">Xác nhận xóa</h3>
            <p>
              Bạn có chắc chắn muốn xóa quảng cáo &ldquo;{adToDelete.title}
              &rdquo;? Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="btn btn-ghost"
                onClick={() => setAdToDelete(null)}
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

// Main component with Suspense
export default function AdsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AdsContent />
    </Suspense>
  );
}
