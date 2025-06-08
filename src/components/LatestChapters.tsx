import React from "react";
import { Chapter, Story } from "@/types";
import Link from "next/link";
import { formatDistanceToNow, isValid } from "date-fns";
import { vi } from "date-fns/locale";

interface LatestChaptersProps {
  chapters: Chapter[];
  getStoryBySlug: (slug: string) => Story | undefined;
}

const LatestChapters: React.FC<LatestChaptersProps> = ({
  chapters,
  getStoryBySlug,
}) => {
  // Format thời gian an toàn
  const formatTimeAgo = (dateString: string): string => {
    try {
      const publishDate = new Date(dateString);

      // Kiểm tra ngày hợp lệ trước khi sử dụng date-fns
      if (!isValid(publishDate)) {
        return dateString;
      }

      return formatDistanceToNow(publishDate, {
        addSuffix: false,
        locale: vi,
      });
    } catch (error) {
      // Trả về giá trị gốc nếu có lỗi
      console.error("Error formatting date:", dateString, error);
      return dateString;
    }
  };

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-2xl font-bold">Chương Mới Cập Nhật</h2>
        <div className="h-1 flex-1 bg-primary opacity-20 rounded-full"></div>
      </div>

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-4">
          <ul className="divide-y divide-base-300">
            {chapters.map((chapter) => {
              const story = getStoryBySlug(chapter.storySlug);
              const timeAgo = formatTimeAgo(chapter.publishedDate);

              return (
                <li key={chapter.id} className="py-3">
                  <Link
                    href={`/truyen/${chapter.storySlug}/${chapter.chapterNumber}`}
                    className="flex items-start justify-between hover:bg-base-200 rounded-lg p-2 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium group-hover:text-primary group-hover:underline">
                        {chapter.title}
                      </p>
                      {story && (
                        <p className="text-sm opacity-70">{story.title}</p>
                      )}
                    </div>

                    <div className="flex flex-col items-end ml-4 min-w-fit">
                      {story && (
                        <span className="text-xs hidden sm:inline opacity-70">
                          {story.author}
                        </span>
                      )}
                      <span className="text-xs opacity-50">{timeAgo}</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default LatestChapters;
