import { NextRequest, NextResponse } from "next/server";
import { getStories } from "@/lib/api";
import { PAGINATION } from "@/lib/config";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const tag = url.searchParams.get("tag");
    const pageParam = url.searchParams.get("page");
    const currentPage = pageParam ? parseInt(pageParam, 10) : 1;

    // Lấy truyện từ API
    const { stories, pagination } = await getStories(
      currentPage,
      PAGINATION.STORIES_PER_PAGE
    );

    // Nếu có tag, lọc truyện theo thể loại
    let filteredStories = stories;
    if (tag) {
      filteredStories = stories.filter((story) => story.genres.includes(tag));
    }

    // Tính toán số lượng truyện cho mỗi thể loại
    const genreCount: Record<string, number> = {};
    stories.forEach((story) => {
      story.genres.forEach((genre) => {
        genreCount[genre] = (genreCount[genre] || 0) + 1;
      });
    });

    // Trả về kết quả
    return NextResponse.json({
      stories: filteredStories,
      pagination: {
        ...pagination,
        // Tính lại tổng số trang nếu có lọc
        totalPages: tag
          ? Math.ceil(filteredStories.length / PAGINATION.STORIES_PER_PAGE) || 1
          : pagination.totalPages,
      },
      genreCount,
    });
  } catch (error) {
    console.error("Error fetching stories by genre:", error);
    return NextResponse.json(
      { error: "Failed to fetch stories" },
      { status: 500 }
    );
  }
}
