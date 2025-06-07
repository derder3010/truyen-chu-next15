import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import {
  MOCK_STORIES,
  MOCK_CHAPTERS,
  LATEST_CHAPTERS_HOME_COUNT,
  FEATURED_STORIES_HOME_COUNT,
} from "@/lib/constants";
import { Chapter, Story } from "@/types";
import FeaturedStories from "@/components/FeaturedStories";
import LatestChapters from "@/components/LatestChapters";

// Metadata tĩnh cho trang chủ
export const metadata: Metadata = {
  title: "TruyệnCV - Đọc truyện online, truyện chữ hay",
  description:
    "Đọc truyện online, truyện hay. Truyện được cập nhật liên tục, nhiều thể loại, nhiều tác giả.",
  keywords: [
    "đọc truyện online",
    "truyện chữ",
    "truyện hay",
    "tiểu thuyết",
    "truyện ngôn tình",
    "truyện kiếm hiệp",
    "truyện tiên hiệp",
    "truyện xuyên không",
  ],
  openGraph: {
    title: "TruyệnCV - Đọc truyện online, truyện chữ hay",
    description:
      "Đọc truyện online, truyện hay. Truyện được cập nhật liên tục, nhiều thể loại, nhiều tác giả.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://truyen-cv.vercel.app",
    siteName: "TruyệnCV",
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TruyệnCV - Đọc truyện online, truyện chữ hay",
    description:
      "Đọc truyện online, truyện hay. Truyện được cập nhật liên tục, nhiều thể loại, nhiều tác giả.",
  },
  alternates: {
    canonical:
      process.env.NEXT_PUBLIC_SITE_URL || "https://truyen-cv.vercel.app",
  },
};

export default async function HomePage() {
  // Trong một ứng dụng thực tế, đây là nơi bạn sẽ fetch dữ liệu từ API
  const featuredStories = MOCK_STORIES.slice(0, FEATURED_STORIES_HOME_COUNT);

  // Get latest chapters from different stories
  const latestChaptersMap = new Map<string, Chapter>();
  [...MOCK_CHAPTERS]
    .sort(
      (a, b) =>
        new Date(b.publishedDate).getTime() -
          new Date(a.publishedDate).getTime() ||
        b.chapterNumber - a.chapterNumber
    ) // Sort by date then chapter num
    .forEach((chapter) => {
      if (
        !latestChaptersMap.has(chapter.storySlug) &&
        latestChaptersMap.size < LATEST_CHAPTERS_HOME_COUNT
      ) {
        latestChaptersMap.set(chapter.storySlug, chapter);
      }
    });
  const latestUniqueChapters = Array.from(latestChaptersMap.values());

  const getStoryBySlug = (slug: string): Story | undefined =>
    MOCK_STORIES.find((s) => s.slug === slug);

  return (
    <div>
      {/* Hero Section */}
      <section className="hero bg-base-200 rounded-box mb-8">
        <div className="hero-content text-center py-8">
          <div className="max-w-md">
            <h1 className="text-3xl md:text-4xl font-bold">TruyệnCV</h1>
            <p className="py-6">
              Đọc truyện online, truyện hay. Truyện được cập nhật liên tục,
              nhiều thể loại, nhiều tác giả.
            </p>
            <div className="flex gap-2 justify-center">
              <Link href="/truyen" className="btn btn-primary">
                Thư Viện Truyện
              </Link>
              <Link href="/bang-xep-hang" className="btn btn-outline">
                Bảng Xếp Hạng
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-8">
        <FeaturedStories stories={featuredStories} />
        <LatestChapters
          chapters={latestUniqueChapters}
          getStoryBySlug={getStoryBySlug}
        />
      </div>
    </div>
  );
}
