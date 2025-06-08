"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "@/lib/auth/client";

export const runtime = "edge";

// Function to convert Vietnamese characters to non-accented
function removeVietnameseAccents(str: string) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

// Function to generate slug from title
function generateSlug(title: string, novelId: string, chapterNumber: string) {
  // Convert to non-accented lowercase and replace spaces with hyphens
  const baseSlug = removeVietnameseAccents(title)
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

  // Combine with novel ID and chapter number for uniqueness
  return `chuong-${chapterNumber}-${baseSlug}`;
}

// Chapter type
interface Chapter {
  id: number;
  novelId: number;
  title: string;
  content: string;
  slug: string;
  chapterNumber: number;
  createdAt: number;
  updatedAt: number;
}

export default function EditChapterPage() {
  const params = useParams();
  const novelId = params.id as string;
  const chapterId = params.chapterId as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [slug, setSlug] = useState("");
  const [chapterNumber, setChapterNumber] = useState("1");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);
  const [novelTitle, setNovelTitle] = useState("");
  const [isDeletingChapter, setIsDeletingChapter] = useState(false);

  const router = useRouter();
  const { session, loading, isAuthenticated } = useSession();

  // Generate slug when title or chapter number changes
  useEffect(() => {
    if (title && chapterNumber && !isLoading) {
      setSlug(generateSlug(title, novelId, chapterNumber));
    }
  }, [title, chapterNumber, novelId, isLoading]);

  // Fetch data function wrapped in useCallback
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch novel data
      const novelResponse = await fetch(`/api/admin/novels/${novelId}`);
      if (!novelResponse.ok) {
        throw new Error("Failed to fetch novel");
      }

      const novelData = await novelResponse.json();
      setNovelTitle(novelData.novel.title || "");

      // Fetch chapter data
      const chapterResponse = await fetch(
        `/api/admin/novels/${novelId}/chapters/${chapterId}`
      );

      if (!chapterResponse.ok) {
        throw new Error("Failed to fetch chapter");
      }

      const data = await chapterResponse.json();
      const chapter: Chapter = data.chapter;
      setTitle(chapter.title);
      setContent(chapter.content);
      setChapterNumber(chapter.chapterNumber.toString());

      // If chapter has a slug, use it. Otherwise generate one.
      if (chapter.slug) {
        setSlug(chapter.slug);
      } else {
        setSlug(
          generateSlug(chapter.title, novelId, chapter.chapterNumber.toString())
        );
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setFormError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  }, [novelId, chapterId]);

  // Fetch novel and chapter data
  useEffect(() => {
    if (isAuthenticated && session?.user.role === "admin") {
      fetchData();
    }
  }, [isAuthenticated, session, fetchData]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError("");

    try {
      // Validate
      if (!title || !content || !chapterNumber || !slug) {
        throw new Error("Vui lòng điền đầy đủ thông tin chương");
      }

      // Send to API
      const response = await fetch(
        `/api/admin/novels/${novelId}/chapters/${chapterId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            content,
            chapterNumber: parseInt(chapterNumber),
            slug,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update chapter");
      }

      // Show success message
      setFormSuccess(true);

      // Redirect to novel detail page after a delay
      setTimeout(() => {
        router.push(`/admin/novels/${novelId}/view`);
      }, 2000);
    } catch (error) {
      console.error("Error updating chapter:", error);
      setFormError(
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra khi cập nhật chương. Vui lòng thử lại."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa chương này không?")) {
      return;
    }

    setIsDeletingChapter(true);
    try {
      const response = await fetch(
        `/api/admin/novels/${novelId}/chapters/${chapterId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete chapter");
      }

      // Redirect to novel detail page
      router.push(`/admin/novels/${novelId}/view`);
    } catch (error) {
      console.error("Error deleting chapter:", error);
      alert("Không thể xóa chương. Vui lòng thử lại sau.");
    } finally {
      setIsDeletingChapter(false);
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
        <h1 className="text-2xl font-bold">Chỉnh sửa chương</h1>
        <div className="breadcrumbs text-sm">
          <ul>
            <li>
              <Link href="/admin">Admin</Link>
            </li>
            <li>
              <Link href="/admin/novels">Truyện</Link>
            </li>
            <li>
              <Link href={`/admin/novels/${novelId}/view`}>{novelTitle}</Link>
            </li>
            <li>Chỉnh sửa chương</li>
          </ul>
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            <h2 className="card-title">Chỉnh sửa thông tin chương</h2>
            <button
              className="btn btn-sm btn-outline btn-error"
              onClick={handleDelete}
              disabled={isDeletingChapter}
            >
              {isDeletingChapter ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  Đang xóa...
                </>
              ) : (
                "Xóa chương"
              )}
            </button>
          </div>

          {formSuccess ? (
            <div className="alert alert-success">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Cập nhật chương thành công! Đang chuyển hướng...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {formError && (
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
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:gap-6">
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Tiêu đề chương</span>
                    <span className="label-text-alt text-error">*</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Số chương</span>
                    <span className="label-text-alt text-error">*</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered w-full"
                    required
                    min="1"
                    value={chapterNumber}
                    onChange={(e) => setChapterNumber(e.target.value)}
                  />
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Slug</span>
                    <span className="label-text-alt text-error">*</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full font-mono"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                  <label className="label">
                    <span className="label-text-alt">
                      Định danh chương trong URL. Tự động tạo từ tiêu đề.
                    </span>
                  </label>
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Nội dung</span>
                    <span className="label-text-alt text-error">*</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered h-64 w-full font-mono"
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  ></textarea>
                </div>
              </div>

              <div className="divider"></div>

              <div className="flex justify-end gap-2 mt-6">
                <Link
                  href={`/admin/novels/${novelId}/view`}
                  className="btn btn-ghost"
                >
                  Hủy
                </Link>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      Đang xử lý...
                    </>
                  ) : (
                    "Lưu thay đổi"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
