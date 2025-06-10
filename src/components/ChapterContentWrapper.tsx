"use client";

import React, { useState, useEffect } from "react";
import AdvertisementBanner from "@/components/AdvertisementBanner";
import HorizontalAdBanner from "@/components/HorizontalAdBanner";
import ChapterContentProtection from "@/components/ChapterContentProtection";

interface ChapterContentWrapperProps {
  content: string;
  chapterNumber: number;
}

const ChapterContentWrapper: React.FC<ChapterContentWrapperProps> = ({
  content,
  chapterNumber,
}) => {
  const [adClicked, setAdClicked] = useState(false);
  const [adAvailable, setAdAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Split content for banner ad insertion
  const splitContent = (
    htmlContent: string
  ): { firstHalf: string; secondHalf: string } => {
    // First check if we have any content
    if (!htmlContent || htmlContent.trim() === "") {
      return { firstHalf: "", secondHalf: "" };
    }

    // Find all paragraph end positions
    const paragraphMatches = [...htmlContent.matchAll(/<\/p>/gi)];
    if (!paragraphMatches || paragraphMatches.length === 0) {
      // No paragraph tags found, try to split by <br> or <div> if they exist
      const breakMatches = [...htmlContent.matchAll(/<br\s*\/?>/gi)];

      if (breakMatches && breakMatches.length > 1) {
        // We found some <br> tags, use the middle one as split point
        const midBreakIndex = Math.floor(breakMatches.length / 2);
        const splitPoint = breakMatches[midBreakIndex].index;

        if (splitPoint) {
          return {
            firstHalf: htmlContent.substring(0, splitPoint),
            secondHalf: htmlContent.substring(splitPoint),
          };
        }
      }

      // If no structure found, just split in the middle of the content
      const midPoint = Math.floor(htmlContent.length / 2);

      // Try to find a space near the midpoint to avoid breaking words
      let safePoint = midPoint;
      const searchRange = 100; // Look 100 chars before and after midpoint

      for (let i = 0; i < searchRange; i++) {
        if (
          midPoint + i < htmlContent.length &&
          htmlContent[midPoint + i] === " "
        ) {
          safePoint = midPoint + i;
          break;
        }
        if (midPoint - i >= 0 && htmlContent[midPoint - i] === " ") {
          safePoint = midPoint - i;
          break;
        }
      }

      return {
        firstHalf: htmlContent.substring(0, safePoint),
        secondHalf: htmlContent.substring(safePoint),
      };
    }

    // We have paragraph tags, find a good middle point
    const paragraphEndPositions = paragraphMatches
      .map((match) => match.index)
      .filter((index) => index !== undefined) as number[];

    if (paragraphEndPositions.length <= 1) {
      // Just one paragraph, split it in the middle
      return {
        firstHalf: htmlContent,
        secondHalf: "",
      };
    }

    // Find split point at approximately the middle paragraph
    const midIndex = Math.floor(paragraphEndPositions.length / 2);
    const splitPosition = paragraphEndPositions[midIndex] + 4; // +4 to include the </p> tag

    return {
      firstHalf: htmlContent.substring(0, splitPosition),
      secondHalf: htmlContent.substring(splitPosition),
    };
  };

  // Fetch ad when component mounts
  useEffect(() => {
    const checkForAds = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/ads?chapter=${chapterNumber}`);

        if (!response.ok) {
          throw new Error("Failed to fetch advertisement");
        }

        const data = await response.json();

        // If advertisement exists, set adAvailable to true
        if (data.advertisement) {
          setAdAvailable(true);
        } else {
          // If no ad available (either due to no matching ads or user already viewed all ads)
          // Show content directly
          setAdClicked(true);
          setAdAvailable(false);
        }
      } catch (err) {
        console.error("Error fetching ad:", err);
        // On error, show content directly
        setAdClicked(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkForAds();
  }, [chapterNumber]);

  // Callback for when ad is clicked
  const handleAdClick = () => {
    setAdClicked(true);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="w-full my-8 flex justify-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  // No ad or ad already clicked - show content with banner ad in the middle
  if (adClicked || !adAvailable) {
    const { firstHalf, secondHalf } = splitContent(content);

    // If we couldn't split the content (e.g., it's too short), just show it all
    if (!secondHalf || secondHalf.trim() === "") {
      return (
        <ChapterContentProtection>
          <div
            id="chapter-content"
            className="chapter-content-text chapter-content"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </ChapterContentProtection>
      );
    }

    // Console log for debugging
    console.log(
      "Content split successful:",
      `First half length: ${firstHalf.length}`,
      `Second half length: ${secondHalf.length}`
    );

    return (
      <ChapterContentProtection>
        <div
          id="chapter-content"
          className="chapter-content-text chapter-content"
        >
          <div dangerouslySetInnerHTML={{ __html: firstHalf }} />

          {/* Horizontal banner ad */}
          <HorizontalAdBanner adType="banner" position="content" />

          <div dangerouslySetInnerHTML={{ __html: secondHalf }} />
        </div>
      </ChapterContentProtection>
    );
  }

  // Show ad before content
  return (
    <div className="my-6 flex flex-col items-center">
      <div className="bg-base-200 p-4 rounded-lg mb-4 text-center">
        <p className="font-bold text-lg mb-2">
          Mời bạn click vào liên kết bên dưới để mở khóa toàn bộ chương
        </p>
        {/* <p className="text-sm opacity-80 mb-2">
          Nhấp vào quảng cáo bên dưới để tiếp tục đọc truyện
        </p>
        <p className="text-xs opacity-70">
          (Quảng cáo chỉ xuất hiện ở một số chương nhất định và bạn chỉ phải
          nhấp vào 1 lần mỗi ngày)
        </p> */}
        <div className="bg-base-300 p-4 rounded-lg text-center mt-4 w-fit">
          <p className="text-base font-medium">
            Lưu ý: nội dung trên chỉ xuất hiện 1 lần 1 ngày, mong quý độc giả
            ủng hộ.
          </p>
        </div>
      </div>

      {/* Modified AdvertisementBanner with onAdClick callback */}
      <AdvertisementBanner
        chapterNumber={chapterNumber}
        onAdClick={handleAdClick}
      />
    </div>
  );
};

export default ChapterContentWrapper;
