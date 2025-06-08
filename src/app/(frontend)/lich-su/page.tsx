import React from "react";
import { Metadata } from "next";
import HistoryClientPage from "@/components/HistoryClientPage";

// Metadata cho trang lịch sử đọc
export const metadata: Metadata = {
  title: "Lịch sử đọc truyện | Doctruyenfull.vn",
  description:
    "Theo dõi lịch sử đọc truyện của bạn. Dễ dàng tiếp tục đọc những truyện bạn đã bắt đầu.",
  keywords: ["lịch sử đọc", "đọc tiếp", "truyện đã đọc", "truyện gần đây"],
  openGraph: {
    title: "Lịch sử đọc truyện | Doctruyenfull.vn",
    description:
      "Theo dõi lịch sử đọc truyện của bạn. Dễ dàng tiếp tục đọc những truyện bạn đã bắt đầu.",
    url: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/lich-su`,
    siteName: "Doctruyenfull.vn",
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Lịch sử đọc truyện | Doctruyenfull.vn",
    description:
      "Theo dõi lịch sử đọc truyện của bạn. Dễ dàng tiếp tục đọc những truyện bạn đã bắt đầu.",
  },
};

export default async function HistoryPage() {
  // Có thể thực hiện các tác vụ async chuẩn bị dữ liệu ở đây nếu cần
  // Ví dụ: Lấy dữ liệu đề xuất dựa trên hành vi đọc của người dùng

  return <HistoryClientPage />;
}
