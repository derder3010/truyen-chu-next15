import React from "react";
import type { Metadata } from "next";
import { APP_CONFIG, PAGINATION } from "@/lib/config";
import CategoryClientPage from "@/components/CategoryClientPage";
import { getGenres, getStories } from "@/lib/api";

export const runtime = "edge";

// Generate metadata cho trang thể loại
export async function generateMetadata({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}): Promise<Metadata> {
  const selectedGenre =
    typeof searchParams.tag === "string" ? searchParams.tag : undefined;

  // Lấy danh sách thể loại từ API
  const genres = await getGenres();

  // Metadata mặc định
  let title = `Thể loại truyện | ${APP_CONFIG.APP_NAME}`;
  let description =
    "Khám phá truyện theo thể loại yêu thích. Tổng hợp đầy đủ các thể loại truyện chữ.";

  // Nếu có thể loại được chọn, cập nhật metadata phù hợp
  if (selectedGenre) {
    title = `Truyện thể loại ${selectedGenre} | ${APP_CONFIG.APP_NAME}`;
    description = `Đọc truyện thể loại ${selectedGenre} hay nhất. Tổng hợp danh sách truyện ${selectedGenre} đầy đủ, cập nhật liên tục.`;
  }

  return {
    title,
    description,
    keywords: [
      ...genres,
      "thể loại truyện",
      "đọc truyện theo thể loại",
      selectedGenre || "",
    ].filter(Boolean),
    openGraph: {
      title,
      description,
      url: `${APP_CONFIG.SITE_URL}/the-loai${
        selectedGenre ? `?tag=${encodeURIComponent(selectedGenre)}` : ""
      }`,
      siteName: APP_CONFIG.APP_NAME,
      locale: "vi_VN",
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function CategoryPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const tag =
    typeof searchParams.tag === "string" ? searchParams.tag : undefined;
  const pageParam =
    typeof searchParams.page === "string" ? searchParams.page : undefined;
  const currentPage = pageParam ? parseInt(pageParam, 10) : 1;

  // Lấy danh sách thể loại từ API
  const genres = await getGenres();

  // Lấy danh sách truyện từ API
  // TODO: Thêm API để lọc theo thể loại
  const { stories, pagination } = await getStories(
    currentPage,
    PAGINATION.STORIES_PER_PAGE
  );

  // Lọc truyện theo thể loại (tạm thời lọc ở client side)
  const filteredStories = tag
    ? stories.filter((story) => story.genres.includes(tag))
    : stories;

  return (
    <CategoryClientPage
      initialStories={filteredStories}
      genres={genres}
      pagination={pagination}
    />
  );
}
