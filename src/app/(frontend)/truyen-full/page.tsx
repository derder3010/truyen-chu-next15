import React from "react";
import { Metadata } from "next";
import { APP_CONFIG, PAGINATION } from "@/lib/config";
import StoryCard from "@/components/StoryCard";
import { getStories } from "@/lib/api";
import Pagination from "@/components/Pagination";

// Metadata cho trang truyện full
export const metadata: Metadata = {
  title: `Truyện đã hoàn thành | ${APP_CONFIG.APP_NAME}`,
  description:
    "Danh sách truyện đã hoàn thành. Đọc truyện full hay nhất, đầy đủ nhất, không phải đợi chờ.",
  keywords: [
    "truyện full",
    "truyện hoàn thành",
    "truyện đã hoàn",
    "truyện chữ full",
    "truyện hay đã hoàn thành",
  ],
  openGraph: {
    title: `Truyện đã hoàn thành | ${APP_CONFIG.APP_NAME}`,
    description:
      "Danh sách truyện đã hoàn thành. Đọc truyện full hay nhất, đầy đủ nhất, không phải đợi chờ.",
    url: `${APP_CONFIG.SITE_URL}/truyen-full`,
    siteName: APP_CONFIG.APP_NAME,
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: `Truyện đã hoàn thành | ${APP_CONFIG.APP_NAME}`,
    description:
      "Danh sách truyện đã hoàn thành. Đọc truyện full hay nhất, đầy đủ nhất, không phải đợi chờ.",
  },
};

interface Props {
  searchParams: { page?: string };
}

export default async function FullStoriesPage({ searchParams }: Props) {
  // Await searchParams before accessing its properties
  const params = await searchParams;
  const pageParam = params.page;
  const currentPage = pageParam ? parseInt(pageParam, 10) : 1;

  // Lấy dữ liệu từ API với tham số là "completed"
  const { stories: completedStories, pagination } = await getStories(
    currentPage,
    PAGINATION.STORIES_PER_PAGE,
    "completed"
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-2xl font-bold">Truyện Đã Hoàn Thành</h1>
        <div className="h-1 flex-1 bg-primary opacity-20 rounded-full hidden md:block"></div>
      </div>

      {completedStories.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {completedStories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                onPageChange={() => {}} // Chỉ để thỏa mãn props interface
              />
            </div>
          )}
        </>
      ) : (
        <div className="alert">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="stroke-info shrink-0 w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <span>Chưa có truyện hoàn thành nào.</span>
        </div>
      )}
    </div>
  );
}
