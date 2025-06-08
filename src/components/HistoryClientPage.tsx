"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import ClockIcon from "@/components/icons/ClockIcon";

interface HistoryItem {
  storyId: string;
  storySlug: string;
  storyTitle: string;
  chapterId: string;
  chapterNumber: number;
  chapterTitle: string;
  timestamp: number;
}

// Name for localStorage key
const READING_HISTORY_KEY = "reading_history";

const HistoryClientPage: React.FC = () => {
  const [readingHistory, setReadingHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    // Đọc lịch sử đọc từ localStorage khi component mount
    const getReadingHistory = () => {
      try {
        const saved = localStorage.getItem(READING_HISTORY_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as HistoryItem[];

          // Filter to keep only the most recent chapter for each story
          const uniqueStories = new Map<string, HistoryItem>();

          parsed.forEach((item) => {
            if (
              !uniqueStories.has(item.storyId) ||
              uniqueStories.get(item.storyId)!.timestamp < item.timestamp
            ) {
              uniqueStories.set(item.storyId, item);
            }
          });

          // Convert back to array and sort by timestamp (most recent first)
          const filteredHistory = Array.from(uniqueStories.values()).sort(
            (a, b) => b.timestamp - a.timestamp
          );

          setReadingHistory(filteredHistory);
        }
      } catch (error) {
        console.error("Failed to load reading history:", error);
      }
    };

    getReadingHistory();
  }, []);

  // Format timestamp to human readable format
  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diffInSeconds = Math.floor((now - timestamp) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds} giây trước`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)} phút trước`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    } else {
      return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
    }
  };

  // Clear reading history
  const clearHistory = () => {
    try {
      localStorage.removeItem(READING_HISTORY_KEY);
      setReadingHistory([]);
    } catch (error) {
      console.error("Failed to clear reading history:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-2xl font-bold">Lịch Sử Đọc Truyện</h1>
        <div className="h-1 flex-1 bg-primary opacity-20 rounded-full hidden md:block"></div>
      </div>

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <div className="flex justify-between items-center">
            <p className="text-sm opacity-70">
              Theo dõi những truyện bạn đã đọc gần đây.
            </p>
            {readingHistory.length > 0 && (
              <button
                onClick={clearHistory}
                className="btn btn-sm btn-outline btn-error"
              >
                Xoá Lịch Sử
              </button>
            )}
          </div>

          {readingHistory.length > 0 ? (
            <ul className="divide-y divide-base-300">
              {readingHistory.map((item) => (
                <li key={item.storyId} className="py-4">
                  <Link
                    href={`/truyen/${item.storySlug}/${item.chapterNumber}`}
                    className="block hover:bg-base-200 p-2 -m-2 rounded-lg transition-colors"
                  >
                    <p className="font-medium text-primary hover:underline">
                      {item.storyTitle}
                    </p>
                    <p className="text-sm opacity-70">
                      Chương {item.chapterNumber}: {item.chapterTitle}
                    </p>
                    <p className="text-xs opacity-60 mt-1">
                      {formatTimeAgo(item.timestamp)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-8 text-center">
              <div className="flex justify-center">
                <ClockIcon className="w-16 h-16 opacity-30 mb-4" />
              </div>
              <h2 className="text-xl font-medium mb-2">
                Lịch sử đọc của bạn trống.
              </h2>
              <p className="text-sm opacity-70">
                Hãy bắt đầu đọc truyện để xem lịch sử tại đây.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryClientPage;
