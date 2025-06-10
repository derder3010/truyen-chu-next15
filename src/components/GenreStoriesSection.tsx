import React from "react";
import { Story } from "@/types";
import StoryCard from "./StoryCard";
import Link from "next/link";

interface GenreStoriesSectionProps {
  genreStories: {
    genre: string;
    stories: Story[];
  }[];
}

const GenreStoriesSection: React.FC<GenreStoriesSectionProps> = ({
  genreStories,
}) => {
  if (!genreStories.length) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-2xl font-bold">Khám phá thể loại</h2>
        <div className="h-1 flex-1 bg-primary opacity-20 rounded-full"></div>
      </div>

      <div className="space-y-6">
        {genreStories.map(({ genre, stories }) => (
          <div key={genre} className="genre-section">
            <div className="flex items-center gap-2 mb-3">
              <Link
                href={`/the-loai/?tag=${encodeURIComponent(
                  genre.toLowerCase()
                )}`}
                className="badge badge-primary badge-lg"
              >
                {genre}
              </Link>
              <div className="h-px flex-1 bg-base-content opacity-10"></div>
              <Link
                href={`/the-loai/?tag=${encodeURIComponent(
                  genre.toLowerCase()
                )}`}
                className="text-xs text-primary hover:underline"
              >
                Xem thêm
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {stories.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default GenreStoriesSection;
