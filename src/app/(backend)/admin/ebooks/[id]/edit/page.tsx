"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/lib/auth/client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "~image";
import { getEbookBySlug, updateEbook } from "@/lib/api";

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
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    author: "",
    description: "",
    coverImage: "",
    genres: "",
    status: "completed" as "ongoing" | "completed",
    purchaseLinks: [{ store: "", url: "" }],
  });

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);

      // Use the server action to update the ebook
      await updateEbook(ebookSlug, formData);

      // Show success message
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
                  <span className="label-text">URL Ảnh bìa</span>
                </label>
                <input
                  type="url"
                  name="coverImage"
                  value={formData.coverImage}
                  onChange={handleFormChange}
                  placeholder="https://example.com/image.jpg"
                  className="input input-bordered w-full mt-2"
                />
              </div>

              {formData.coverImage && (
                <div className="mt-2">
                  <p className="text-sm mb-2">Xem trước ảnh bìa:</p>
                  <Image
                    src={formData.coverImage}
                    alt="Cover Preview"
                    width={150}
                    height={225}
                    className="object-cover rounded-md"
                  />
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
