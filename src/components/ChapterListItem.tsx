import React from "react";
import Link from "next/link";
import { Chapter } from "@/types";

interface ChapterListItemProps {
  chapter: Chapter;
  storySlug: string;
}

const ChapterListItem: React.FC<ChapterListItemProps> = ({
  chapter,
  storySlug,
}) => {
  return (
    <Link
      href={`/truyen/${storySlug}/${chapter.chapterNumber}`}
      className="block hover:bg-base-200 transition-colors"
    >
      <div className="flex justify-between items-center px-4 py-3">
        <span className="text-sm truncate hover:text-primary">
          {chapter.title}
        </span>
        <span className="text-xs opacity-60 ml-2 whitespace-nowrap">
          {chapter.publishedDate}
        </span>
      </div>
    </Link>
  );
};

export default ChapterListItem;
