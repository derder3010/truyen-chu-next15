"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRequireAdmin } from "@/lib/auth/client";
import { useEffect, useState } from "react";
import { UserRole } from "@/types/auth";
import { adminGetUsers, adminDeleteUser } from "@/lib/actions";

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
  const [error, setError] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
        setIsLoading(true);
        setError(null);
        const users = await adminGetUsers();

        if ("error" in users) {
          throw new Error(users.error);
        }

        setAllUsers(users);
      } catch (error) {
        console.error("Error fetching users:", error);
        setError(
          error instanceof Error ? error.message : "Failed to fetch users"
        );
      } finally {
        setIsLoading(false);
      }
    }

    if (!loading && isAdmin) {
      fetchUsers();
    }
  }, [loading, isAdmin]);

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      setIsDeleting(true);
      const result = await adminDeleteUser(userToDelete.id);

      if ("error" in result) {
        throw new Error(result.error);
      }

      // Remove the deleted user from the state
      setAllUsers(allUsers.filter((user) => user.id !== userToDelete.id));
      setUserToDelete(null);
    } catch (error) {
      console.error("Error deleting user:", error);
      setError(
        error instanceof Error ? error.message : "Failed to delete user"
      );
    } finally {
      setIsDeleting(false);
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý người dùng</h1>
        <Link href="/admin/users/add" className="btn btn-primary btn-sm">
          Thêm người dùng
        </Link>
      </div>

      <div className="card bg-base-100 shadow">
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
                          <button
                            className="btn btn-xs btn-error btn-outline"
                            onClick={() => handleDeleteClick(user)}
                            disabled={user.id === session?.user.id}
                          >
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

      {/* Delete confirmation modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-60 flex items-center justify-center p-4">
          <div className="bg-base-100 p-6 rounded-box shadow-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Xác nhận xóa</h3>
            <p>
              Bạn có chắc chắn muốn xóa người dùng &ldquo;{userToDelete.name}
              &rdquo;? Hành động này không thể hoàn tác.
            </p>
            <div className="modal-action mt-6">
              <button
                className="btn btn-ghost"
                onClick={() => setUserToDelete(null)}
                disabled={isDeleting}
              >
                Hủy
              </button>
              <button
                className="btn btn-error"
                onClick={confirmDelete}
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
    </>
  );
}
