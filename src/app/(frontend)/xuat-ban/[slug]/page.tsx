import React from "react";
import { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import BookDetailPage from "@/components/LicensedAndEbookComponents/BookDetailPage";
import { APP_CONFIG } from "@/lib/config";

// Add ISR with 2-hour revalidation
export const revalidate = 7200;

type Props = {
  params: { slug: string };
};

// Custom function để lấy thông tin truyện bản quyền theo slug
async function getLicensedStoryBySlug(slug: string) {
  try {
    // Lấy origin URL từ environment
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000");

    // Sử dụng API endpoint đúng format
    const url = new URL(`/api/licensed-stories/${slug}`, origin);

    const response = await fetch(url.toString(), {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return {
      ...data.story,
      genres: data.story.genres
        ? data.story.genres.split(",").map((g: string) => g.trim())
        : [],
      purchaseLinks: data.story.purchaseLinks || [],
    };
  } catch (error) {
    console.error("Error fetching licensed story:", error);
    return null;
  }
}

// Generate metadata cho trang chi tiết truyện bản quyền
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Await the params object before using its properties
  const slug = (await params).slug;

  // Lấy thông tin truyện từ API
  const story = await getLicensedStoryBySlug(slug);

  // Get parent metadata (default values)
  const previousImages = (await parent).openGraph?.images || [];

  if (!story) {
    return {
      title: "Truyện không tồn tại",
      description: "Không tìm thấy truyện yêu cầu.",
    };
  }

  const title = `${story.title} - ${story.author}`;
  const description = story.description
    ? story.description.substring(0, 160)
    : `Truyện bản quyền "${story.title}" của tác giả ${story.author}`;

  return {
    title,
    description,
    keywords: [
      story.title,
      story.author,
      "truyện bản quyền",
      "truyện xuất bản",
      ...(story.genres || []),
    ],
    openGraph: {
      title,
      description,
      url: `${APP_CONFIG.SITE_URL}/xuat-ban/${slug}`,
      siteName: APP_CONFIG.APP_NAME,
      locale: "vi_VN",
      type: "book",
      authors: [story.author],
      images: story.coverImage
        ? [story.coverImage, ...previousImages]
        : previousImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: story.coverImage ? [story.coverImage] : [],
    },
  };
}

export default async function LicensedStoryDetailPage({ params }: Props) {
  // Await the params object before using its properties
  const slug = (await params).slug;

  // Lấy thông tin truyện từ API
  const story = await getLicensedStoryBySlug(slug);

  // Nếu không tìm thấy truyện, trả về trang 404
  if (!story) {
    notFound();
  }

  return <BookDetailPage book={story} type="licensed" />;
}
