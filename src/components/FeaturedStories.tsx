import React from "react";
import { Story } from "@/types";
import StoryCard from "./StoryCard";

interface FeaturedStoriesProps {
  stories: Story[];
}

const FeaturedStories: React.FC<FeaturedStoriesProps> = ({ stories }) => {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-2xl font-bold">Truyện Nổi Bật</h2>
        <div className="h-1 flex-1 bg-primary opacity-20 rounded-full"></div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {stories.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>
    </section>
  );
};

export default FeaturedStories;
