"use client";

import React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import StoryCard from "@/components/StoryCard";
import { Story } from "@/types";
import TagIcon from "@/components/icons/TagIcon";
import Pagination from "./Pagination";
import { clientGetStoriesByGenre } from "@/lib/actions";

// Fetcher function for SWR using server action
const genreFetcher = async ([tag, page]: [string | null, number]) => {
  return clientGetStoriesByGenre(tag, page);
};

interface CategoryClientPageProps {
  initialStories: Story[];
  genres: string[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  genreCount?: Record<string, number>;
}

const CategoryClientPage: React.FC<CategoryClientPageProps> = ({
  initialStories,
  genres,
  pagination: initialPagination,
  genreCount = {},
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedGenre = searchParams.get("tag");
  const currentPage = searchParams.get("page")
    ? parseInt(searchParams.get("page") || "1", 10)
    : 1;

  // Use SWR with server action
  const { data, error, isLoading } = useSWR(
    [selectedGenre, currentPage],
    genreFetcher,
    {
      fallbackData: {
        stories: initialStories,
        pagination: initialPagination,
        genreCount,
      },
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 phút cache
    }
  );

  const stories = data?.stories || initialStories;
  const pagination = data?.pagination || initialPagination;
  const genreCounts = data?.genreCount || genreCount;

  const handlePageChange = (page: number) => {
    // Chuyển hướng đến trang mới với thể loại được chọn (nếu có)
    const genreParam = selectedGenre ? `&tag=${selectedGenre}` : "";
    router.push(`/the-loai?page=${page}${genreParam}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-8">
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold">
              Thể Loại Truyện {selectedGenre ? `: ${selectedGenre}` : ""}
            </h1>
            <div className="h-1 flex-1 bg-primary opacity-20 rounded-full hidden md:block"></div>
          </div>

          <p className="text-sm opacity-70 mb-6">
            Khám phá truyện theo thể loại yêu thích của bạn.
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {genres.map((genre) => (
              <Link
                key={genre}
                href={`/the-loai?tag=${encodeURIComponent(genre)}`}
                className={`badge ${
                  selectedGenre === genre
                    ? "badge-primary"
                    : "badge-outline hover:badge-ghost"
                } py-3 cursor-pointer transition-colors`}
              >
                {genre}
                {genreCounts[genre] !== undefined && (
                  <span className="ml-1">({genreCounts[genre]})</span>
                )}
              </Link>
            ))}
            {selectedGenre && (
              <Link
                href="/the-loai"
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
      ) : stories.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {stories.map((story: Story) => (
              <StoryCard key={story.id} story={story} />
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
                <Link href="/the-loai" className="btn btn-primary">
                  Xem tất cả thể loại
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryClientPage;
