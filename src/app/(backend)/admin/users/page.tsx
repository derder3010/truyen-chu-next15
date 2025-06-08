"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRequireAdmin } from "@/lib/auth/client";
import { useEffect, useState } from "react";
import { UserRole } from "@/types/auth";

type User = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
};

export default function UsersPage() {
  const router = useRouter();
  const { session, isAdmin, loading, isAuthenticated } = useRequireAdmin();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (session?.user.role !== "admin") {
        router.push("/admin/error?message=Unauthorized: Admin access required");
      }
    }
  }, [loading, isAuthenticated, session, router]);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch("/api/admin/users");
        if (response.ok) {
          const data = await response.json();
          setAllUsers(data);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (!loading && isAdmin) {
      fetchUsers();
    }
  }, [loading, isAdmin]);

  if (loading || isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý người dùng</h1>
        <Link href="/admin/users/add" className="btn btn-primary btn-sm">
          Thêm người dùng
        </Link>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên</th>
                  <th>Email</th>
                  <th>Vai trò</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4">
                      Chưa có dữ liệu người dùng
                    </td>
                  </tr>
                ) : (
                  allUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <span
                          className={`badge ${
                            user.role === "admin"
                              ? "badge-primary"
                              : "badge-secondary"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/users/${user.id}/edit`}
                            className="btn btn-xs btn-outline"
                          >
                            Sửa
                          </Link>
                          <button className="btn btn-xs btn-error btn-outline">
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
