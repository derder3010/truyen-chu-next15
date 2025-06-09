import MiniSearch from "minisearch";
import { Story } from "@/types";
import { removeVietnameseAccents } from "./utils";

// Định nghĩa một interface chung cho tất cả các loại nội dung (truyện, ebook, truyện bản quyền)
export interface SearchableItem {
  id: string | number;
  title: string;
  author: string;
  genres: string[] | string;
  slug: string;
  type?: "story" | "licensed" | "ebook"; // Loại nội dung
  [key: string]: any; // Cho phép thêm các trường khác
}

// Global instance để lưu trữ index
let searchIndex: MiniSearch<SearchableItem> | null = null;

// Hàm tạo index MiniSearch từ danh sách các mục có thể tìm kiếm
export function createSearchIndex(
  items: SearchableItem[]
): MiniSearch<SearchableItem> {
  // Chuẩn bị dữ liệu: đảm bảo các trường là nhất quán
  const processedItems = items.map((item) => {
    // Chuyển đổi genres thành mảng nếu nó là string
    const genres =
      typeof item.genres === "string"
        ? item.genres
            .split(",")
            .map((g) => g.trim())
            .filter(Boolean)
        : item.genres || [];

    return {
      ...item,
      genres: genres,
      // Thêm các field phụ trợ cho tìm kiếm
      normalizedTitle: removeVietnameseAccents(item.title),
      normalizedAuthor: removeVietnameseAccents(item.author),
      type: item.type || "story", // Mặc định là story nếu không có type
    };
  });

  // Tạo MiniSearch instance mới
  const miniSearch = new MiniSearch({
    fields: [
      "title",
      "author",
      "normalizedTitle",
      "normalizedAuthor",
      "genres",
    ],
    storeFields: [
      "title",
      "author",
      "slug",
      "genres",
      "type",
      "coverImage",
      "id",
    ],
    searchOptions: {
      boost: {
        title: 2,
        normalizedTitle: 1.5,
        author: 1,
        normalizedAuthor: 0.8,
      },
      prefix: true,
      fuzzy: 0.2,
    },
    extractField: (document, fieldName) => {
      // Xử lý đặc biệt cho genres vì nó có thể là array hoặc string
      if (fieldName === "genres") {
        if (typeof document.genres === "string") {
          return document.genres;
        } else if (Array.isArray(document.genres)) {
          return document.genres.join(" ");
        }
        return "";
      }
      return document[fieldName as keyof typeof document] as string;
    },
  });

  // Thêm items vào index
  miniSearch.addAll(processedItems);

  // Lưu vào biến global
  searchIndex = miniSearch;

  return miniSearch;
}

// Hàm tìm kiếm sử dụng MiniSearch
export function search(query: string, limit: number = 20): any[] {
  if (!searchIndex) {
    throw new Error("Search index not initialized");
  }

  // Tìm kiếm bằng cả từ khóa gốc và từ khóa không dấu
  const normalizedQuery = removeVietnameseAccents(query);

  // Tìm kiếm với cả query gốc và query đã remove dấu
  const results = searchIndex.search(`${query} ${normalizedQuery}`, {
    boost: { title: 2, normalizedTitle: 1.5 },
    fuzzy: 0.2,
    prefix: true,
  });

  return results.slice(0, limit);
}

// Hàm gợi ý từ khóa tìm kiếm
export function autoSuggest(query: string, limit: number = 5): string[] {
  if (!searchIndex || !query || query.length < 2) return [];

  const normalizedQuery = removeVietnameseAccents(query);

  // Tìm kiếm với cả query gốc và query đã remove dấu
  const results = searchIndex.search(`${query} ${normalizedQuery}`, {
    boost: { title: 3, normalizedTitle: 2 },
    fuzzy: 0.2,
    prefix: true,
  });

  // Lấy các tiêu đề khác nhau từ kết quả tìm kiếm
  const suggestions = [
    ...new Set(results.slice(0, limit * 2).map((item) => item.title)),
  ].slice(0, limit);

  return suggestions;
}

// Thêm items mới vào index hiện có
export function addToSearchIndex(items: SearchableItem[]): void {
  if (!searchIndex) {
    createSearchIndex(items);
    return;
  }

  // Chuẩn bị dữ liệu
  const processedItems = items.map((item) => ({
    ...item,
    genres:
      typeof item.genres === "string"
        ? item.genres
            .split(",")
            .map((g) => g.trim())
            .filter(Boolean)
        : item.genres || [],
    normalizedTitle: removeVietnameseAccents(item.title),
    normalizedAuthor: removeVietnameseAccents(item.author),
    type: item.type || "story",
  }));

  // Thêm vào index
  searchIndex.addAll(processedItems);
}

// Xoá một item khỏi index
export function removeFromSearchIndex(id: string | number): void {
  if (!searchIndex) return;
  searchIndex.remove({ id } as SearchableItem);
}
