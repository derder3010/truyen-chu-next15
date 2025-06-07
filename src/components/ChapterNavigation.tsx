"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChapterNavigationProps } from "@/types";
import ChevronLeftIcon from "./icons/ChevronLeftIcon";
import ChevronRightIcon from "./icons/ChevronRightIcon";
import HomeIcon from "./icons/HomeIcon";
import MenuIcon from "./icons/MenuIcon";
import FontSizeControls from "./FontSizeControls";

const ChapterNavigation: React.FC<ChapterNavigationProps> = ({
  storySlug,
  currentChapter,
  prevChapter,
  nextChapter,
  allChapters,
  isMobile = false,
}) => {
  const router = useRouter();

  // Mobile sticky bottom navigation
  if (isMobile) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-base-300 bg-base-100 shadow-lg">
        <div className="container flex items-center justify-between gap-2 px-4 py-2">
          <Link
            href={
              prevChapter
                ? `/truyen/${storySlug}/${prevChapter.chapterNumber}`
                : "#"
            }
            className={`btn btn-sm btn-circle ${
              prevChapter ? "btn-ghost" : "btn-disabled opacity-50"
            }`}
            title="Chương trước"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </Link>

          <select
            value={currentChapter.chapterNumber}
            onChange={(e) =>
              router.push(`/truyen/${storySlug}/${e.target.value}`)
            }
            className="select select-bordered select-sm flex-1 max-w-[140px]"
            title="Chọn chương"
          >
            {allChapters.map((chap) => (
              <option key={chap.id} value={chap.chapterNumber}>
                Chương {chap.chapterNumber}
              </option>
            ))}
          </select>

          <Link
            href={
              nextChapter
                ? `/truyen/${storySlug}/${nextChapter.chapterNumber}`
                : "#"
            }
            className={`btn btn-sm btn-circle ${
              nextChapter ? "btn-ghost" : "btn-disabled opacity-50"
            }`}
            title="Chương sau"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </Link>

          <div className="divider divider-horizontal"></div>

          <div className="pl-2">
            <FontSizeControls defaultSize={18} />
          </div>
        </div>
      </nav>
    );
  }

  // Desktop navigation
  return (
    <nav className="mb-6">
      <div className="card shadow-sm bg-base-100 p-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center justify-center gap-2">
            <Link
              href={
                prevChapter
                  ? `/truyen/${storySlug}/${prevChapter.chapterNumber}`
                  : "#"
              }
              className={`btn btn-sm btn-circle ${
                prevChapter ? "btn-ghost" : "btn-disabled opacity-50"
              }`}
              title="Chương trước"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </Link>

            <select
              value={currentChapter.chapterNumber}
              onChange={(e) =>
                router.push(`/truyen/${storySlug}/${e.target.value}`)
              }
              className="select select-bordered select-sm min-w-[120px]"
              title="Chọn chương"
            >
              {allChapters.map((chap) => (
                <option key={chap.id} value={chap.chapterNumber}>
                  Chương {chap.chapterNumber}
                </option>
              ))}
            </select>

            <Link
              href={
                nextChapter
                  ? `/truyen/${storySlug}/${nextChapter.chapterNumber}`
                  : "#"
              }
              className={`btn btn-sm btn-circle ${
                nextChapter ? "btn-ghost" : "btn-disabled opacity-50"
              }`}
              title="Chương sau"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/"
              className="btn btn-sm btn-circle btn-ghost"
              title="Trang chủ"
            >
              <HomeIcon className="w-5 h-5" />
            </Link>

            <Link
              href={`/truyen/${storySlug}`}
              className="btn btn-sm btn-circle btn-ghost"
              title="Danh sách chương"
            >
              <MenuIcon className="w-5 h-5" />
            </Link>

            <div className="divider divider-horizontal mx-0"></div>
            <FontSizeControls defaultSize={18} />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default ChapterNavigation;
