import { NextRequest, NextResponse } from "next/server";
import { getStories } from "@/lib/api";
import { createSearchIndex, search } from "@/lib/search";
import { db } from "@/lib/db";
import { licensedStories, ebooks } from "@/lib/db/schema";
import { like, or } from "drizzle-orm";

// Biến lưu trữ trạng thái đã khởi tạo index chưa
let initialized = false;

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const searchQuery = url.searchParams.get("q");

  if (!searchQuery) {
    return NextResponse.json({ stories: [], ebooks: [], licensedStories: [] });
  }

  try {
    // Khởi tạo search index nếu chưa được khởi tạo
    if (!initialized) {
      // Lấy tất cả truyện để đánh index
      const { stories } = await getStories(1, 500);
      createSearchIndex(stories);
      initialized = true;
    }

    // Thực hiện tìm kiếm với MiniSearch cho truyện thường
    const searchResults = search(searchQuery);

    // Tìm kiếm truyện bản quyền (Licensed Stories)
    const lowercasedQuery = `%${searchQuery.toLowerCase()}%`;
    const licensedResults = await db
      .select()
      .from(licensedStories)
      .where(
        or(
          like(licensedStories.title, lowercasedQuery),
          like(licensedStories.author, lowercasedQuery),
          like(licensedStories.genres || "", lowercasedQuery)
        )
      )
      .limit(20);

    // Tìm kiếm ebooks
    const ebookResults = await db
      .select()
      .from(ebooks)
      .where(
        or(
          like(ebooks.title, lowercasedQuery),
          like(ebooks.author, lowercasedQuery),
          like(ebooks.genres || "", lowercasedQuery)
        )
      )
      .limit(20);

    // Xử lý purchaseLinks cho licensed stories và ebooks
    const processedLicensedStories = licensedResults.map((story) => ({
      ...story,
      type: "licensed",
      purchaseLinks: story.purchaseLinks
        ? JSON.parse(story.purchaseLinks as string)
        : [],
    }));

    const processedEbooks = ebookResults.map((book) => ({
      ...book,
      type: "ebook",
      purchaseLinks: book.purchaseLinks
        ? JSON.parse(book.purchaseLinks as string)
        : [],
    }));

    // Thêm type cho các kết quả tìm kiếm thông thường
    const processedStories = searchResults.map((story) => ({
      ...story,
      type: "story",
    }));

    // Kết hợp tất cả kết quả
    const allResults = [
      ...processedStories,
      ...processedLicensedStories,
      ...processedEbooks,
    ];

    // Kết quả đã được sắp xếp theo độ phù hợp
    return NextResponse.json({
      stories: processedStories,
      licensedStories: processedLicensedStories,
      ebooks: processedEbooks,
      allResults: allResults,
    });
  } catch (error) {
    console.error("Search error:", error);

    // Fallback: Nếu có lỗi thì dùng cách tìm kiếm cũ
    try {
      const { stories } = await getStories(1, 500);
      const lowercasedQuery = searchQuery.toLowerCase();

      // Tìm kiếm truyện thông thường
      const filteredStories = stories
        .filter(
          (story) =>
            story.title.toLowerCase().includes(lowercasedQuery) ||
            story.author.toLowerCase().includes(lowercasedQuery) ||
            story.genres.some((genre) =>
              genre.toLowerCase().includes(lowercasedQuery)
            )
        )
        .map((story) => ({ ...story, type: "story" }));

      // Tìm kiếm truyện bản quyền và ebooks
      const likeQuery = `%${lowercasedQuery}%`;

      const licensedResults = await db
        .select()
        .from(licensedStories)
        .where(
          or(
            like(licensedStories.title, likeQuery),
            like(licensedStories.author, likeQuery),
            like(licensedStories.genres || "", likeQuery)
          )
        )
        .limit(20);

      const ebookResults = await db
        .select()
        .from(ebooks)
        .where(
          or(
            like(ebooks.title, likeQuery),
            like(ebooks.author, likeQuery),
            like(ebooks.genres || "", likeQuery)
          )
        )
        .limit(20);

      // Xử lý purchaseLinks
      const processedLicensedStories = licensedResults.map((story) => ({
        ...story,
        type: "licensed",
        purchaseLinks: story.purchaseLinks
          ? JSON.parse(story.purchaseLinks as string)
          : [],
      }));

      const processedEbooks = ebookResults.map((book) => ({
        ...book,
        type: "ebook",
        purchaseLinks: book.purchaseLinks
          ? JSON.parse(book.purchaseLinks as string)
          : [],
      }));

      // Kết hợp tất cả kết quả
      const allResults = [
        ...filteredStories,
        ...processedLicensedStories,
        ...processedEbooks,
      ];

      return NextResponse.json({
        stories: filteredStories,
        licensedStories: processedLicensedStories,
        ebooks: processedEbooks,
        allResults: allResults,
      });
    } catch (fallbackError) {
      console.error("Fallback search error:", fallbackError);
      return NextResponse.json(
        { error: "Failed to search stories" },
        { status: 500 }
      );
    }
  }
}
