"use client";

import React, { useEffect, useState } from "react";
import Image from "~image";
import Link from "next/link";

interface Advertisement {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  affiliateUrl: string;
  type?: string;
}

interface AdvertisementBannerProps {
  chapterNumber: number;
  onAdClick?: () => void; // Optional callback when ad is clicked
}

const AdvertisementBanner: React.FC<AdvertisementBannerProps> = ({
  chapterNumber,
  onAdClick,
}) => {
  const [ad, setAd] = useState<Advertisement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/ads?chapter=${chapterNumber}`);

        if (!response.ok) {
          throw new Error("Failed to fetch advertisement");
        }

        const data = await response.json();
        setAd(data.advertisement);
      } catch (err) {
        console.error("Error fetching ad:", err);
        setError("Không thể tải quảng cáo");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAd();
  }, [chapterNumber]);

  // Track ad click
  const handleAdClick = async () => {
    if (!ad) return;

    try {
      await fetch("/api/ads/click", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adId: ad.id }),
      });

      // Call the callback if provided
      if (onAdClick) {
        onAdClick();
      }
    } catch (err) {
      console.error("Error tracking ad click:", err);
    }
  };

  // No ad to display
  if (!isLoading && !ad) {
    // Check if user has recently viewed ads
    const viewedAdsCookie =
      typeof document !== "undefined"
        ? document.cookie
            .split("; ")
            .find((row) => row.startsWith("viewed_ads="))
        : null;

    if (viewedAdsCookie) {
      return (
        <div className="w-full bg-base-100 border border-base-300 rounded-lg my-6 p-4 text-center">
          <p className="text-sm text-base-content/70">
            Bạn đã xem quảng cáo trong vòng 24 giờ qua, nội dung chương sẽ hiển
            thị ngay lập tức.
          </p>
        </div>
      );
    }
    return null;
  }

  // Error state
  if (error) {
    return null; // Hide on error
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full h-[350px] bg-base-200 animate-pulse rounded-lg my-6"></div>
    );
  }

  // Add extra null check to satisfy TypeScript
  if (!ad) return null;

  return (
    <div className="w-full bg-base-200 rounded-lg my-6 overflow-hidden">
      <Link
        href={ad.affiliateUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleAdClick}
        className="block"
      >
        <div className="flex flex-col items-center p-3 gap-3 md:gap-6 hover:bg-base-300 transition-colors">
          <h3 className="font-bold text-xl text-center mb-0 md:mb-1">
            {ad.title}
          </h3>

          {ad.imageUrl && (
            <div className="relative w-full h-[220px] md:h-[280px]">
              <Image
                src={ad.imageUrl}
                alt={ad.title}
                fill
                className="object-contain rounded"
                sizes="100vw"
                priority
              />
            </div>
          )}

          {ad.description && (
            <p className="text-base text-base-content/80 text-center mt-0 md:mt-1">
              {ad.description}
            </p>
          )}

          <div className="btn btn-primary mt-1 md:mt-3">Click để mở khóa</div>
        </div>
      </Link>
    </div>
  );
};

export default AdvertisementBanner;
