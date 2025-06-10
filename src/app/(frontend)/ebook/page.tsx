import React from "react";
import type { Metadata } from "next";
import { APP_CONFIG, PAGINATION } from "@/lib/config";
import CategoryPage from "@/components/LicensedAndEbookComponents/CategoryPage";

// Custom function để lấy danh sách ebook
async function getEbooks(page = 1, limit = 10) {
  // Use the server component API directly instead of fetch for ebooks
  try {
    // Use server-side API instead of fetch
    const { getFeaturedEbooks } = await import("@/lib/api");
    const ebooks = await getFeaturedEbooks(limit * page);

    // Manual pagination on the result
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedEbooks = ebooks.slice(startIndex, endIndex);

    // Transform data to match BookItem type
    const formattedEbooks = paginatedEbooks.map((ebook) => ({
      ...ebook,
      coverImage: ebook.coverImage ?? undefined,
      description: ebook.description ?? "",
      genres: ebook.genres ? ebook.genres : "",
      status: ebook.status ?? "ongoing",
    }));

    return {
      stories: formattedEbooks,
      pagination: {
        total: ebooks.length,
        page,
        limit,
        totalPages: Math.ceil(ebooks.length / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching ebooks:", error);
    return {
      stories: [],
      pagination: {
        total: 0,
        page,
        limit,
        totalPages: 0,
      },
    };
  }
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

  // Lấy danh sách ebook từ server-side API
  const { getFeaturedEbooks } = await import("@/lib/api");
  const allEbooks = await getFeaturedEbooks(100);

  // Transform to match type
  const formattedEbooks = allEbooks.map((ebook) => ({
    ...ebook,
    coverImage: ebook.coverImage ?? undefined,
    description: ebook.description ?? "",
    genres: ebook.genres ? ebook.genres : "",
    status: ebook.status ?? "ongoing",
  }));

  const genres = extractGenresFromEbooks(formattedEbooks);

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

  // Lấy danh sách ebook từ server-side API
  const { getFeaturedEbooks } = await import("@/lib/api");
  const allEbooks = await getFeaturedEbooks(100);

  // Transform to match type
  const formattedAllEbooks = allEbooks.map((ebook) => ({
    ...ebook,
    coverImage: ebook.coverImage ?? undefined,
    description: ebook.description ?? "",
    genres: ebook.genres ? ebook.genres : "",
    status: ebook.status ?? "ongoing",
  }));

  const genres = extractGenresFromEbooks(formattedAllEbooks);

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
