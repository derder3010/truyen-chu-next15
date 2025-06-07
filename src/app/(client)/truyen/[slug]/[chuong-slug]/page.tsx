import React from "react";
import Link from "next/link";
import { Metadata, ResolvingMetadata } from "next";
import { MOCK_STORIES, MOCK_CHAPTERS } from "@/lib/constants";
import NotFoundPage from "@/app/NotFound";
import ChapterNavigation from "@/components/ChapterNavigation";
import KeyboardNavigation from "@/components/KeyboardNavigation";
import ReadingHistoryTracker from "@/components/ReadingHistoryTracker";
import FontSizeScript from "@/components/FontSizeScript";

type PageParams = Promise<{
  slug: string;
  "chuong-slug": string;
}>;

// Generate metadata for SEO
export async function generateMetadata(
  { params }: { params: PageParams },
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Await the params promise
  const { slug: storySlug, "chuong-slug": chapterNumber } = await params;

  // Get story and chapter data
  const story = MOCK_STORIES.find((s) => s.slug === storySlug);
  const currentChapterNum = parseInt(chapterNumber || "0", 10);
  const chapter = MOCK_CHAPTERS.find(
    (c) => c.storySlug === storySlug && c.chapterNumber === currentChapterNum
  );

  // Get parent metadata (default values)
  const previousImages = (await parent).openGraph?.images || [];

  if (!story || !chapter) {
    return {
      title: "Chapter Not Found",
      description: "The requested chapter could not be found.",
    };
  }

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
        chapter.chapterNumber
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

export default async function ChapterPage({ params }: { params: PageParams }) {
  // Await the params Promise
  const { slug: storySlug, "chuong-slug": chapterNumber } = await params;

  const story = MOCK_STORIES.find((s) => s.slug === storySlug);
  const currentChapterNum = parseInt(chapterNumber || "0", 10);
  const chapter = MOCK_CHAPTERS.find(
    (c) => c.storySlug === storySlug && c.chapterNumber === currentChapterNum
  );

  const storyChapters = MOCK_CHAPTERS.filter(
    (c) => c.storySlug === storySlug
  ).sort((a, b) => a.chapterNumber - b.chapterNumber);
  const currentIndex = storyChapters.findIndex(
    (c) => c.chapterNumber === currentChapterNum
  );

  const prevChapter = currentIndex > 0 ? storyChapters[currentIndex - 1] : null;
  const nextChapter =
    currentIndex < storyChapters.length - 1
      ? storyChapters[currentIndex + 1]
      : null;

  if (!story || !chapter) {
    return <NotFoundPage />;
  }

  return (
    <div className="mx-auto p-4 sm:p-6 md:p-8 max-w-[95%] md:min-w-[85%] xl:min-w-[80%]">
      {/* Font size script moved to client component */}
      <FontSizeScript />

      {/* Track reading history with client component */}
      {story && chapter && (
        <ReadingHistoryTracker
          story={story}
          storySlug={storySlug}
          chapter={chapter}
          currentChapterNum={currentChapterNum}
        />
      )}

      <div className="mb-6 pb-4 border-b border-base-300">
        <Link href={`/truyen/${storySlug}`} className="text-sm hover:underline">
          {story.title}
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold mt-1">
          Chương {chapter.chapterNumber}: {chapter.title}
        </h1>
        <p className="text-xs mt-1 opacity-70">
          Ngày đăng: {chapter.publishedDate}
        </p>
      </div>

      <KeyboardNavigation
        storySlug={storySlug}
        currentChapterNum={currentChapterNum}
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

      {/* Chapter Content */}
      <div className="w-full pb-16 sm:pb-0 min-h-screen">
        <div
          id="chapter-content"
          className="chapter-content-text chapter-content"
          dangerouslySetInnerHTML={{
            __html: chapter.content,
          }}
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
      <div className="hidden sm:block p-4">
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
