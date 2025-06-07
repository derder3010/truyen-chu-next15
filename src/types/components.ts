import { Chapter } from "./index";

export interface ReadingHistoryTrackerProps {
  story: {
    id: string;
    title: string;
  };
  storySlug: string;
  chapter: {
    id: string;
    title: string;
  };
  currentChapterNum: number;
}

export interface HistoryItem {
  storyId: string;
  storySlug: string;
  storyTitle: string;
  chapterId: string;
  chapterNumber: number;
  chapterTitle: string;
  timestamp: number;
}

export interface ChapterNavigationProps {
  storySlug: string;
  currentChapter: Chapter;
  prevChapter: Chapter | null;
  nextChapter: Chapter | null;
  allChapters: Chapter[];
  isMobile?: boolean;
}

export interface KeyboardNavigationProps {
  storySlug: string;
  currentChapterNum: number;
  prevChapter: Chapter | null;
  nextChapter: Chapter | null;
}
