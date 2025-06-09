import React from "react";
import type { Metadata } from "next";
import { APP_CONFIG, PAGINATION } from "@/lib/config";
import CategoryPage from "@/components/LicensedAndEbookComponents/CategoryPage";

// Custom function để lấy danh sách ebook
async function getEbooks(page = 1, limit = 10) {
  // Lấy origin URL từ environment
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000");

  // Tạo URL đầy đủ
  const url = new URL(`/api/ebooks`, origin);
  url.searchParams.append("page", page.toString());
  url.searchParams.append("limit", limit.toString());

  const response = await fetch(url.toString(), {
    cache: "no-store",
  });

  const data = await response.json();
  return {
    stories: data.stories.map((story: any) => ({
      ...story,
      genres: story.genres
        ? story.genres.split(",").map((g: string) => g.trim())
        : [],
    })),
    pagination: data.pagination || {
      total: 0,
      page,
      limit,
      totalPages: 0,
    },
  };
}

// Hàm để lấy danh sách thể loại từ danh sách ebook
function extractGenresFromEbooks(ebooks: any[]) {
  // Tạo Set để lưu trữ các thể loại không trùng lặp
  const genresSet = new Set<string>();

  // Duyệt qua danh sách ebook
  ebooks.forEach((ebook) => {
    if (Array.isArray(ebook.genres)) {
      ebook.genres.forEach((genre: string) => {
        if (genre && genre.trim()) {
          genresSet.add(genre.trim());
        }
      });
    } else if (typeof ebook.genres === "string") {
      ebook.genres.split(",").forEach((genre: string) => {
        if (genre && genre.trim()) {
          genresSet.add(genre.trim());
        }
      });
    }
  });

  // Chuyển Set thành mảng và sắp xếp theo thứ tự alphabet
  return Array.from(genresSet).sort();
}

// Revalidate trang mỗi 2 giờ
export const revalidate = 7200;

// Generate metadata cho trang ebook
export async function generateMetadata({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}): Promise<Metadata> {
  // Parse searchParams safely
  const searchParamsData = await Promise.resolve(searchParams);
  const selectedGenre =
    typeof searchParamsData.tag === "string" ? searchParamsData.tag : undefined;

  // Lấy danh sách ebook để trích xuất thể loại
  const { stories } = await getEbooks(1, 100); // Lấy 100 ebook để có danh sách thể loại đầy đủ
  const genres = extractGenresFromEbooks(stories);

  // Metadata mặc định
  let title = `Ebook | ${APP_CONFIG.APP_NAME}`;
  let description =
    "Danh sách ebook truyện chữ hay nhất. Đọc và tải ebook chất lượng.";

  // Nếu có thể loại được chọn, cập nhật metadata phù hợp
  if (selectedGenre) {
    title = `Ebook - Thể loại ${selectedGenre} | ${APP_CONFIG.APP_NAME}`;
    description = `Ebook truyện chữ thể loại ${selectedGenre}. Tải và đọc ebook trên thiết bị của bạn.`;
  }

  return {
    title,
    description,
    keywords: [
      ...genres,
      "ebook truyện chữ",
      "đọc ebook",
      "tải ebook",
      selectedGenre || "",
    ].filter(Boolean),
    openGraph: {
      title,
      description,
      url: `${APP_CONFIG.SITE_URL}/ebook${
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

export default async function EbookPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Parse searchParams safely
  const searchParamsData = await Promise.resolve(searchParams);
  const tag =
    typeof searchParamsData.tag === "string" ? searchParamsData.tag : undefined;
  const pageParam =
    typeof searchParamsData.page === "string"
      ? searchParamsData.page
      : undefined;
  const currentPage = pageParam ? parseInt(pageParam, 10) : 1;

  // Lấy danh sách ebook từ API
  const { stories, pagination } = await getEbooks(
    currentPage,
    PAGINATION.STORIES_PER_PAGE
  );

  // Lấy danh sách ebook nhiều hơn để trích xuất đầy đủ thể loại
  const allEbooksResponse = await getEbooks(1, 100);
  const genres = extractGenresFromEbooks(allEbooksResponse.stories);

  // Lọc ebook theo thể loại (nếu có)
  const filteredStories = tag
    ? stories.filter((story: any) => story.genres.includes(tag))
    : stories;

  return (
    <CategoryPage
      initialBooks={filteredStories}
      genres={genres}
      pagination={pagination}
      title="Ebook Truyện Chữ"
      description="Tuyển tập ebook truyện chữ hay nhất. Tải hoặc mua ebook chính thức để đọc mọi lúc mọi nơi."
      type="ebook"
    />
  );
}
