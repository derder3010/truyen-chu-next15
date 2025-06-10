"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "~image";
import useSWR from "swr";
import NotFoundPage from "@/app/NotFound";
import Pagination from "@/components/Pagination";
import { Chapter, Story } from "@/types";

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface StoryClientPageProps {
  story: Story | undefined;
  chapters: Chapter[];
  pagination: PaginationData;
  currentPage: number;
}

export default function StoryClientPage({
  story,
  chapters: initialChapters,
  pagination: initialPagination,
  currentPage,
}: StoryClientPageProps) {
  const router = useRouter();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [relatedStories, setRelatedStories] = useState<Story[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(true);

  // Move useSWR hook outside of conditional - always call it with a proper URL or null
  const { data } = useSWR(
    story ? `/api/chapters?storyId=${story.id}&page=${currentPage}` : null,
    fetcher,
    {
      fallbackData: {
        chapters: initialChapters,
        pagination: initialPagination,
      },
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 phút cache
    }
  );

  // Move useEffect outside of conditional
  useEffect(() => {
    // Only execute the fetch inside the useEffect if story exists
    if (!story) return;

    const fetchRelatedStories = async () => {
      try {
        setIsLoadingRelated(true);
        const response = await fetch(
          `/api/stories/related?storyId=${story.id}&limit=6`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch related stories");
        }

        const data = await response.json();
        setRelatedStories(data.stories || []);
      } catch (error) {
        console.error("Error fetching related stories:", error);
      } finally {
        setIsLoadingRelated(false);
      }
    };

    fetchRelatedStories();
  }, [story]);

  const chapters = data?.chapters || initialChapters;
  const pagination = data?.pagination || initialPagination;

  // Handle not found case - move this AFTER all hooks
  if (!story) {
    return <NotFoundPage />;
  }

  const handlePageChange = (page: number) => {
    // Navigate to the same page with a different page parameter
    router.push(`/truyen/${story.slug}?page=${page}`);
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 mb-6">
        <h1 className="text-2xl font-bold">Chi tiết truyện</h1>
        <div className="breadcrumbs text-sm">
          <ul>
            <li>
              <Link href="/">Trang chủ</Link>
            </li>
            <li>
              <Link href="/the-loai">Thể loại</Link>
            </li>
            <li>{story.title}</li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-1">
          <div className="card bg-base-100 shadow-lg">
            <figure className="px-6 pt-6">
              {story.coverImage ? (
                <div className="mx-auto">
                  <div
                    className="book-cover relative w-full aspect-[3/4] h-[280px] 
                    bg-white
                    border-4 border-base-200
                    shadow-[0_0_15px_rgba(0,0,0,0.2)]
                    rounded-md overflow-hidden"
                  >
                    {/* Inner frame/mat */}
                    <div className="absolute inset-[4px] border border-gray-300 rounded-sm z-10"></div>

                    <Image
                      src={story.coverImage}
                      alt={story.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 280px"
                    />

                    {/* Subtle overlay for better visual appearance */}
                    <div className="absolute inset-0 shadow-inner"></div>
                  </div>
                </div>
              ) : (
                <div
                  className="book-cover relative w-full aspect-[3/4] h-[280px]
                  bg-base-200
                  border-4 border-base-200
                  shadow-[0_0_15px_rgba(0,0,0,0.2)]
                  rounded-md overflow-hidden
                  flex items-center justify-center"
                >
                  <div className="absolute inset-[4px] border border-gray-300 rounded-sm z-10"></div>
                  <span className="text-base-content/60 z-20">
                    Không có ảnh bìa
                  </span>
                  <div className="absolute inset-0 shadow-inner"></div>
                </div>
              )}
            </figure>
            <div className="card-body">
              <h2 className="card-title">{story.title}</h2>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-base-content/70">Tác giả:</span>
                  <span className="font-medium">
                    {story.author || "Không có"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-content/70">Trạng thái:</span>
                  <span
                    className={`badge ${
                      story.status === "Đang tiến hành"
                        ? "badge-primary"
                        : "badge-success"
                    }`}
                  >
                    {story.status}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-base-content/70 mb-1">Thể loại:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {story.genres && story.genres.length > 0 ? (
                      story.genres.map((genre: string) => (
                        <Link
                          key={genre}
                          href={`/the-loai/?tag=${encodeURIComponent(
                            genre.toLowerCase()
                          )}`}
                          className="badge badge-outline hover:badge-primary transition-colors"
                        >
                          {genre}
                        </Link>
                      ))
                    ) : (
                      <span className="text-base-content/50">
                        Chưa phân loại
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-content/70">Lượt xem:</span>
                  <span className="font-medium">{story.views || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-content/70">Số chương:</span>
                  <span className="font-medium">{story.totalChapters}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-content/70">Cập nhật:</span>
                  <span className="font-medium">{story.lastUpdated}</span>
                </div>
              </div>
            </div>
          </div>

          {/* YouTube embed card in left column */}
          {story.youtubeEmbed && (
            <div className="card bg-base-100 shadow-lg mt-6">
              <div className="card-body">
                <h2 className="card-title mb-2">Nghe audio trên YouTube</h2>
                <div className="youtube-embed-container w-full overflow-hidden rounded-lg">
                  <div
                    dangerouslySetInnerHTML={{ __html: story.youtubeEmbed }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <div className="card bg-base-100 shadow-lg mb-6">
            <div className="card-body">
              <h2 className="card-title mb-2">Giới thiệu</h2>
              <div>
                <p
                  className={`whitespace-pre-line ${
                    !showFullDescription ? "line-clamp-3" : ""
                  }`}
                >
                  {story.description || "Không có giới thiệu."}
                </p>
                {story.description &&
                  (story.description.length > 150 ||
                    story.description.split("\n").length > 3) && (
                    <button
                      onClick={() =>
                        setShowFullDescription(!showFullDescription)
                      }
                      className="text-primary text-sm mt-1 hover:underline"
                    >
                      {showFullDescription ? "Ẩn bớt" : "Xem thêm"}
                    </button>
                  )}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/truyen/${story.slug}/1`}
                className="btn btn-info flex-1 lg:flex-none"
              >
                <span className="text-xs sm:text-sm">Đọc từ đầu</span>
              </Link>
              <Link
                href={`/truyen/${story.slug}/${story.totalChapters}`}
                className="btn btn-success flex-1 lg:flex-none"
              >
                <span className="text-xs sm:text-sm">Đọc mới nhất</span>
              </Link>
            </div>
          </div>

          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h2 className="card-title">
                  Danh sách chương ({pagination.total})
                </h2>
              </div>

              {chapters.length === 0 ? (
                <div className="text-center py-8 text-base-content/60">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 mx-auto mb-2 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  <p>Chưa có chương nào được cập nhật cho truyện này.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                      <tbody>
                        {chapters.map((chapter: Chapter) => (
                          <tr key={chapter.id} className="hover:bg-base-200">
                            <td>
                              <Link
                                href={`/truyen/${story.slug}/${chapter.chapterNumber}`}
                                className="block w-full hover:text-primary"
                              >
                                Chương {chapter.chapterNumber}: {chapter.title}
                              </Link>
                            </td>
                            <td className="text-right text-xs opacity-60 whitespace-nowrap">
                              {chapter.publishedDate}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
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
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Có thể bạn quan tâm */}
      <div className="card bg-base-100 shadow-lg mt-8">
        <div className="card-body">
          <h2 className="text-xl font-bold mb-4">Có thể bạn quan tâm</h2>

          {isLoadingRelated ? (
            <div className="flex justify-center py-4">
              <div className="loading loading-spinner loading-md text-primary"></div>
            </div>
          ) : relatedStories.length === 0 ? (
            <p className="opacity-70">Không tìm thấy truyện tương tự.</p>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {relatedStories.map((relatedStory) => (
                <Link
                  key={relatedStory.id}
                  href={`/truyen/${relatedStory.slug}`}
                  className="card bg-base-200 hover:bg-base-300 transition-colors h-full"
                >
                  <figure className="px-2 pt-2">
                    <div className="relative w-full aspect-[3/4] rounded-md overflow-hidden border border-base-300">
                      <Image
                        src={
                          relatedStory.coverImage || "/images/placeholder.jpg"
                        }
                        alt={relatedStory.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 33vw, 16vw"
                      />
                    </div>
                  </figure>
                  <div className="card-body p-2">
                    <h3 className="text-xs font-medium line-clamp-2">
                      {relatedStory.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Add CSS at the bottom of the file
const styles = `
  /* YouTube embed responsive styling */
  .youtube-embed-container {
    position: relative;
  }

  .youtube-embed-container iframe {
    width: 100% !important;
    height: auto !important;
    aspect-ratio: 16 / 9;
    border-radius: 0.5rem;
  }
`;

// Inject the styles
if (typeof document !== "undefined") {
  // Only run on client side
  const styleEl = document.createElement("style");
  styleEl.id = "youtube-embed-styles";
  styleEl.innerHTML = styles;

  // Check if style already exists before adding
  if (!document.getElementById("youtube-embed-styles")) {
    document.head.appendChild(styleEl);
  }
}
