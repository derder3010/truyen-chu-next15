"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "@/lib/auth/client";
import Image from "~image";
import { adminGetNovelById, adminDeleteNovel } from "@/lib/actions";

// Function to convert Vietnamese characters to non-accented
function removeVietnameseAccents(str: string) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

// Function to generate slug from title
function generateSlug(title: string, id: string) {
  // Convert to non-accented lowercase and replace spaces with hyphens
  const baseSlug = removeVietnameseAccents(title)
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

  // Use the ID as suffix instead of random string for edit
  return `${baseSlug}-${id}`;
}

type Novel = {
  id: number;
  title: string;
  slug: string;
  author: string | null;
  description: string | null;
  status: string | null;
  genre: string | null;
  genres: string | null;
  youtubeEmbed: string | null;
  coverImage: string | null;
  viewCount: number | null;
  createdAt: number | null;
  updatedAt: number | null;
};

export default function EditNovelPage() {
  const params = useParams();
  const novelId = params.id as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [title, setTitle] = useState("");
  const [originalSlug, setOriginalSlug] = useState("");
  const [slug, setSlug] = useState("");
  const [author, setAuthor] = useState("");
  const [status, setStatus] = useState("ongoing");
  const [genre, setGenre] = useState("");
  const [description, setDescription] = useState("");
  const [youtubeEmbed, setYoutubeEmbed] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [currentCoverImage, setCurrentCoverImage] = useState<string | null>(
    null
  );
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);
  const router = useRouter();
  const { session, loading, isAuthenticated } = useSession();

  // Fetch novel data
  const fetchNovel = useCallback(async () => {
    setIsLoading(true);
    try {
      // Use server action instead of API call
      const data = await adminGetNovelById(Number(novelId));

      if ("error" in data) {
        throw new Error(data.error);
      }

      const novel: Novel = data.novel;

      // Set form fields
      setTitle(novel.title || "");
      setSlug(novel.slug || "");
      setOriginalSlug(novel.slug || "");
      setAuthor(novel.author || "");
      setStatus(novel.status || "ongoing");

      // Use genre field first, fall back to genres if genre is not available
      setGenre(novel.genre || novel.genres || "");

      setDescription(novel.description || "");
      setYoutubeEmbed(novel.youtubeEmbed || "");
      setCurrentCoverImage(novel.coverImage);

      // Other fields as needed
    } catch (error) {
      console.error("Error fetching novel:", error);
      setFormError("Không thể tải dữ liệu truyện. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  }, [novelId]);

  // Fetch novel data
  useEffect(() => {
    if (isAuthenticated && session?.user.role === "admin" && novelId) {
      fetchNovel();
    }
  }, [isAuthenticated, session, novelId, fetchNovel]);

  // Update slug when title changes (only if user hasn't manually edited it)
  useEffect(() => {
    if (title && slug === originalSlug) {
      setSlug(generateSlug(title, novelId));
    }
  }, [title, novelId, slug, originalSlug]);

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
      const formData = new FormData();
      formData.append("title", title);
      formData.append("slug", slug);
      formData.append("author", author);
      formData.append("status", status);
      formData.append("genre", genre);
      formData.append("description", description);
      formData.append("youtubeEmbed", youtubeEmbed);
      if (coverImage) {
        formData.append("coverImage", coverImage);
      }

      // Send data to the API
      const response = await fetch(`/api/admin/novels/${novelId}`, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update novel");
      }

      // Show success message
      setFormSuccess(true);

      // Redirect to novels list after a delay
      setTimeout(() => {
        router.push("/admin/novels");
      }, 2000);
    } catch (error) {
      console.error("Error updating novel:", error);
      setFormError(
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra khi cập nhật truyện. Vui lòng thử lại."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCoverImage(e.target.files[0]);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Use server action instead of API call
      const result = await adminDeleteNovel(Number(novelId));

      if (!result.success) {
        throw new Error(result.error || "Failed to delete novel");
      }

      // Show success message and redirect
      setFormSuccess(true);
      setTimeout(() => {
        router.push("/admin/novels");
      }, 2000);
    } catch (error) {
      console.error("Error deleting novel:", error);
      setFormError(
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra khi xóa truyện. Vui lòng thử lại."
      );
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
        <h1 className="text-2xl font-bold">Sửa truyện</h1>
        <div className="breadcrumbs text-sm">
          <ul>
            <li>
              <Link href="/admin">Admin</Link>
            </li>
            <li>
              <Link href="/admin/novels">Truyện</Link>
            </li>
            <li>Sửa truyện</li>
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
              <span>Thao tác thành công! Đang chuyển hướng...</span>
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
                    <span className="label-text">Tên truyện</span>
                    <span className="label-text-alt text-error">*</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full mt-2"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Slug</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full mt-2 bg-base-200 cursor-not-allowed"
                    value={slug}
                    readOnly
                  />
                  <label className="label mt-2">
                    <span className="label-text-alt">
                      Tự động tạo từ tên truyện
                    </span>
                  </label>
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Tác giả</span>
                    <span className="label-text-alt text-error">*</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full mt-2"
                    required
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                  />
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Trạng thái</span>
                  </label>
                  <select
                    className="select select-bordered w-full mt-2"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="ongoing">Đang ra</option>
                    <option value="completed">Hoàn thành</option>
                    <option value="paused">Tạm ngưng</option>
                  </select>
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Thể loại</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full mt-2"
                    placeholder="Nhập thể loại, phân cách bởi dấu phẩy"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                  />
                  <label className="label mt-2">
                    <span className="label-text-alt">
                      Ví dụ: huyền huyễn, tu tiên, xuyên không
                    </span>
                  </label>
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Giới thiệu</span>
                    <span className="label-text-alt text-error">*</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered h-32 w-full mt-2"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  ></textarea>
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Ảnh bìa</span>
                  </label>

                  {currentCoverImage && (
                    <div className="mb-2">
                      <p className="text-sm mb-2">Ảnh hiện tại:</p>
                      <div className="avatar">
                        <div className="w-24 rounded">
                          <Image
                            src={currentCoverImage}
                            alt="Cover image"
                            width={96}
                            height={96}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <input
                    type="file"
                    className="file-input file-input-bordered w-full mt-2"
                    onChange={handleFileChange}
                    accept="image/*"
                  />
                  <label className="label mt-2">
                    <span className="label-text-alt">
                      Để trống nếu không muốn thay đổi ảnh bìa
                    </span>
                  </label>
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">YouTube Embed</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered h-24 w-full mt-2 font-mono text-sm"
                    placeholder='<iframe width="560" height="315" src="https://www.youtube.com/embed/..." frameborder="0" allowfullscreen></iframe>'
                    value={youtubeEmbed}
                    onChange={(e) => setYoutubeEmbed(e.target.value)}
                  ></textarea>
                  <label className="label mt-2">
                    <span className="label-text-alt">
                      Dán mã iframe từ YouTube (tùy chọn)
                    </span>
                  </label>
                </div>
              </div>

              <div className="divider"></div>

              <div className="flex flex-col-reverse sm:flex-row justify-between sm:justify-end gap-2 mt-6">
                <Link href="/admin/novels" className="btn btn-ghost">
                  Hủy
                </Link>

                <button
                  type="button"
                  className="btn btn-error"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Xóa truyện
                </button>

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
                    "Cập nhật"
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Delete confirmation modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-base-100 p-6 rounded-lg shadow-lg max-w-md w-full">
                <h3 className="font-bold text-lg mb-4">Xác nhận xóa</h3>
                <p>
                  Bạn có chắc chắn muốn xóa truyện &ldquo;{title}&rdquo;? Hành
                  động này không thể hoàn tác.
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
        </div>
      </div>
    </>
  );
}
