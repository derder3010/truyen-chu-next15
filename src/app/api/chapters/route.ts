import { NextRequest, NextResponse } from "next/server";
import { getChaptersByStoryId } from "@/lib/api";
import { PAGINATION } from "@/lib/config";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const storyIdParam = url.searchParams.get("storyId");
    const pageParam = url.searchParams.get("page");

    if (!storyIdParam) {
      return NextResponse.json(
        { error: "Story ID is required" },
        { status: 400 }
      );
    }

    const storyId = parseInt(storyIdParam, 10);
    const currentPage = pageParam ? parseInt(pageParam, 10) : 1;

    // Lấy danh sách chương từ API
    const chaptersData = await getChaptersByStoryId(
      storyId,
      currentPage,
      PAGINATION.CHAPTERS_PER_PAGE
    );

    return NextResponse.json({
      chapters: chaptersData.chapters,
      pagination: chaptersData.pagination,
    });
  } catch (error) {
    console.error("Error fetching chapters:", error);
    return NextResponse.json(
      { error: "Failed to fetch chapters" },
      { status: 500 }
    );
  }
}
