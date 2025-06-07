"use client";

import { useEffect } from "react";
import { ReadingHistoryTrackerProps, HistoryItem } from "@/types/components";

// Constants
const READING_HISTORY_KEY = "reading_history";
const MAX_HISTORY_ITEMS = 10;

const ReadingHistoryTracker: React.FC<ReadingHistoryTrackerProps> = ({
  story,
  storySlug,
  chapter,
  currentChapterNum,
}) => {
  // Lưu lịch sử đọc vào localStorage
  useEffect(() => {
    const saveToHistory = () => {
      try {
        // Tạo item lịch sử mới
        const historyItem: HistoryItem = {
          storyId: story.id,
          storySlug: storySlug,
          storyTitle: story.title,
          chapterId: chapter.id,
          chapterNumber: currentChapterNum,
          chapterTitle: chapter.title,
          timestamp: Date.now(),
        };

        // Đọc lịch sử hiện tại
        let history: HistoryItem[] = [];
        const saved = localStorage.getItem(READING_HISTORY_KEY);
        if (saved) {
          history = JSON.parse(saved);
        }

        // Xóa truyện này nếu đã có trong lịch sử để tránh trùng lặp
        history = history.filter(
          (item) =>
            !(
              item.storySlug === storySlug &&
              item.chapterNumber === currentChapterNum
            )
        );

        // Thêm item mới vào đầu danh sách
        history.unshift(historyItem);

        // Giới hạn số lượng item lưu trữ
        if (history.length > MAX_HISTORY_ITEMS) {
          history = history.slice(0, MAX_HISTORY_ITEMS);
        }

        // Lưu lại vào localStorage
        localStorage.setItem(READING_HISTORY_KEY, JSON.stringify(history));
      } catch (error) {
        console.error("Failed to save reading history:", error);
      }
    };

    // Lưu lịch sử khi component mount
    saveToHistory();
  }, [story, chapter, storySlug, currentChapterNum]);

  // This component doesn't render anything visible
  return null;
};

export default ReadingHistoryTracker;
