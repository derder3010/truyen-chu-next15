import React from "react";
// import Link from "next/link";
import { Metadata } from "next";
import { PAGINATION, APP_CONFIG } from "@/lib/config";
import { Story } from "@/types";
import FeaturedStories from "@/components/FeaturedStories";
import LatestChapters from "@/components/LatestChapters";
import { getFeaturedStories, getLatestChapters } from "@/lib/api";

// Metadata tĩnh cho trang chủ
export const metadata: Metadata = {
  title: `${APP_CONFIG.APP_NAME} - Đọc truyện online, truyện chữ hay`,
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
    title: `${APP_CONFIG.APP_NAME} - Đọc truyện online, truyện chữ hay`,
    description:
      "Đọc truyện online, truyện hay. Truyện được cập nhật liên tục, nhiều thể loại, nhiều tác giả.",
    url: APP_CONFIG.SITE_URL,
    siteName: APP_CONFIG.APP_NAME,
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_CONFIG.APP_NAME} - Đọc truyện online, truyện chữ hay`,
    description:
      "Đọc truyện online, truyện hay. Truyện được cập nhật liên tục, nhiều thể loại, nhiều tác giả.",
  },
  alternates: {
    canonical: APP_CONFIG.SITE_URL,
  },
};

export default async function HomePage() {
  // Fetch data from the database using our server actions
  const featuredStories = await getFeaturedStories(
    PAGINATION.FEATURED_STORIES_HOME_COUNT
  );
  const latestChapters = await getLatestChapters(
    PAGINATION.LATEST_CHAPTERS_HOME_COUNT
  );

  // Create a function to get story by slug from the latest chapters
  const getStoryBySlug = (slug: string): Story | undefined => {
    const chapter = latestChapters.find((ch) => ch.storySlug === slug);
    if (!chapter) return undefined;

    // Find the story in featured stories first
    const story = featuredStories.find((s) => s.slug === slug);
    if (story) return story;

    // If not found, create a minimal story object with the information we have
    return {
      id: chapter.storyId,
      title: "Unknown", // Will be populated from the database when viewing the story
      author: "Unknown",
      coverImage: "https://picsum.photos/seed/default/300/450",
      genres: [],
      description: "",
      status: "Đang tiến hành",
      totalChapters: 0,
      views: 0,
      rating: 0,
      lastUpdated: chapter.publishedDate,
      slug: chapter.storySlug,
    };
  };

  return (
    <div>
      {/* Hero Section */}
      {/* <section className="hero bg-base-200 rounded-box mb-8">
        <div className="hero-content text-center py-8">
          <div className="max-w-md">
            <h1 className="text-3xl md:text-4xl font-bold">
              {APP_CONFIG.APP_NAME}
            </h1>
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
      </section> */}

      <div className="space-y-8">
        <FeaturedStories stories={featuredStories} />
        <LatestChapters
          chapters={latestChapters}
          getStoryBySlug={getStoryBySlug}
        />
      </div>
    </div>
  );
}
