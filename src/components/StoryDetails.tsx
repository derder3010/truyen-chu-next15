"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "~image";
import Link from "next/link";
import { Story } from "@/types";

interface StoryDetailsProps {
  story: Story;
}

const StoryDetails: React.FC<StoryDetailsProps> = ({ story }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    // Kiểm tra xem mô tả có cần nút "Xem thêm" hay không
    const checkHeight = () => {
      if (descriptionRef.current) {
        // Lấy chiều cao của 3 dòng text (khoảng 4.5em)
        const threeLineHeight = 4.5 * 16; // em -> px (giả sử 1em = 16px)

        // Nếu chiều cao thực tế lớn hơn 3 dòng, hiển thị nút
        setShowButton(descriptionRef.current.scrollHeight > threeLineHeight);
      }
    };

    checkHeight();

    // Kiểm tra lại khi cửa sổ thay đổi kích thước
    window.addEventListener("resize", checkHeight);
    return () => {
      window.removeEventListener("resize", checkHeight);
    };
  }, [story.description]);

  return (
    <div className="card lg:card-side bg-base-100 shadow-sm">
      {/* Cover Image with proper padding and frame - aligned to top */}
      <div className="lg:pl-8 lg:pt-8 p-6 shrink-0 flex items-start">
        <div
          className="book-cover relative w-full aspect-[3/4] md:h-[280px] lg:h-[260px] lg:w-[195px] shrink-0 
                       bg-white
                       border-4 border-base-200
                       shadow-[0_0_15px_rgba(0,0,0,0.2)]
                       rounded-md overflow-hidden"
        >
          {/* Inner frame/mat */}
          <div className="absolute inset-[4px] border border-gray-300 rounded-sm z-10"></div>

          {/* Image */}
          <Image
            src={story.coverImage}
            alt={story.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 195px"
            priority
          />

          {/* Subtle overlay for better visual appearance */}
          <div className="absolute inset-0 shadow-inner"></div>
        </div>
      </div>

      {/* Story Info */}
      <div className="card-body">
        <h1 className="card-title text-2xl md:text-3xl">{story.title}</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 my-2">
          <div className="flex items-center">
            <span className="font-medium mr-1">Tác giả:</span>
            <span className="opacity-80">{story.author}</span>
          </div>

          <div className="flex items-center">
            <span className="font-medium mr-1">Trạng thái:</span>
            <span className="opacity-80">{story.status}</span>
          </div>

          <div className="flex items-center">
            <span className="font-medium mr-1">Số chương:</span>
            <span className="opacity-80">{story.totalChapters}</span>
          </div>

          <div className="flex items-center">
            <span className="font-medium mr-1">Lượt đọc:</span>
            <span className="opacity-80">{story.views.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 my-2">
          {story.genres.map((genre) => (
            <Link
              key={genre}
              href={`/the-loai?tag=${encodeURIComponent(genre)}`}
              className="badge badge-outline hover:bg-base-300 hover:border-base-300 transition-colors cursor-pointer"
            >
              {genre}
            </Link>
          ))}
        </div>

        <div className="divider my-1">Giới thiệu</div>

        <div className="description-container">
          <p
            ref={descriptionRef}
            className={`text-sm md:text-base opacity-80 ${
              !isExpanded && showButton ? "line-clamp-3" : ""
            }`}
          >
            {story.description}
          </p>

          {showButton && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-primary hover:text-primary-focus text-sm mt-1 transition-colors flex items-center"
            >
              {isExpanded ? (
                <>
                  Thu gọn <span className="ml-1">▲</span>
                </>
              ) : (
                <>
                  Xem thêm <span className="ml-1">▼</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoryDetails;
