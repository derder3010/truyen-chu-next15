"use client";

import React, { useState } from "react";
import { CHAPTERS_PER_PAGE } from "@/lib/constants";
import ChapterListItem from "@/components/ChapterListItem";
import NotFoundPage from "@/app/NotFound";
import Pagination from "@/components/Pagination";
import StoryDetails from "@/components/StoryDetails";
import { Chapter, Story } from "@/types";

interface StoryClientPageProps {
  story: Story | undefined;
  chapters: Chapter[];
}

export default function StoryClientPage({
  story,
  chapters,
}: StoryClientPageProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Handle not found case
  if (!story) {
    return <NotFoundPage />;
  }

  const totalPages = Math.ceil(chapters.length / CHAPTERS_PER_PAGE);
  const currentChapters = chapters.slice(
    (currentPage - 1) * CHAPTERS_PER_PAGE,
    currentPage * CHAPTERS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

  return (
    <div className="space-y-6">
      <StoryDetails story={story} />

      {/* Chapter List */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-2xl font-bold">
            Danh Sách Chương ({chapters.length})
          </h2>
          <div className="h-1 flex-1 bg-primary opacity-20 rounded-full hidden md:block"></div>
        </div>

        {chapters.length > 0 ? (
          <div className="card bg-base-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-base-300">
              {currentChapters.map((chapter) => (
                <ChapterListItem
                  key={chapter.id}
                  chapter={chapter}
                  storySlug={story.slug}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="alert">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-info shrink-0 w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <span>Chưa có chương nào được cập nhật cho truyện này.</span>
          </div>
        )}

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
}
