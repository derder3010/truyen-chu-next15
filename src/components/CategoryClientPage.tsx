"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MOCK_STORIES, GENRES_LIST } from "@/lib/constants";
import StoryCard from "@/components/StoryCard";
import { Story } from "@/types";
import TagIcon from "@/components/icons/TagIcon";

const CategoryClientPage: React.FC = () => {
  const searchParams = useSearchParams();
  const selectedGenre = searchParams.get("tag");
  const [filteredStories, setFilteredStories] = useState<Story[]>(MOCK_STORIES);

  useEffect(() => {
    if (selectedGenre) {
      setFilteredStories(
        MOCK_STORIES.filter((story) => story.genres.includes(selectedGenre))
      );
    } else {
      // If no genre selected, show all or a default set, here showing all
      setFilteredStories(MOCK_STORIES);
    }
  }, [selectedGenre]);

  return (
    <div className="space-y-8">
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold">
              Thể Loại Truyện {selectedGenre ? `: ${selectedGenre}` : ""}
            </h1>
            <div className="h-1 flex-1 bg-primary opacity-20 rounded-full hidden md:block"></div>
          </div>

          <p className="text-sm opacity-70 mb-6">
            Khám phá truyện theo thể loại yêu thích của bạn.
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {GENRES_LIST.map((genre) => (
              <Link
                key={genre}
                href={`/the-loai?tag=${encodeURIComponent(genre)}`}
                className={`badge ${
                  selectedGenre === genre
                    ? "badge-primary"
                    : "badge-outline hover:badge-ghost"
                } py-3 cursor-pointer transition-colors`}
              >
                {genre}
              </Link>
            ))}
            {selectedGenre && (
              <Link
                href="/the-loai"
                className="badge badge-error badge-outline py-3 cursor-pointer transition-colors"
              >
                Xóa lọc
              </Link>
            )}
          </div>
        </div>
      </div>

      {filteredStories.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {filteredStories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      ) : (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body items-center text-center py-16">
            <TagIcon className="w-16 h-16 opacity-30 mb-4" />
            <h2 className="card-title">Không tìm thấy truyện</h2>
            <p className="opacity-70">
              {selectedGenre
                ? `Không có truyện nào thuộc thể loại "${selectedGenre}".`
                : "Chọn một thể loại để xem truyện."}
            </p>
            {selectedGenre && (
              <div className="card-actions mt-4">
                <Link href="/the-loai" className="btn btn-primary">
                  Xem tất cả thể loại
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryClientPage;
