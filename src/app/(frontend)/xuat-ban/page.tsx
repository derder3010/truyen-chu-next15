import React from "react";
import type { Metadata } from "next";
import { APP_CONFIG, PAGINATION } from "@/lib/config";
import CategoryPage from "@/components/LicensedAndEbookComponents/CategoryPage";

// Custom function để lấy danh sách truyện bản quyền
async function getLicensedStories(page = 1, limit = 10) {
  try {
    // Use server-side API instead of fetch
    const { getFeaturedLicensedStories } = await import("@/lib/api");
    const licensedStories = await getFeaturedLicensedStories(limit * page);

    // Manual pagination on the result
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedStories = licensedStories.slice(startIndex, endIndex);

    // Transform data to match BookItem type
    const formattedStories = paginatedStories.map((story) => ({
      ...story,
      coverImage: story.coverImage ?? undefined,
      description: story.description ?? "",
      genres: story.genres ? story.genres : "",
      status: story.status ?? "ongoing",
    }));

    return {
      stories: formattedStories,
      pagination: {
        total: licensedStories.length,
        page,
        limit,
        totalPages: Math.ceil(licensedStories.length / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching licensed stories:", error);
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

// Hàm để lấy danh sách thể loại từ danh sách truyện
function extractGenresFromStories(stories: any[]) {
  // Tạo Set để lưu trữ các thể loại không trùng lặp
  const genresSet = new Set<string>();

  // Duyệt qua danh sách truyện
  stories.forEach((story) => {
    if (Array.isArray(story.genres)) {
      story.genres.forEach((genre: string) => {
        if (genre && genre.trim()) {
          genresSet.add(genre.trim());
        }
      });
    } else if (typeof story.genres === "string") {
      story.genres.split(",").forEach((genre: string) => {
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

// Generate metadata cho trang truyện bản quyền
export async function generateMetadata({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}): Promise<Metadata> {
  // Parse searchParams safely
  const searchParamsData = await Promise.resolve(searchParams);
  const selectedGenre =
    typeof searchParamsData.tag === "string" ? searchParamsData.tag : undefined;

  // Lấy danh sách truyện từ server-side API
  const { getFeaturedLicensedStories } = await import("@/lib/api");
  const allStories = await getFeaturedLicensedStories(100);

  // Transform to match type
  const formattedStories = allStories.map((story) => ({
    ...story,
    coverImage: story.coverImage ?? undefined,
    description: story.description ?? "",
    genres: story.genres ? story.genres : "",
    status: story.status ?? "ongoing",
  }));

  const genres = extractGenresFromStories(formattedStories);

  // Metadata mặc định
  let title = `Truyện Bản Quyền | ${APP_CONFIG.APP_NAME}`;
  let description =
    "Danh sách truyện bản quyền được phát hành chính thức tại Việt Nam. Ủng hộ tác giả bằng cách mua sách chính thức.";

  // Nếu có thể loại được chọn, cập nhật metadata phù hợp
  if (selectedGenre) {
    title = `Truyện Bản Quyền - Thể loại ${selectedGenre} | ${APP_CONFIG.APP_NAME}`;
    description = `Truyện bản quyền thể loại ${selectedGenre}. Các tác phẩm được phát hành chính thức tại Việt Nam.`;
  }

  return {
    title,
    description,
    keywords: [
      ...genres,
      "truyện bản quyền",
      "truyện xuất bản",
      "truyện chính thức",
      selectedGenre || "",
    ].filter(Boolean),
    openGraph: {
      title,
      description,
      url: `${APP_CONFIG.SITE_URL}/xuat-ban${
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

export default async function LicensedStoriesPage({
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

  // Lấy danh sách truyện từ API
  const { stories, pagination } = await getLicensedStories(
    currentPage,
    PAGINATION.STORIES_PER_PAGE
  );

  // Lấy danh sách truyện từ server-side API
  const { getFeaturedLicensedStories } = await import("@/lib/api");
  const allStories = await getFeaturedLicensedStories(100);

  // Transform to match type
  const formattedAllStories = allStories.map((story) => ({
    ...story,
    coverImage: story.coverImage ?? undefined,
    description: story.description ?? "",
    genres: story.genres ? story.genres : "",
    status: story.status ?? "ongoing",
  }));

  const genres = extractGenresFromStories(formattedAllStories);

  // Lọc truyện theo thể loại (nếu có)
  const filteredStories = tag
    ? stories.filter((story: any) => story.genres.includes(tag))
    : stories;

  return (
    <CategoryPage
      initialBooks={filteredStories}
      genres={genres}
      pagination={pagination}
      title="Truyện Bản Quyền"
      description="Những tác phẩm đã được phát hành chính thức tại Việt Nam. Ủng hộ tác giả bằng cách mua sách chính thức."
      type="licensed"
    />
  );
}
