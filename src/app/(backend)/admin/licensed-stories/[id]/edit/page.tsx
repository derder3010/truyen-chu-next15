"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/lib/auth/client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "~image";
import { getLicensedStoryBySlug } from "@/lib/api";

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
    genres: "",
    status: "ongoing" as "ongoing" | "completed",
    purchaseLinks: [{ store: "", url: "" }],
  });

  // Image handling state
  const [currentCoverImage, setCurrentCoverImage] = useState<string | null>(
    null
  );
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [imageInputType, setImageInputType] = useState<
    "file" | "url" | "current"
  >("current");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Define fetchStory with useCallback
  const fetchStory = useCallback(async () => {
    try {
      setIsLoading(true);

      console.log("Fetching licensed story with slugOrId:", storySlug);

      // Use the server action to get story by slug or id
      const story = await getLicensedStoryBySlug(storySlug);

      console.log("Licensed story fetch result:", story);

      if (!story) {
        throw new Error("Failed to fetch story");
      }

      setFormData({
        title: story.title,
        slug: story.slug,
        author: story.author,
        description: story.description || "",
        genres: story.genres || "",
        status: story.status || "ongoing",
        purchaseLinks:
          story.purchaseLinks.length > 0
            ? story.purchaseLinks
            : [{ store: "", url: "" }],
      });
      setCurrentCoverImage(story.coverImage || null);
      setOriginalSlug(story.slug || "");

      setError(null);
    } catch (error) {
      console.error("Error fetching story:", error);
      setError("Failed to load story data");
    } finally {
      setIsLoading(false);
    }
  }, [storySlug]);

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
  }, [loading, session, storySlug, fetchStory]);

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

  // Handle switching between image input types
  const handleImageTypeChange = (type: "file" | "url" | "current") => {
    // Reset relevant values when switching
    if (type === "file") {
      setCoverImageUrl("");
    } else if (type === "url") {
      setCoverImage(null);
    }
    setImageInputType(type);
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setCoverImage(file);
      // Create a preview URL for the selected file
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Update preview when URL changes
  useEffect(() => {
    if (imageInputType === "url" && coverImageUrl) {
      setPreviewUrl(coverImageUrl);
    } else if (imageInputType === "file" && !coverImage) {
      setPreviewUrl(null);
    } else if (imageInputType === "current") {
      setPreviewUrl(null);
    }
  }, [coverImageUrl, imageInputType, coverImage]);

  // Clean up preview URLs when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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

      // Create FormData to handle file uploads
      const formDataObj = new FormData();
      formDataObj.append("title", formData.title);
      formDataObj.append("slug", formData.slug);
      formDataObj.append("author", formData.author);
      formDataObj.append("description", formData.description);
      formDataObj.append("genres", formData.genres);
      formDataObj.append("status", formData.status);
      formDataObj.append(
        "purchaseLinks",
        JSON.stringify(formData.purchaseLinks)
      );

      // Handle image based on input type
      if (imageInputType === "file" && coverImage) {
        formDataObj.append("coverImage", coverImage);
      } else if (imageInputType === "url" && coverImageUrl) {
        formDataObj.append("coverImageUrl", coverImageUrl);
      } else if (imageInputType === "current" && currentCoverImage) {
        formDataObj.append("currentCoverImage", currentCoverImage);
      }

      // Import and use server action
      const { updateLicensedStory } = await import("@/lib/actions");
      const result = await updateLicensedStory(storySlug, formDataObj);

      if (!result.success) {
        throw new Error(result.error || "Failed to update story");
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
                    <span className="label-text">Ảnh bìa</span>
                  </label>

                  <div className="flex flex-col gap-2">
                    <div className="tabs tabs-boxed inline-flex w-fit mb-2">
                      <a
                        className={`tab ${
                          imageInputType === "current" ? "tab-active" : ""
                        }`}
                        onClick={() => handleImageTypeChange("current")}
                      >
                        Giữ ảnh hiện tại
                      </a>
                      <a
                        className={`tab ${
                          imageInputType === "file" ? "tab-active" : ""
                        }`}
                        onClick={() => handleImageTypeChange("file")}
                      >
                        Tải lên ảnh
                      </a>
                      <a
                        className={`tab ${
                          imageInputType === "url" ? "tab-active" : ""
                        }`}
                        onClick={() => handleImageTypeChange("url")}
                      >
                        Đường dẫn URL
                      </a>
                    </div>

                    {/* Current image option - always rendered but conditionally displayed */}
                    <div
                      style={{
                        display:
                          imageInputType === "current" ? "block" : "none",
                      }}
                    >
                      {currentCoverImage && (
                        <div className="mt-2">
                          <p className="text-sm mb-2">Ảnh hiện tại:</p>
                          <div className="avatar">
                            <div className="w-40 rounded">
                              <Image
                                src={currentCoverImage}
                                alt="Cover image"
                                width={160}
                                height={160}
                                className="object-contain"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* File input - always rendered but conditionally displayed */}
                    <div
                      style={{
                        display: imageInputType === "file" ? "block" : "none",
                      }}
                    >
                      <input
                        type="file"
                        className="file-input file-input-bordered w-full"
                        onChange={handleFileChange}
                        accept="image/*"
                      />
                    </div>

                    {/* URL input - always rendered but conditionally displayed */}
                    <div
                      style={{
                        display: imageInputType === "url" ? "block" : "none",
                      }}
                    >
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        placeholder="Nhập URL hình ảnh"
                        value={coverImageUrl || ""}
                        onChange={(e) => setCoverImageUrl(e.target.value)}
                      />
                    </div>

                    {/* Image Preview for new file/url */}
                    {previewUrl && imageInputType !== "current" && (
                      <div className="mt-4">
                        <p className="text-sm mb-2">Xem trước:</p>
                        <div className="avatar">
                          <div className="w-40 rounded">
                            <Image
                              src={previewUrl}
                              alt="Cover preview"
                              width={160}
                              height={160}
                              className="object-cover"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
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
