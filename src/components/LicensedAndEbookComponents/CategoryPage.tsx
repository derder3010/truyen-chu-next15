"use client";

import React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import TagIcon from "@/components/icons/TagIcon";
import Pagination from "../Pagination";
import BookCard from "./BookCard";
import { clientGetEbooks, clientGetLicensedStories } from "@/lib/actions";

// Fetcher function for SWR using server actions
const booksFetcher = async ([type, page, tag]: [
  string,
  number,
  string | null
]) => {
  if (type === "ebook") {
    const data = await clientGetEbooks(page, 10, null, null, tag);
    return {
      stories: data.stories as unknown as BookItem[],
      pagination: data.pagination,
    };
  } else {
    const data = await clientGetLicensedStories(page, 10, null, null, tag);
    return {
      stories: data.stories as unknown as BookItem[],
      pagination: data.pagination,
    };
  }
};

export interface BookItem {
  id: string | number;
  title: string;
  author: string;
  coverImage?: string | null;
  genres: string[] | string | null;
  description: string | null;
  status: string | "ongoing" | "completed" | null;
  slug: string;
  purchaseLinks: any; // Match DB schema
  viewCount?: number | null;
  createdAt?: number | null;
  updatedAt?: number | null;
}

interface CategoryPageProps {
  initialBooks: BookItem[];
  genres: string[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  title: string;
  description: string;
  type: "ebook" | "licensed"; // Loại trang (ebook hoặc truyện bản quyền)
}

const CategoryPage: React.FC<CategoryPageProps> = ({
  initialBooks,
  genres,
  pagination: initialPagination,
  title,
  description,
  type,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedGenre = searchParams.get("tag");
  const currentPage = searchParams.get("page")
    ? parseInt(searchParams.get("page") || "1", 10)
    : 1;

  // Base path dựa vào loại
  const basePath = type === "ebook" ? "/ebook" : "/xuat-ban";

  // Sử dụng SWR để fetch dữ liệu theo thể loại và trang với server actions
  const { data, error, isLoading } = useSWR(
    [type, currentPage, selectedGenre],
    booksFetcher,
    {
      fallbackData: {
        stories: initialBooks,
        pagination: initialPagination,
      },
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 phút cache
    }
  ) as {
    data: { stories: BookItem[]; pagination: any };
    error: any;
    isLoading: boolean;
  };

  const books = data?.stories || initialBooks;
  const pagination = data?.pagination || initialPagination;

  const handlePageChange = (page: number) => {
    // Chuyển hướng đến trang mới với thể loại được chọn (nếu có)
    const genreParam = selectedGenre ? `&tag=${selectedGenre}` : "";
    router.push(`${basePath}?page=${page}${genreParam}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-8">
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold">
              {title} {selectedGenre ? `: ${selectedGenre}` : ""}
            </h1>
            <div className="h-1 flex-1 bg-primary opacity-20 rounded-full hidden md:block"></div>
          </div>

          <p className="text-sm opacity-70 mb-6">{description}</p>

          <div className="flex flex-wrap gap-2 mb-4">
            {genres.map((genre) => (
              <Link
                key={genre}
                href={`${basePath}?tag=${encodeURIComponent(genre)}`}
                className={`badge ${
                  selectedGenre === genre
                    ? "badge-primary"
                    : "badge-outline hover:badge-ghost"
                } py-3 cursor-pointer transition-colors`}
              >
                {genre}
              </Link>
            ))}
            {selectedGenre && (
              <Link
                href={basePath}
                className="badge badge-error badge-outline py-3 cursor-pointer transition-colors"
              >
                Xóa lọc
              </Link>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="loading loading-spinner loading-lg text-primary"></div>
        </div>
      ) : error ? (
        <div className="alert alert-error">
          <span>Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại sau.</span>
        </div>
      ) : books.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {books.map((book: BookItem) => (
              <BookCard key={book.id} book={book} type={type} />
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      ) : (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body items-center text-center py-16">
            <TagIcon className="w-16 h-16 opacity-30 mb-4" />
            <h2 className="card-title">Không tìm thấy truyện</h2>
            <p className="opacity-70">
              {selectedGenre
                ? `Không có truyện nào thuộc thể loại "${selectedGenre}".`
                : "Chọn một thể loại để xem truyện."}
            </p>
            {selectedGenre && (
              <div className="card-actions mt-4">
                <Link href={basePath} className="btn btn-primary">
                  Xem tất cả
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryPage;
