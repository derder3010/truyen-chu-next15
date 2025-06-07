"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "@/lib/auth/client";
import Image from "next/image";

// Novel type definition
interface Novel {
  id: number;
  title: string;
  slug: string;
  author: string | null;
  description: string | null;
  status: string;
  coverImage: string | null;
  viewCount: number;
  createdAt: number;
  updatedAt: number;
}

// Chapter type definition
interface Chapter {
  id: number;
  novelId: number;
  title: string;
  content: string;
  chapterNumber: number;
  createdAt: number;
  updatedAt: number;
}

// Helper function to format Unix timestamp to readable date
const formatDate = (timestamp: number): string => {
  if (!timestamp) return "N/A";

  try {
    // Convert seconds to milliseconds if needed
    const milliseconds = timestamp > 10000000000 ? timestamp : timestamp * 1000;
    return new Date(milliseconds).toLocaleDateString("vi-VN");
  } catch (error) {
    console.error("Date formatting error:", error);
    return "Invalid Date";
  }
};

export default function NovelDetailPage() {
  const params = useParams();
  const novelId = params.id as string;
  const router = useRouter();
  const { session, loading, isAuthenticated } = useSession();

  const [novel, setNovel] = useState<Novel | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  // Fetch novel data
  const fetchNovel = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/novels/${novelId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch novel");
      }

      const data = await response.json();
      setNovel(data.novel);

      // Fetch chapters
      const chaptersResponse = await fetch(
        `/api/admin/novels/${novelId}/chapters`
      );
      if (!chaptersResponse.ok) {
        throw new Error("Failed to fetch chapters");
      }

      const chaptersData = await chaptersResponse.json();
      setChapters(chaptersData.chapters);
    } catch (error) {
      console.error("Error fetching novel:", error);
      setError("Không thể tải dữ liệu truyện. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  }, [novelId]);

  // Fetch novel on page load
  useEffect(() => {
    if (isAuthenticated && session?.user.role === "admin") {
      fetchNovel();
    }
  }, [isAuthenticated, session, fetchNovel]);

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

  // Handle delete novel
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/novels/${novelId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete novel");
      }

      // Redirect to novels list
      router.push("/admin/novels");
    } catch (error) {
      console.error("Error deleting novel:", error);
      setError("Không thể xóa truyện. Vui lòng thử lại sau.");
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading || isLoading) {
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
        <h1 className="text-2xl font-bold">Chi tiết truyện</h1>
        <div className="breadcrumbs text-sm">
          <ul>
            <li>
              <Link href="/admin">Admin</Link>
            </li>
            <li>
              <Link href="/admin/novels">Truyện</Link>
            </li>
            <li>Chi tiết</li>
          </ul>
        </div>
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

      {novel && (
        <>
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/admin/novels/${novel.id}/edit`}
                className="btn btn-info flex-1 lg:flex-none"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 lg:mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                <span className="hidden lg:inline">Sửa truyện</span>
              </Link>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="btn btn-error flex-1 lg:flex-none"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 lg:mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="hidden lg:inline">Xóa truyện</span>
              </button>
              <Link
                href={`/admin/novels/${novel.id}/chapters/add`}
                className="btn btn-success flex-1 lg:flex-none"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 lg:mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="hidden lg:inline">Thêm chương mới</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="md:col-span-1">
              <div className="card bg-base-100 shadow-lg">
                <figure className="px-6 pt-6">
                  {novel.coverImage ? (
                    <div className="mx-auto min-w-[180px] max-w-[200px]">
                      <Image
                        src={novel.coverImage}
                        alt={novel.title}
                        width={200}
                        height={240}
                        className="rounded-xl object-cover w-full aspect-[5/6]"
                      />
                    </div>
                  ) : (
                    <div className="bg-base-300 rounded-xl aspect-[5/6] w-full max-w-[200px] mx-auto min-w-[180px] flex items-center justify-center">
                      <span className="text-base-content/60">
                        Không có ảnh bìa
                      </span>
                    </div>
                  )}
                </figure>
                <div className="card-body">
                  <h2 className="card-title">{novel.title}</h2>
                  <div className="flex flex-col gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-base-content/70">Tác giả:</span>
                      <span className="font-medium">
                        {novel.author || "Không có"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/70">Trạng thái:</span>
                      <span
                        className={`badge ${
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
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/70">Lượt xem:</span>
                      <span className="font-medium">
                        {novel.viewCount || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/70">Số chương:</span>
                      <span className="font-medium">{chapters.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/70">Cập nhật:</span>
                      <span className="font-medium">
                        {new Date(novel.updatedAt * 1000).toLocaleDateString(
                          "vi-VN"
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="card bg-base-100 shadow-lg mb-6">
                <div className="card-body">
                  <h2 className="card-title mb-2">Giới thiệu</h2>
                  <div>
                    <p
                      className={`whitespace-pre-line ${
                        !showFullDescription ? "line-clamp-3" : ""
                      }`}
                    >
                      {novel.description || "Không có giới thiệu."}
                    </p>
                    {novel.description &&
                      novel.description.split("\n").length > 3 && (
                        <button
                          onClick={() =>
                            setShowFullDescription(!showFullDescription)
                          }
                          className="text-primary text-sm mt-1 hover:underline"
                        >
                          {showFullDescription ? "Ẩn bớt" : "Xem thêm"}
                        </button>
                      )}
                  </div>
                </div>
              </div>

              <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="card-title">Danh sách chương</h2>
                    <Link
                      href={`/admin/novels/${novel.id}/chapters/add`}
                      className="btn btn-sm btn-success"
                    >
                      Thêm chương
                    </Link>
                  </div>

                  {chapters.length === 0 ? (
                    <div className="text-center py-8 text-base-content/60">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-12 w-12 mx-auto mb-2 text-primary"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      <p>Chưa có chương nào. Hãy thêm chương mới.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="table table-zebra w-full">
                        <thead>
                          <tr>
                            <th className="w-16">STT</th>
                            <th>Tên chương</th>
                            <th className="w-32">Ngày tạo</th>
                            <th className="w-24">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {chapters.map((chapter) => (
                            <tr key={chapter.id}>
                              <td>{chapter.chapterNumber}</td>
                              <td>{chapter.title}</td>
                              <td>{formatDate(chapter.createdAt)}</td>
                              <td>
                                <div className="flex gap-1">
                                  <Link
                                    href={`/admin/novels/${novel.id}/chapters/${chapter.id}/edit`}
                                    className="btn btn-xs btn-outline btn-info"
                                  >
                                    Sửa
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-base-100 p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="font-bold text-lg mb-4">Xác nhận xóa</h3>
            <p>
              Bạn có chắc chắn muốn xóa truyện &ldquo;{novel?.title}&rdquo;?
              Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="btn btn-ghost"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Hủy
              </button>
              <button
                className="btn btn-error"
                onClick={handleDelete}
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
