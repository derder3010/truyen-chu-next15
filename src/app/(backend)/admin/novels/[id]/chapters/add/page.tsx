"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "@/lib/auth/client";

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

export default function AddChapterPage() {
  const params = useParams();
  const novelId = params.id as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [chapterNumber, setChapterNumber] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);
  const [novelTitle, setNovelTitle] = useState("");

  const router = useRouter();
  const { session, loading, isAuthenticated } = useSession();

  // Generate slug when title or chapter number changes
  useEffect(() => {
    if (title && chapterNumber) {
      setSlug(generateSlug(title, novelId, chapterNumber));
    }
  }, [title, chapterNumber, novelId]);

  // Fetch novel data to display title
  useEffect(() => {
    if (isAuthenticated && session?.user.role === "admin") {
      fetchNovel();
    }
  }, [isAuthenticated, session, novelId]);

  const fetchNovel = async () => {
    try {
      const response = await fetch(`/api/admin/novels/${novelId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch novel");
      }

      const data = await response.json();
      setNovelTitle(data.novel.title || "");

      // Fetch existing chapters to determine next chapter number
      const chaptersResponse = await fetch(
        `/api/admin/novels/${novelId}/chapters`
      );

      if (!chaptersResponse.ok) {
        throw new Error("Failed to fetch chapters");
      }

      const chaptersData = await chaptersResponse.json();
      const chapters = chaptersData.chapters || [];

      // Calculate next chapter number
      let nextChapterNumber = 1;
      if (chapters.length > 0) {
        // Find the highest chapter number
        const highestChapter = chapters.reduce(
          (highest: number, current: { chapterNumber: number }) =>
            current.chapterNumber > highest ? current.chapterNumber : highest,
          0
        );
        nextChapterNumber = highestChapter + 1;
      }

      setChapterNumber(nextChapterNumber.toString());

      // Auto-generate chapter title if empty
      const newTitle = `Chương ${nextChapterNumber}`;
      setTitle(newTitle);

      // Generate initial slug
      setSlug(generateSlug(newTitle, novelId, nextChapterNumber.toString()));
    } catch (error) {
      console.error("Error fetching novel:", error);
      setFormError("Không thể tải dữ liệu truyện. Vui lòng thử lại sau.");
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
      const response = await fetch(`/api/admin/novels/${novelId}/chapters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          chapterNumber: parseInt(chapterNumber),
          slug,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add chapter");
      }

      // Show success message
      setFormSuccess(true);

      // Redirect to novel detail page after a delay
      setTimeout(() => {
        router.push(`/admin/novels/${novelId}/view`);
      }, 2000);
    } catch (error) {
      console.error("Error adding chapter:", error);
      setFormError(
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra khi thêm chương. Vui lòng thử lại."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <h1 className="text-2xl font-bold">Thêm chương mới</h1>
        <div className="breadcrumbs text-sm">
          <ul>
            <li>
              <Link href="/admin">Admin</Link>
            </li>
            <li>
              <Link href="/admin/novels">Truyện</Link>
            </li>
            <li>
              <Link href={`/admin/novels/${novelId}/view`}>
                {novelTitle || "Chi tiết truyện"}
              </Link>
            </li>
            <li>Thêm chương</li>
          </ul>
        </div>
      </div>

      <div className="card bg-base-100 shadow-lg">
        <div className="card-body p-4 md:p-6">
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
              <span>Thêm chương thành công! Đang chuyển hướng...</span>
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
                    className="input input-bordered w-full mt-2"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ví dụ: Chương 1: Khởi đầu"
                  />
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Số chương</span>
                    <span className="label-text-alt text-error">*</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered w-full mt-2"
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
                    className="input input-bordered w-full mt-2 font-mono"
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
                    className="textarea textarea-bordered h-64 w-full mt-2 font-mono"
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Nhập nội dung chương..."
                  ></textarea>
                </div>
              </div>

              <div className="divider"></div>

              <div className="flex flex-col-reverse sm:flex-row justify-center sm:justify-end gap-2 mt-6">
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
                    "Thêm chương"
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
