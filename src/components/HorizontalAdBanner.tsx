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
  type: string;
}

interface HorizontalAdBannerProps {
  adType: "banner" | "priority";
  className?: string;
  position?: "navbar" | "footer" | "content";
}

// Lưu trữ quảng cáo trong bộ nhớ để tái sử dụng
const adCache: Record<string, { ad: Advertisement; timestamp: number }> = {};

const HorizontalAdBanner: React.FC<HorizontalAdBannerProps> = ({
  adType = "banner",
  className = "",
  position = "content",
}) => {
  const [ad, setAd] = useState<Advertisement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if ad was recently dismissed (only for navbar position)
    if (position === "navbar") {
      const dismissedAds = localStorage.getItem("dismissedAds");
      if (dismissedAds) {
        try {
          const parsed = JSON.parse(dismissedAds);
          const now = Date.now();
          // Check if we have a recent dismissal for this type
          if (parsed[adType] && now - parsed[adType] < 24 * 60 * 60 * 1000) {
            setDismissed(true);
            return;
          }
        } catch (e) {
          console.error("Error parsing dismissed ads:", e);
        }
      }
    }

    const fetchAd = async () => {
      try {
        setIsLoading(true);

        // Check cache first (valid for 5 minutes)
        const now = Date.now();
        const cacheKey = `ad_${adType}`;
        const cachedAd = adCache[cacheKey];

        if (cachedAd && now - cachedAd.timestamp < 5 * 60 * 1000) {
          console.log(`Using cached ${adType} ad`);
          setAd(cachedAd.ad);
          setIsLoading(false);
          return;
        }

        // Request directly with specified type to ensure we get the right ad
        const response = await fetch(`/api/ads/banner?type=${adType}&limit=1`);

        if (!response.ok) {
          throw new Error("Failed to fetch advertisement");
        }

        const data = await response.json();
        if (data.advertisements && data.advertisements.length > 0) {
          const newAd = data.advertisements[0];
          // Cache the ad
          adCache[cacheKey] = {
            ad: newAd,
            timestamp: now,
          };
          setAd(newAd);
        }
      } catch (err) {
        console.error("Error fetching ad:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (!dismissed) {
      fetchAd();
    }
  }, [adType, position, dismissed]);

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
    } catch (err) {
      console.error("Error tracking ad click:", err);
    }
  };

  // Handle dismissing the ad
  const handleDismiss = () => {
    if (!ad || position !== "navbar") return;

    try {
      // Save to localStorage that this type of ad was dismissed
      const dismissedAds = localStorage.getItem("dismissedAds") || "{}";
      const parsed = JSON.parse(dismissedAds);
      parsed[adType] = Date.now();
      localStorage.setItem("dismissedAds", JSON.stringify(parsed));
      setDismissed(true);
    } catch (e) {
      console.error("Error saving dismissed ad:", e);
    }
  };

  // No ad to display, loading, or dismissed
  if (isLoading || !ad || dismissed) {
    return null;
  }

  // Navbar position (priority ad) - with background image
  if (position === "navbar") {
    return (
      <div className={`w-full border-b border-base-300 ${className}`}>
        <div className="relative">
          {/* Background image */}
          {ad.imageUrl && (
            <div className="absolute inset-0 w-full h-full overflow-hidden">
              <div className="relative w-full h-full">
                <Image
                  src={ad.imageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="100vw"
                  priority
                />
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-base-300/60"></div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="container mx-auto px-4 py-3 md:py-6 relative">
            <button
              onClick={handleDismiss}
              className="absolute right-4 top-2 md:top-4 text-base-content/70 hover:text-base-content z-10"
              aria-label="Đóng quảng cáo"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <Link
              href={ad.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleAdClick}
              className="block py-1 md:py-2 relative z-10"
            >
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <p className="text-base md:text-xl font-medium">
                    {/* <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-xs mr-1">
                      Quảng cáo
                    </span> */}
                    {ad.title}
                  </p>
                  {ad.description && (
                    <p className="text-xs md:text-sm text-base-content/80 mt-1 max-w-md mx-auto">
                      {ad.description}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Footer position (banner ad) - larger style
  if (position === "footer") {
    return (
      <div
        className={`w-full bg-base-100 py-4 border-t border-base-300 ${className}`}
      >
        <div className="container mx-auto px-4">
          <Link
            href={ad.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleAdClick}
            className="block"
          >
            <div className="flex flex-col items-center gap-3 hover:opacity-90 transition-opacity">
              <div className="flex items-center gap-2">
                {/* <span className="badge badge-primary text-xs">Quảng cáo</span> */}
                <h3 className="font-bold text-lg">{ad.title}</h3>
              </div>

              {ad.imageUrl && (
                <div className="relative w-full h-[120px] md:h-[160px] max-w-screen-md">
                  <Image
                    src={ad.imageUrl}
                    alt={ad.title}
                    fill
                    className="object-contain rounded-lg"
                    sizes="(max-width: 768px) 100vw, 768px"
                    priority
                  />
                </div>
              )}

              {ad.description && (
                <p className="text-sm text-base-content/80 text-center max-w-xl">
                  {ad.description}
                </p>
              )}
            </div>
          </Link>
        </div>
      </div>
    );
  }

  // Default (content) position - horizontal layout
  return (
    <div
      className={`w-full bg-base-200 rounded-lg my-6 overflow-hidden border border-base-300 ${className}`}
    >
      <Link
        href={ad.affiliateUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleAdClick}
        className="block"
      >
        <div className="flex flex-col md:flex-row items-center p-4 gap-4 hover:bg-base-300 transition-colors">
          {ad.imageUrl && (
            <div className="relative w-full h-[160px] md:w-[180px] md:h-[100px] flex-shrink-0">
              <Image
                src={ad.imageUrl}
                alt={ad.title}
                fill
                className="object-contain rounded"
                sizes="(max-width: 768px) 100vw, 180px"
                priority
              />
            </div>
          )}

          <div className="flex flex-col flex-grow w-full text-center md:text-left">
            <h3 className="font-bold text-lg mt-2 md:mt-0">{ad.title}</h3>
            {ad.description && (
              <p className="text-sm text-base-content/80 line-clamp-2">
                {ad.description}
              </p>
            )}
            <div className="btn btn-primary btn-sm mt-3 md:hidden mx-auto">
              Xem thêm
            </div>
            <div className="hidden md:block text-sm font-medium text-primary mt-2">
              Click để xem thêm »
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default HorizontalAdBanner;
