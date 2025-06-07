import React from "react";
import { Metadata } from "next";
import SearchClientPage from "@/components/SearchClientPage";

// Metadata cho trang tìm kiếm
export const metadata: Metadata = {
  title: "Tìm kiếm truyện | TruyệnCV",
  description:
    "Tìm kiếm truyện theo tên, tác giả, thể loại. Khám phá kho tàng truyện đa dạng tại TruyệnCV.",
  keywords: [
    "tìm kiếm truyện",
    "search",
    "truyện chữ",
    "truyện hay",
    "tìm kiếm",
  ],
  openGraph: {
    title: "Tìm kiếm truyện | TruyệnCV",
    description:
      "Tìm kiếm truyện theo tên, tác giả, thể loại. Khám phá kho tàng truyện đa dạng tại TruyệnCV.",
    url: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/tim-kiem`,
    siteName: "TruyệnCV",
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Tìm kiếm truyện | TruyệnCV",
    description:
      "Tìm kiếm truyện theo tên, tác giả, thể loại. Khám phá kho tàng truyện đa dạng tại TruyệnCV.",
  },
};

export default async function SearchPage() {
  // Có thể thực hiện các hoạt động chuẩn bị dữ liệu nếu cần
  // Ví dụ: chuẩn bị các danh mục tìm kiếm phổ biến từ server

  return <SearchClientPage />;
}
