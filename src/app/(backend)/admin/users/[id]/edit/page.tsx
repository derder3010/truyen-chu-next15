"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { adminGetUserById, adminUpdateUser } from "@/lib/actions";
import { useRequireAdmin } from "@/lib/auth/client";
import { UserRole } from "@/types/auth";

interface UserData {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: number;
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const { isAdmin, loading } = useRequireAdmin();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "editor" as UserRole,
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      if (!userId || isNaN(Number(userId))) {
        setError("ID người dùng không hợp lệ");
        setIsLoading(false);
        return;
      }

      try {
        const result = await adminGetUserById(Number(userId));

        if ("error" in result) {
          throw new Error(result.error);
        }

        const user = result.user as UserData;
        setFormData({
          name: user.name,
          email: user.email,
          password: "",
          role: user.role,
        });
      } catch (error) {
        console.error("Error fetching user:", error);
        setError(
          error instanceof Error ? error.message : "Failed to fetch user"
        );
      } finally {
        setIsLoading(false);
      }
    }

    if (isAdmin && !loading) {
      fetchUser();
    }
  }, [userId, isAdmin, loading]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // Prepare update data
      const updateData: {
        name: string;
        email: string;
        password?: string;
        role: UserRole;
      } = {
        name: formData.name,
        email: formData.email,
        role: formData.role as UserRole,
      };

      // Only include password if provided
      if (formData.password.trim()) {
        updateData.password = formData.password;
      }

      // Use server action
      const result = await adminUpdateUser(Number(userId), updateData);

      if ("error" in result) {
        throw new Error(result.error);
      }

      router.push("/admin/users");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Đã xảy ra lỗi");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/users" className="btn btn-ghost btn-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Quay lại
        </Link>
        <h1 className="text-2xl font-bold">Chỉnh sửa người dùng</h1>
      </div>

      <div className="card bg-base-100 shadow max-w-2xl">
        <div className="card-body">
          {error && (
            <div className="alert alert-error">
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control w-full">
              <label htmlFor="name" className="label">
                <span className="label-text">Tên</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input input-bordered w-full"
                required
              />
            </div>

            <div className="form-control w-full">
              <label htmlFor="email" className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input input-bordered w-full"
                required
              />
            </div>

            <div className="form-control w-full">
              <label htmlFor="password" className="label">
                <span className="label-text">
                  Mật khẩu mới (để trống nếu không đổi)
                </span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input input-bordered w-full"
              />
            </div>

            <div className="form-control w-full">
              <label htmlFor="role" className="label">
                <span className="label-text">Vai trò</span>
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="select select-bordered w-full"
              >
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
              >
                {isSubmitting ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  "Cập nhật người dùng"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
