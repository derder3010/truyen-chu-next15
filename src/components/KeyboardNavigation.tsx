"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { KeyboardNavigationProps } from "@/types";

const KeyboardNavigation: React.FC<KeyboardNavigationProps> = ({
  storySlug,
  currentChapterNum,
  prevChapter,
  nextChapter,
}) => {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" && prevChapter) {
        router.push(`/truyen/${storySlug}/${prevChapter.chapterNumber}`);
      } else if (event.key === "ArrowRight" && nextChapter) {
        router.push(`/truyen/${storySlug}/${nextChapter.chapterNumber}`);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [router, storySlug, currentChapterNum, prevChapter, nextChapter]);

  return null;
};

export default KeyboardNavigation;
