"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/client";
import {
  clientGetAdvertisementById,
  clientUpdateAdvertisement,
} from "@/lib/actions";

interface EditAdvertisementPageProps {
  params: {
    id: string;
  };
}

export default function EditAdvertisementPage({
  params,
}: EditAdvertisementPageProps) {
  const router = useRouter();
  const { session, loading, isAuthenticated } = useSession();
  const [adId, setAdId] = useState<number | null>(null);

  // Set adId from params when component mounts
  useEffect(() => {
    const parseId = async () => {
      const id = parseInt((await params).id, 10);
      setAdId(id);
    };

    parseId();
  }, [params]);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
    affiliateUrl: "",
    displayFrequency: 3,
    isActive: true,
    type: "in-chapter" as
      | "in-chapter"
      | "priority"
      | "banner"
      | "loading"
      | "ebook-waiting"
      | "other",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch advertisement data
  useEffect(() => {
    if (!isAuthenticated || !session || adId === null) return;

    const fetchAdData = async () => {
      try {
        const data = await clientGetAdvertisementById(adId);

        if ("error" in data) {
          throw new Error(data.error as string);
        }

        setFormData({
          title: data.title,
          description: data.description || "",
          imageUrl: data.imageUrl || "",
          affiliateUrl: data.affiliateUrl,
          displayFrequency: data.displayFrequency ?? 3,
          isActive: data.isActive ?? true,
          type: (data.type || "in-chapter") as
            | "in-chapter"
            | "priority"
            | "banner"
            | "loading"
            | "ebook-waiting"
            | "other",
        });
      } catch (err) {
        console.error("Error fetching advertisement:", err);
        setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdData();
  }, [adId, isAuthenticated, session]);

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    // Handle checkbox separately
    if (type === "checkbox") {
      const target = e.target as HTMLInputElement;
      setFormData({
        ...formData,
        [name]: target.checked,
      });
    } else if (name === "displayFrequency") {
      // Convert display frequency to number
      setFormData({
        ...formData,
        [name]: parseInt(value, 10) || 1,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adId === null) {
      setError("ID quảng cáo không hợp lệ");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error("Tiêu đề quảng cáo là bắt buộc");
      }

      if (!formData.affiliateUrl.trim()) {
        throw new Error("Liên kết affiliate là bắt buộc");
      }

      // Validate URL format
      if (!isValidUrl(formData.affiliateUrl)) {
        throw new Error("Liên kết affiliate không hợp lệ");
      }

      if (formData.imageUrl && !isValidUrl(formData.imageUrl)) {
        throw new Error("Liên kết hình ảnh không hợp lệ");
      }

      // Submit the form using server action
      const response = await clientUpdateAdvertisement(adId, {
        ...formData,
        type: formData.type,
      });

      if ("error" in response) {
        throw new Error(response.error as string);
      }

      // Redirect to ads list page
      router.push("/admin/ads");
    } catch (err) {
      console.error("Error updating advertisement:", err);
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setIsSubmitting(false);
    }
  };

  // URL validation helper
  const isValidUrl = (urlString: string): boolean => {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  };

  // Check authentication and admin role
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (session?.user.role !== "admin") {
        router.push("/admin/error?message=Unauthorized: Admin access required");
      }
    }
  }, [loading, isAuthenticated, session, router]);

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
        <h1 className="text-2xl font-bold">Chỉnh sửa quảng cáo</h1>
        <div className="breadcrumbs text-sm">
          <ul>
            <li>
              <Link href="/admin">Admin</Link>
            </li>
            <li>
              <Link href="/admin/ads">Quảng cáo</Link>
            </li>
            <li>Chỉnh sửa</li>
          </ul>
        </div>
      </div>

      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
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

          <form onSubmit={handleSubmit}>
            <div className="form-control w-full mb-4">
              <label className="label">
                <span className="label-text font-semibold">
                  Tiêu đề quảng cáo *
                </span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Nhập tiêu đề quảng cáo"
                className="input input-bordered w-full"
                required
              />
            </div>

            <div className="form-control w-full mb-4">
              <label className="label">
                <span className="label-text font-semibold">
                  Liên kết hình ảnh
                </span>
              </label>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                className="input input-bordered w-full"
              />
              <label className="label">
                <span className="label-text-alt">
                  Nhập URL của hình ảnh (tỷ lệ tốt nhất là 1:1)
                </span>
              </label>
            </div>

            <div className="form-control w-full mb-4">
              <label className="block mb-2">
                <span className="label-text font-semibold">Mô tả</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Mô tả ngắn về quảng cáo"
                className="textarea textarea-bordered h-24 w-full"
              />
            </div>

            <div className="form-control w-full mb-4">
              <label className="label">
                <span className="label-text font-semibold">
                  Liên kết affiliate *
                </span>
              </label>
              <input
                type="url"
                name="affiliateUrl"
                value={formData.affiliateUrl}
                onChange={handleChange}
                placeholder="https://example.com?ref=yourcode"
                className="input input-bordered w-full"
                required
              />
              <label className="label">
                <span className="label-text-alt">
                  Nhập URL đầy đủ của liên kết affiliate (bao gồm cả tham số ref
                  nếu có)
                </span>
              </label>
            </div>

            <div className="form-control w-full mb-4">
              <label className="label">
                <span className="label-text font-semibold">
                  Tần suất hiển thị
                </span>
              </label>
              <select
                name="displayFrequency"
                value={formData.displayFrequency}
                onChange={handleChange}
                className="select select-bordered w-full"
              >
                <option value={1}>Mỗi chương</option>
                <option value={2}>Mỗi 2 chương</option>
                <option value={3}>Mỗi 3 chương</option>
                <option value={5}>Mỗi 5 chương</option>
                <option value={10}>Mỗi 10 chương</option>
              </select>
              <label className="label">
                <span className="label-text-alt">
                  Quảng cáo sẽ hiển thị sau mỗi bao nhiêu chương
                </span>
              </label>
            </div>

            <div className="form-control w-full mb-4">
              <label className="label">
                <span className="label-text font-semibold">Loại quảng cáo</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="select select-bordered w-full"
              >
                <option value="in-chapter">Trong chương (In-Chapter)</option>
                <option value="priority">Ưu tiên (Priority)</option>
                <option value="banner">Banner</option>
                <option value="loading">Màn hình chờ (Loading)</option>
                <option value="ebook-waiting">Chờ ebook (Ebook Waiting)</option>
                <option value="other">Khác (Other)</option>
              </select>
              <label className="label">
                <span className="label-text-alt">
                  Chọn vị trí hiển thị quảng cáo
                </span>
              </label>
            </div>

            <div className="form-control w-full mb-6">
              <div className="flex items-center gap-2 mb-1">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="checkbox checkbox-primary"
                />
                <span className="font-semibold">Kích hoạt quảng cáo</span>
              </div>
              <div className="ml-7 text-sm text-base-content/70">
                Quảng cáo sẽ được hiển thị nếu được chọn
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Link href="/admin/ads" className="btn btn-ghost">
                Hủy
              </Link>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  "Lưu thay đổi"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
