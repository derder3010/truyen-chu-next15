"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth/client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "~image";

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

  // Use the ID as suffix for edit page
  return `${baseSlug}-${id}`;
}

type PurchaseLink = {
  store: string;
  url: string;
};

type LicensedStory = {
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

export default function EditLicensedStoryPage() {
  const router = useRouter();
  const params = useParams();
  const storySlug = params.id as string;

  const { session, loading, isAuthenticated } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [originalSlug, setOriginalSlug] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    author: "",
    description: "",
    coverImage: "",
    genres: "",
    status: "ongoing" as "ongoing" | "completed",
    purchaseLinks: [{ store: "", url: "" }],
  });

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

  // Fetch story data
  useEffect(() => {
    if (!loading && session && storySlug) {
      fetchStory();
    }
  }, [loading, session, storySlug]);

  const fetchStory = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/licensed-stories/${storySlug}`);

      if (!response.ok) {
        throw new Error("Failed to fetch story");
      }

      const data = await response.json();
      const story = data.story;

      setFormData({
        title: story.title,
        slug: story.slug,
        author: story.author,
        description: story.description || "",
        coverImage: story.coverImage || "",
        genres: story.genres || "",
        status: story.status,
        purchaseLinks:
          story.purchaseLinks.length > 0
            ? story.purchaseLinks
            : [{ store: "", url: "" }],
      });
      setOriginalSlug(story.slug || "");

      setError(null);
    } catch (error) {
      console.error("Error fetching story:", error);
      setError("Failed to load story data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Update slug when title changes (only if user hasn't manually edited it)
  useEffect(() => {
    if (formData.title && formData.slug === originalSlug) {
      const newSlug = generateSlug(formData.title, String(storySlug));
      setFormData((prev) => ({
        ...prev,
        slug: newSlug,
      }));
    }
  }, [formData.title, storySlug, originalSlug, formData.slug]);

  const handlePurchaseLinkChange = (
    index: number,
    field: "store" | "url",
    value: string
  ) => {
    setFormData((prev) => {
      const newPurchaseLinks = [...prev.purchaseLinks];
      newPurchaseLinks[index] = { ...newPurchaseLinks[index], [field]: value };
      return { ...prev, purchaseLinks: newPurchaseLinks };
    });
  };

  const addPurchaseLink = () => {
    setFormData((prev) => ({
      ...prev,
      purchaseLinks: [...prev.purchaseLinks, { store: "", url: "" }],
    }));
  };

  const removePurchaseLink = (index: number) => {
    setFormData((prev) => {
      const newPurchaseLinks = [...prev.purchaseLinks];
      newPurchaseLinks.splice(index, 1);
      return { ...prev, purchaseLinks: newPurchaseLinks };
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch(`/api/licensed-stories/${storySlug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update story");
      }

      // Show success message
      setFormSuccess(true);

      // Redirect to stories list after successful update
      setTimeout(() => {
        router.push("/admin/licensed-stories");
      }, 2000);
    } catch (error) {
      console.error("Error updating licensed story:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update story"
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
        <h1 className="text-2xl font-bold">Chỉnh sửa truyện bản quyền</h1>
        <div className="breadcrumbs text-sm">
          <ul>
            <li>
              <Link href="/admin">Admin</Link>
            </li>
            <li>
              <Link href="/admin/licensed-stories">Truyện bản quyền</Link>
            </li>
            <li>Chỉnh sửa</li>
          </ul>
        </div>
      </div>

      <div className="card bg-base-100 shadow-lg">
        <div className="card-body p-4 md:p-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="loading loading-spinner loading-lg text-primary"></div>
            </div>
          ) : formSuccess ? (
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
              <span>Cập nhật thành công! Đang chuyển hướng...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
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

              <div className="grid grid-cols-1 gap-4 md:gap-6">
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Tiêu đề</span>
                    <span className="label-text-alt text-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                    className="input input-bordered w-full mt-2"
                    required
                  />
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Slug</span>
                    <span className="label-text-alt text-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    className="input input-bordered w-full mt-2 bg-base-200 cursor-not-allowed"
                    readOnly
                  />
                  <label className="label">
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
                    name="author"
                    value={formData.author}
                    onChange={handleFormChange}
                    className="input input-bordered w-full mt-2"
                    required
                  />
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Trạng thái</span>
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                    className="select select-bordered w-full mt-2"
                    required
                  >
                    <option value="ongoing">Đang tiến hành</option>
                    <option value="completed">Hoàn thành</option>
                  </select>
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Mô tả</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    className="textarea textarea-bordered h-32 w-full mt-2"
                  ></textarea>
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">URL ảnh bìa</span>
                  </label>
                  {formData.coverImage && (
                    <div className="mb-2">
                      <p className="text-sm mb-2">Ảnh hiện tại:</p>
                      <div className="avatar">
                        <div className="w-24 rounded">
                          <Image
                            src={formData.coverImage}
                            alt="Cover image"
                            width={96}
                            height={96}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  <input
                    type="text"
                    name="coverImage"
                    value={formData.coverImage}
                    onChange={handleFormChange}
                    className="input input-bordered w-full mt-2"
                  />
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">
                      Thể loại (ngăn cách bằng dấu phẩy)
                    </span>
                  </label>
                  <input
                    type="text"
                    name="genres"
                    value={formData.genres}
                    onChange={handleFormChange}
                    className="input input-bordered w-full mt-2"
                  />
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Liên kết mua hàng</span>
                  </label>

                  {formData.purchaseLinks.map((link, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        value={link.store}
                        onChange={(e) =>
                          handlePurchaseLinkChange(
                            index,
                            "store",
                            e.target.value
                          )
                        }
                        className="input input-bordered mt-2 flex-1"
                        placeholder="Tên cửa hàng (Amazon, Shopee,...)"
                      />
                      <input
                        type="text"
                        value={link.url}
                        onChange={(e) =>
                          handlePurchaseLinkChange(index, "url", e.target.value)
                        }
                        className="input input-bordered mt-2 flex-1"
                        placeholder="URL liên kết mua hàng"
                      />
                      <button
                        type="button"
                        className="btn btn-square btn-sm btn-error mt-2"
                        onClick={() => removePurchaseLink(index)}
                        disabled={formData.purchaseLinks.length <= 1}
                      >
                        X
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="btn btn-outline btn-sm mt-2"
                    onClick={addPurchaseLink}
                  >
                    + Thêm liên kết
                  </button>
                </div>
              </div>

              <div className="divider"></div>

              <div className="flex flex-col-reverse sm:flex-row justify-between sm:justify-end gap-2 mt-6">
                <Link href="/admin/licensed-stories" className="btn btn-ghost">
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
