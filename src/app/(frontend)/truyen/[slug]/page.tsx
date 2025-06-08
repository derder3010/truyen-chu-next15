import React from "react";
import { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import StoryClientPage from "@/components/StoryClientPage";
import { getStoryBySlug, getChaptersByStoryId } from "@/lib/api";
import { PAGINATION } from "@/lib/config";

type Props = {
  params: { slug: string };
  searchParams: { page?: string };
};

// Generate metadata for SEO
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = params;

  // Get story data from the database
  const story = await getStoryBySlug(slug);

  // Get parent metadata (default values)
  const previousImages = (await parent).openGraph?.images || [];

  if (!story) {
    return {
      title: "Story Not Found",
      description: "The requested story could not be found.",
    };
  }

  const title = `${story.title} - ${story.author}`;
  const description = story.description
    ? story.description.substring(0, 160)
    : `Đọc truyện ${story.title} của tác giả ${story.author} tại Truyện Chữ`;

  return {
    title,
    description,
    keywords: [story.title, story.author, ...story.genres],
    openGraph: {
      title,
      description,
      url: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/truyen/${slug}`,
      siteName: "Truyện Chữ",
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

export default async function StoryDetailPage({ params, searchParams }: Props) {
  const { slug } = params;
  const pageParam = searchParams.page;
  const currentPage = pageParam ? parseInt(pageParam, 10) : 1;

  // Get data from the database
  const story = await getStoryBySlug(slug);

  // If story doesn't exist, return 404
  if (!story) {
    notFound();
  }

  // Get chapters for this story with pagination
  const chaptersData = await getChaptersByStoryId(
    Number(story.id),
    currentPage,
    PAGINATION.CHAPTERS_PER_PAGE
  );

  // Pass data to client component with pagination info
  return (
    <StoryClientPage
      story={story}
      chapters={chaptersData.chapters}
      pagination={chaptersData.pagination}
      currentPage={currentPage}
    />
  );
}
