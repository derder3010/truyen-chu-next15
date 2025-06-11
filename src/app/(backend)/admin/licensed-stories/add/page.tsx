"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
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
function generateSlug(title: string) {
  // Convert to non-accented lowercase and replace spaces with hyphens
  const baseSlug = removeVietnameseAccents(title)
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

  // Generate a random 6-character string
  const randomString = Math.random().toString(36).substring(2, 8);

  return `${baseSlug}-${randomString}`;
}

export default function AddLicensedStoryPage() {
  const router = useRouter();
  const { session, loading, isAuthenticated } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

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

  // Image handling state - ensure these are never undefined
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [imageInputType, setImageInputType] = useState<"file" | "url">("file");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
  const handleImageTypeChange = (type: "file" | "url") => {
    // Reset relevant values when switching
    if (type === "file") {
      setCoverImageUrl("");
      // Only reset preview if there's no file selected
      if (!coverImage) {
        setPreviewUrl(null);
      }
    } else {
      // When switching to URL
      setCoverImage(null);
      // Clear preview unless we already have a URL
      setPreviewUrl(coverImageUrl || null);
    }
    setImageInputType(type);
  };

  // Generate slug when title changes
  useEffect(() => {
    if (formData.title) {
      setFormData((prev) => ({
        ...prev,
        slug: generateSlug(formData.title),
      }));
    }
  }, [formData.title]);

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
    // Only update preview from URL when in URL mode and when URL changes
    if (imageInputType === "url") {
      setPreviewUrl(coverImageUrl || null);
    }
  }, [coverImageUrl, imageInputType]);

  // Clean up preview URLs when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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
      }

      // Import and use server action
      const { createLicensedStory } = await import("@/lib/actions");
      const result = await createLicensedStory(formDataObj);

      if (!result.success) {
        throw new Error(result.error || "Failed to create story");
      }

      // Show success message
      setFormSuccess(true);

      // Redirect to stories list after successful creation
      setTimeout(() => {
        router.push("/admin/licensed-stories");
      }, 2000);
    } catch (error) {
      console.error("Error creating licensed story:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create story"
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
        <h1 className="text-2xl font-bold">Thêm truyện bản quyền</h1>
        <div className="breadcrumbs text-sm">
          <ul>
            <li>
              <Link href="/admin">Admin</Link>
            </li>
            <li>
              <Link href="/admin/licensed-stories">Truyện bản quyền</Link>
            </li>
            <li>Thêm mới</li>
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
              <span>Thêm truyện thành công! Đang chuyển hướng...</span>
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

                    {/* Image Preview */}
                    {previewUrl && (
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
                  <label className="label">
                    <span className="label-text-alt">
                      Ví dụ: ngôn tình, trinh thám, kiếm hiệp
                    </span>
                  </label>
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
                    "Thêm truyện"
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
