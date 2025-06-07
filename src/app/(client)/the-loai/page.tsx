import React from "react";
import { Metadata } from "next";
import { GENRES_LIST } from "@/lib/constants";
import CategoryClientPage from "@/components/CategoryClientPage";

type PageProps = {
  searchParams: { tag?: string };
};

// Generate metadata cho trang thể loại
export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  // Ensure searchParams is awaited
  const params = await searchParams;
  const selectedGenre = params.tag;

  // Metadata mặc định
  let title = "Thể loại truyện | TruyệnCV";
  let description =
    "Khám phá truyện theo thể loại yêu thích. Tổng hợp đầy đủ các thể loại truyện chữ trên TruyệnCV.";

  // Nếu có thể loại được chọn, cập nhật metadata phù hợp
  if (selectedGenre) {
    title = `Truyện thể loại ${selectedGenre} | TruyệnCV`;
    description = `Đọc truyện thể loại ${selectedGenre} hay nhất. Tổng hợp danh sách truyện ${selectedGenre} đầy đủ, cập nhật liên tục trên TruyệnCV.`;
  }

  return {
    title,
    description,
    keywords: [
      ...GENRES_LIST,
      "thể loại truyện",
      "đọc truyện theo thể loại",
      selectedGenre || "",
    ].filter(Boolean),
    openGraph: {
      title,
      description,
      url: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/the-loai${
        selectedGenre ? `?tag=${encodeURIComponent(selectedGenre)}` : ""
      }`,
      siteName: "TruyệnCV",
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

export default async function CategoryPage() {
  // CategoryClientPage là client component và sử dụng useSearchParams() để lấy tag
  return <CategoryClientPage />;
}
