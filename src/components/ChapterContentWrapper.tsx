"use client";

import React, { useState, useEffect } from "react";
import AdvertisementBanner from "@/components/AdvertisementBanner";

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
  const [reportSent, setReportSent] = useState(false);
  const [skipTimer, setSkipTimer] = useState(15); // 15 seconds timer
  const [timerActive, setTimerActive] = useState(false);

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
          // Start timer when ad is available
          setTimerActive(true);
        } else {
          // If no ad available, show content directly
          setAdClicked(true);
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

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (timerActive && skipTimer > 0) {
      interval = setInterval(() => {
        setSkipTimer((prev) => prev - 1);
      }, 1000);
    } else if (skipTimer === 0) {
      setTimerActive(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, skipTimer]);

  // Callback for when ad is clicked
  const handleAdClick = () => {
    setAdClicked(true);
  };

  // Report issue and skip ad
  const handleReportIssue = async () => {
    try {
      // Could implement API call to report issue here
      setReportSent(true);

      // Wait 1 second and then show content
      setTimeout(() => {
        setAdClicked(true);
      }, 1000);
    } catch (err) {
      console.error("Error reporting issue:", err);
      setAdClicked(true);
    }
  };

  // Skip ad after timer
  const handleSkipAd = () => {
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

  // No ad or ad already clicked - show content directly
  if (adClicked || !adAvailable) {
    return (
      <div
        id="chapter-content"
        className="chapter-content-text chapter-content"
        dangerouslySetInnerHTML={{
          __html: content,
        }}
      />
    );
  }

  // Show ad before content
  return (
    <div className="my-6">
      <div className="bg-base-200 p-4 rounded-lg mb-4 text-center">
        <p className="font-bold text-lg mb-2">
          Chương {chapterNumber} - Xem quảng cáo để đọc nội dung
        </p>
        <p className="text-sm opacity-80 mb-2">
          Nhấp vào quảng cáo bên dưới để tiếp tục đọc truyện
        </p>
        <p className="text-xs opacity-70">
          (Quảng cáo chỉ xuất hiện ở một số chương nhất định)
        </p>
      </div>

      {/* Modified AdvertisementBanner with onAdClick callback */}
      <AdvertisementBanner
        chapterNumber={chapterNumber}
        onAdClick={handleAdClick}
      />

      <div className="bg-base-300 p-6 rounded-lg text-center mt-4">
        <p className="text-lg font-bold mb-4">
          Nội dung chương sẽ hiển thị sau khi bạn nhấp vào quảng cáo
        </p>

        {/* Report issue and skip options */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-4">
          {reportSent ? (
            <div className="text-success text-sm">
              Cảm ơn bạn đã báo cáo. Đang hiển thị nội dung...
            </div>
          ) : (
            <button
              onClick={handleReportIssue}
              className="btn btn-sm btn-outline"
            >
              Báo cáo lỗi không thể xem quảng cáo
            </button>
          )}

          {timerActive ? (
            <div className="text-sm opacity-70">
              Bỏ qua sau {skipTimer} giây
            </div>
          ) : (
            <button onClick={handleSkipAd} className="btn btn-sm btn-primary">
              Bỏ qua
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChapterContentWrapper;
