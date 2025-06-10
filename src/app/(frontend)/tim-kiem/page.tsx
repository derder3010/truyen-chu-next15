import React from "react";
import { Metadata } from "next";
import SearchClientPage from "@/components/SearchClientPage";
import { APP_CONFIG } from "@/lib/config";
import { getStories } from "@/lib/api";

// Metadata cho trang tìm kiếm
export const metadata: Metadata = {
  title: `Tìm kiếm truyện | ${APP_CONFIG.APP_NAME}`,
  description:
    "Tìm kiếm truyện, truyện bản quyền và ebook theo tên, tác giả, thể loại. Khám phá kho tàng truyện đa dạng.",
  keywords: [
    "tìm kiếm truyện",
    "search",
    "truyện chữ",
    "truyện hay",
    "tìm kiếm",
    "ebook",
    "truyện bản quyền",
  ],
  openGraph: {
    title: `Tìm kiếm truyện | ${APP_CONFIG.APP_NAME}`,
    description:
      "Tìm kiếm truyện, truyện bản quyền và ebook theo tên, tác giả, thể loại. Khám phá kho tàng truyện đa dạng.",
    url: `${APP_CONFIG.SITE_URL}/tim-kiem`,
    siteName: APP_CONFIG.APP_NAME,
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: `Tìm kiếm truyện | ${APP_CONFIG.APP_NAME}`,
    description:
      "Tìm kiếm truyện, truyện bản quyền và ebook theo tên, tác giả, thể loại. Khám phá kho tàng truyện đa dạng.",
  },
};

export default async function SearchPage() {
  // Lấy tất cả truyện từ API để có thể tìm kiếm
  const { stories } = await getStories(1, 100); // Lấy 100 truyện để tìm kiếm (có thể điều chỉnh số lượng)

  return (
    <div className="container mx-auto py-6 px-4">
      <SearchClientPage initialStories={stories} />
    </div>
  );
}
