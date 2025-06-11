import React from "react";
import { Chapter, Story } from "@/types";
import Link from "next/link";
import { formatDistanceToNow, isValid, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

interface LatestChaptersProps {
  chapters: Chapter[];
  getStoryBySlug: (slug: string) => Story | undefined;
}

const LatestChapters: React.FC<LatestChaptersProps> = ({ chapters }) => {
  // Format thời gian an toàn
  const formatTimeAgo = (dateString: string): string => {
    try {
      // Nếu dateString là định dạng dd/mm/yyyy Việt Nam, chuyển về yyyy-mm-dd để parse
      const parts = dateString.split("/");
      if (parts.length === 3) {
        const day = parts[0];
        const month = parts[1];
        const year = parts[2];
        dateString = `${year}-${month}-${day}`;
      }

      // Parse ngày theo định dạng ISO
      let date: Date;
      try {
        date = parseISO(dateString);
      } catch {
        // Fallback: thử tạo trực tiếp đối tượng Date
        date = new Date(dateString);
      }

      // Kiểm tra ngày hợp lệ
      if (!isValid(date)) {
        return "mới đây";
      }

      // Kiểm tra xem date có trong tương lai không
      const now = new Date();
      if (date > now) {
        return "mới đây";
      }

      // Format khoảng thời gian với hậu tố "trước"
      return formatDistanceToNow(date, {
        addSuffix: true,
        locale: vi,
      });
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return "mới đây";
    }
  };

  // Chia danh sách chương thành 2 phần, mỗi phần 5 chương
  const firstHalf = chapters.slice(0, 5);
  const secondHalf = chapters.slice(5, 10);

  // Component để hiển thị danh sách chương
  const ChapterList = ({ items }: { items: Chapter[] }) => (
    <ul className="divide-y divide-base-300">
      {items.map((chapter) => {
        const timeAgo = formatTimeAgo(chapter.publishedDate);

        return (
          <li key={chapter.id} className="py-3">
            <Link
              href={`/truyen/${chapter.storySlug}/${
                chapter.slug || `chuong-${chapter.chapterNumber}`
              }`}
              className="flex items-start justify-between hover:bg-base-200 rounded-lg p-2 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium group-hover:text-primary group-hover:underline">
                  {chapter.title}
                </p>
                {chapter.storyTitle && (
                  <p className="text-sm opacity-70">{chapter.storyTitle}</p>
                )}
              </div>

              <div className="flex flex-col items-end ml-4 min-w-fit">
                {chapter.storyAuthor && (
                  <span className="text-xs hidden sm:inline opacity-70">
                    {chapter.storyAuthor}
                  </span>
                )}
                <span className="text-xs opacity-50">{timeAgo}</span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-2xl font-bold">Chương Mới</h2>
        <div className="h-1 flex-1 bg-primary opacity-20 rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cột 1 - Hiển thị trên cả mobile và desktop */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-4">
            <ChapterList items={firstHalf} />
          </div>
        </div>

        {/* Cột 2 - Chỉ hiển thị trên desktop */}
        <div className="card bg-base-100 shadow-sm hidden md:block">
          <div className="card-body p-4">
            <ChapterList items={secondHalf} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default LatestChapters;
