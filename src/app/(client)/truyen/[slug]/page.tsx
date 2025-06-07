import React from "react";
import { Metadata, ResolvingMetadata } from "next";
import { MOCK_STORIES, MOCK_CHAPTERS } from "@/lib/constants";
import StoryClientPage from "@/components/StoryClientPage";

type PageParams = Promise<{ slug: string }>;

// Generate metadata for SEO
export async function generateMetadata(
  { params }: { params: PageParams },
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Await the params promise
  const { slug } = await params;

  // Get story data
  const story = MOCK_STORIES.find((s) => s.slug === slug);

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

export default async function StoryDetailPage({
  params,
}: {
  params: PageParams;
}) {
  // Await the params Promise
  const { slug } = await params;

  // Get data on the server
  const story = MOCK_STORIES.find((s) => s.slug === slug);
  const chapters = MOCK_CHAPTERS.filter((c) => c.storySlug === slug).sort(
    (a, b) => a.chapterNumber - b.chapterNumber
  );

  // Pass data to client component
  return <StoryClientPage story={story} chapters={chapters} />;
}
