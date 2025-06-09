import { NextRequest, NextResponse } from "next/server";
import { getStories } from "@/lib/api";
import { createSearchIndex, autoSuggest } from "@/lib/search";

// Biến lưu trữ trạng thái đã khởi tạo index chưa
let initialized = false;

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q");

  if (!query) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    // Khởi tạo search index nếu chưa được khởi tạo
    if (!initialized) {
      // Lấy tất cả truyện để đánh index
      const { stories } = await getStories(1, 500);
      createSearchIndex(stories);
      initialized = true;
    }

    // Lấy gợi ý từ autoSuggest
    const suggestions = autoSuggest(query, 5);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Suggestions error:", error);
    return NextResponse.json(
      { error: "Failed to get suggestions", suggestions: [] },
      { status: 500 }
    );
  }
}
