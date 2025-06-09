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

// Custom function để lấy thông tin ebook theo slug
async function getEbookBySlug(slug: string) {
  try {
    // Lấy origin URL từ environment
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000");

    // Sử dụng API endpoint đúng format
    const url = new URL(`/api/ebooks/${slug}`, origin);

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
    console.error("Error fetching ebook:", error);
    return null;
  }
}

// Generate metadata cho trang chi tiết ebook
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Await the params object before using its properties
  const slug = (await params).slug;

  // Lấy thông tin ebook từ API
  const story = await getEbookBySlug(slug);

  // Get parent metadata (default values)
  const previousImages = (await parent).openGraph?.images || [];

  if (!story) {
    return {
      title: "Ebook không tồn tại",
      description: "Không tìm thấy ebook yêu cầu.",
    };
  }

  const title = `${story.title} - ${story.author} | Ebook`;
  const description = story.description
    ? story.description.substring(0, 160)
    : `Ebook "${story.title}" của tác giả ${story.author}`;

  return {
    title,
    description,
    keywords: [
      story.title,
      story.author,
      "ebook",
      "sách điện tử",
      ...(story.genres || []),
    ],
    openGraph: {
      title,
      description,
      url: `${APP_CONFIG.SITE_URL}/ebook/${slug}`,
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

export default async function EbookDetailPage({ params }: Props) {
  // Await the params object before using its properties
  const slug = (await params).slug;

  // Lấy thông tin ebook từ API
  const story = await getEbookBySlug(slug);

  // Nếu không tìm thấy ebook, trả về trang 404
  if (!story) {
    notFound();
  }

  return <BookDetailPage book={story} type="ebook" />;
}
