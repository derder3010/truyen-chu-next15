"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/lib/auth/client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "~image";
import { getEbookBySlug } from "@/lib/api";

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

// type PurchaseLink = {
//   store: string;
//   url: string;
// };

export default function EditEbookPage() {
  const router = useRouter();
  const params = useParams();
  const ebookSlug = params.id as string;

  const { session, loading, isAuthenticated } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [originalSlug, setOriginalSlug] = useState("");

  // Form state
  const [formData, setFormData] = useState<{
    title: string;
    slug: string;
    author: string;
    description: string;
    coverImage: string;
    genres: string;
    status: "ongoing" | "completed";
    purchaseLinks: { store: string; url: string }[];
  }>({
    title: "",
    slug: "",
    author: "",
    description: "",
    coverImage: "",
    genres: "",
    status: "ongoing",
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

  // Handle switching between image input types
  const handleImageTypeChange = (type: "file" | "url" | "current") => {
    // Reset relevant values when switching
    if (type === "file") {
      setCoverImageUrl("");
      // Only reset preview if there's no file selected
      if (!coverImage) {
        setPreviewUrl(null);
      }
    } else if (type === "url") {
      // When switching to URL
      setCoverImage(null);
      // Clear preview unless we already have a URL
      setPreviewUrl(coverImageUrl || null);
    } else {
      // When switching to current
      setCoverImage(null);
      setCoverImageUrl("");
      setPreviewUrl(currentCoverImage);
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

  // Define fetchEbook with useCallback to properly handle dependencies
  const fetchEbook = useCallback(async () => {
    try {
      setIsLoading(true);

      console.log("Fetching ebook with slugOrId:", ebookSlug);

      // Use the server action to get ebook by slug
      const ebook = await getEbookBySlug(ebookSlug);

      console.log("Ebook fetch result:", ebook);

      if (!ebook) {
        throw new Error("Failed to fetch ebook");
      }

      setFormData({
        title: ebook.title,
        slug: ebook.slug,
        author: ebook.author,
        description: ebook.description || "",
        coverImage: ebook.coverImage || "",
        genres: ebook.genres || "",
        status: ebook.status || "completed",
        purchaseLinks:
          ebook.purchaseLinks.length > 0
            ? ebook.purchaseLinks
            : [{ store: "", url: "" }],
      });
      setOriginalSlug(ebook.slug || "");

      // Set current cover image for preview
      if (ebook.coverImage) {
        setCurrentCoverImage(ebook.coverImage);
        setPreviewUrl(ebook.coverImage);
      }

      setError(null);
    } catch (error) {
      console.error("Error fetching ebook:", error);
      setError("Failed to load ebook data");
    } finally {
      setIsLoading(false);
    }
  }, [ebookSlug]);

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

  // Fetch ebook data
  useEffect(() => {
    if (!loading && session && ebookSlug) {
      fetchEbook();
    }
  }, [loading, session, ebookSlug, fetchEbook]);

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
      const newSlug = generateSlug(formData.title, String(ebookSlug));
      setFormData((prev) => ({
        ...prev,
        slug: newSlug,
      }));
    }
  }, [formData.title, ebookSlug, originalSlug, formData.slug]);

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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
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
      if (imageInputType === "current" && currentCoverImage) {
        formDataObj.append("currentCoverImage", currentCoverImage);
      } else if (imageInputType === "file" && coverImage) {
        formDataObj.append("coverImage", coverImage);
      } else if (imageInputType === "url" && coverImageUrl) {
        formDataObj.append("coverImageUrl", coverImageUrl);
      }

      // Import and use server action
      const { updateEbook } = await import("@/lib/actions");
      const result = await updateEbook(ebookSlug, formDataObj);

      if (!result.success) {
        throw new Error(result.error || "Failed to update ebook");
      }

      setFormSuccess(true);

      // Redirect to ebooks list after successful update
      setTimeout(() => {
        router.push("/admin/ebooks");
      }, 2000);
    } catch (error) {
      console.error("Error updating ebook:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update ebook"
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
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Chỉnh sửa Ebook</h1>
        <Link href="/admin/ebooks" className="btn btn-outline">
          Quay lại
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : formSuccess ? (
        <div className="alert alert-success">
          Ebook đã được cập nhật thành công!
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
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
                  onChange={handleFormChange}
                  className="input input-bordered w-full mt-2"
                  required
                />
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
                  <span className="label-text">Thể loại</span>
                </label>
                <input
                  type="text"
                  name="genres"
                  value={formData.genres}
                  onChange={handleFormChange}
                  placeholder="Nhập các thể loại cách nhau bởi dấu phẩy"
                  className="input input-bordered w-full mt-2"
                />
              </div>
            </div>

            <div className="space-y-4">
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
                      display: imageInputType === "current" ? "block" : "none",
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

              {formData.coverImage && (
                <div className="mt-2" style={{ display: "none" }}>
                  {/* Hidden to maintain backward compatibility */}
                </div>
              )}

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Các đường dẫn mua/tải</span>
                </label>

                {formData.purchaseLinks.map((link, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={link.store}
                      onChange={(e) =>
                        handlePurchaseLinkChange(index, "store", e.target.value)
                      }
                      placeholder="Nền tảng"
                      className="input input-bordered flex-1 mt-2"
                    />
                    <input
                      type="url"
                      value={link.url}
                      onChange={(e) =>
                        handlePurchaseLinkChange(index, "url", e.target.value)
                      }
                      placeholder="URL"
                      className="input input-bordered flex-2 mt-2"
                    />
                    {formData.purchaseLinks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePurchaseLink(index)}
                        className="btn btn-error btn-sm mt-2"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addPurchaseLink}
                  className="btn btn-outline btn-info mt-2"
                >
                  Thêm đường dẫn
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <button
              type="submit"
              className={`btn btn-primary ${isSubmitting ? "loading" : ""}`}
              disabled={isSubmitting}
            >
              Lưu thay đổi
            </button>
            <Link href="/admin/ebooks" className="btn btn-outline">
              Hủy
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
