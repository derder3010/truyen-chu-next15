import React from "react";
import Link from "next/link";
import { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import ChapterNavigation from "@/components/ChapterNavigation";
import KeyboardNavigation from "@/components/KeyboardNavigation";
import ReadingHistoryTracker from "@/components/ReadingHistoryTracker";
import FontSizeScript from "@/components/FontSizeScript";
import ChapterContentWrapper from "@/components/ChapterContentWrapper";
import {
  getStoryBySlug,
  getChaptersByStoryId,
  getChapterBySlug,
} from "@/lib/api";

// Add ISR with 2-hour revalidation
export const revalidate = 7200; // 2 hours in seconds

type Props = {
  params: {
    slug: string;
    "chuong-slug": string;
  };
};

// Generate metadata for SEO
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug: storySlug, "chuong-slug": chapterSlug } = await params;

  // Get story data
  const story = await getStoryBySlug(storySlug);
  if (!story) {
    return {
      title: "Story Not Found",
      description: "The requested story could not be found.",
    };
  }

  // Get chapter data
  const chapter = await getChapterBySlug(Number(story.id), chapterSlug);
  if (!chapter) {
    return {
      title: "Chapter Not Found",
      description: "The requested chapter could not be found.",
    };
  }

  // Get parent metadata (default values)
  const previousImages = (await parent).openGraph?.images || [];

  const title = `Chương ${chapter.chapterNumber}: ${chapter.title} | ${story.title}`;
  const description = `Đọc truyện ${story.title} - Chương ${
    chapter.chapterNumber
  }: ${chapter.title}. ${story.description?.substring(0, 150)}...`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/truyen/${storySlug}/${
        chapter.slug || `chuong-${chapter.chapterNumber}`
      }`,
      siteName: "Truyện Chữ",
      locale: "vi_VN",
      type: "article",
      publishedTime: chapter.publishedDate,
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

export default async function ChapterPage({ params }: Props) {
  const { slug: storySlug, "chuong-slug": chapterSlug } = await params;

  // Get story data
  const story = await getStoryBySlug(storySlug);
  if (!story) {
    return notFound();
  }

  // Get current chapter using slug
  const chapter = await getChapterBySlug(Number(story.id), chapterSlug);
  if (!chapter) {
    return notFound();
  }

  // Get all chapters for navigation - set limit to a large number to get all chapters
  // or multiply by total chapters to ensure we get all
  const chaptersData = await getChaptersByStoryId(
    Number(story.id),
    1,
    story.totalChapters > 0 ? story.totalChapters : 1000
  );

  const storyChapters = chaptersData.chapters.sort(
    (a, b) => a.chapterNumber - b.chapterNumber
  );

  const currentIndex = storyChapters.findIndex(
    (c) => c.chapterNumber === chapter.chapterNumber
  );

  const prevChapter = currentIndex > 0 ? storyChapters[currentIndex - 1] : null;
  const nextChapter =
    currentIndex < storyChapters.length - 1
      ? storyChapters[currentIndex + 1]
      : null;

  return (
    <div className="mx-auto p-4 sm:p-6 md:p-8 max-w-[95%] md:min-w-[85%] xl:min-w-[80%]">
      {/* Font size script moved to client component */}
      <FontSizeScript />

      {/* Track reading history with client component */}
      <ReadingHistoryTracker
        story={story}
        storySlug={storySlug}
        chapter={chapter}
        currentChapterNum={chapter.chapterNumber}
      />

      <div className="mb-6 pb-4 border-b border-base-300">
        <Link
          href={`/truyen/${storySlug}`}
          className="text-sm font-bold border-b hover:text-primary"
        >
          &larr; {story.title}
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold mt-1">{chapter.title}</h1>
        {/* <p className="text-xs mt-1 opacity-70">
          Ngày đăng: {chapter.publishedDate}
        </p> */}
      </div>

      <KeyboardNavigation
        storySlug={storySlug}
        currentChapterNum={chapter.chapterNumber}
        prevChapter={prevChapter}
        nextChapter={nextChapter}
      />

      {/* Desktop Navigation */}
      <div className="hidden sm:block">
        <ChapterNavigation
          storySlug={storySlug}
          currentChapter={chapter}
          prevChapter={prevChapter}
          nextChapter={nextChapter}
          allChapters={storyChapters}
        />
      </div>

      {/* Chapter Content with Advertisement Wrapper */}
      <div className="w-full pb-16 sm:pb-0 min-h-screen">
        <ChapterContentWrapper
          content={chapter.content}
          chapterNumber={chapter.chapterNumber}
        />
      </div>

      {/* Mobile Navigation */}
      <div className="sm:hidden">
        <ChapterNavigation
          storySlug={storySlug}
          currentChapter={chapter}
          prevChapter={prevChapter}
          nextChapter={nextChapter}
          allChapters={storyChapters}
          isMobile={true}
        />
      </div>

      {/* Desktop Bottom Navigation */}
      <div className="hidden sm:block pt-4">
        <ChapterNavigation
          storySlug={storySlug}
          currentChapter={chapter}
          prevChapter={prevChapter}
          nextChapter={nextChapter}
          allChapters={storyChapters}
        />
      </div>
    </div>
  );
}
