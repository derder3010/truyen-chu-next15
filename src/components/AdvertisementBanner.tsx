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
    return null;
  }

  // Error state
  if (error) {
    return null; // Hide on error
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full h-[120px] bg-base-200 animate-pulse rounded-lg my-6"></div>
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
        <div className="flex flex-col md:flex-row items-center p-2 gap-4 hover:bg-base-300 transition-colors">
          {ad.imageUrl && (
            <div className="relative w-full md:w-[200px] h-[120px]">
              <Image
                src={ad.imageUrl}
                alt={ad.title}
                fill
                className="object-cover rounded"
                sizes="(max-width: 768px) 100vw, 200px"
              />
            </div>
          )}

          <div className="flex-1 p-2">
            <div className="text-xs text-base-content/60 mb-1">Quảng cáo</div>
            <h3 className="font-bold text-lg">{ad.title}</h3>
            <p className="text-sm text-base-content/80">{ad.description}</p>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default AdvertisementBanner;
