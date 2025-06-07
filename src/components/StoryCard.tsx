import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Story } from "@/types";
// import TagIcon from "./icons/TagIcon";
import CheckCircleIcon from "./icons/CheckCircleIcon";

interface StoryCardProps {
  story: Story;
}

const StoryCard: React.FC<StoryCardProps> = ({ story }) => {
  return (
    <div className="card card-compact bg-base-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden rounded-xl">
      <Link href={`/truyen/${story.slug}`} className="group">
        <figure className="relative h-48 sm:h-56 md:h-64 w-full overflow-hidden rounded-t-xl">
          <Image
            src={story.coverImage}
            alt={story.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {story.status === "Đã hoàn thành" && (
            <div className="badge badge-success badge-sm absolute top-2 right-2 gap-1">
              <CheckCircleIcon className="w-3 h-3" /> Full
            </div>
          )}
        </figure>

        <div className="card-body p-3 pt-2 rounded-b-xl">
          <h3 className="card-title text-base line-clamp-1 text-primary group-hover:underline">
            {story.title}
          </h3>
          <p className="text-xs opacity-70">{story.author}</p>
          {/* <div className="card-actions justify-between mt-1">
            <div className="opacity-60 text-xs">
              {story.totalChapters} chương
            </div>
            <div className="text-xs opacity-60">
              {story.views.toLocaleString()} đọc
            </div>
          </div> */}
        </div>
      </Link>
    </div>
  );
};

export default StoryCard;
