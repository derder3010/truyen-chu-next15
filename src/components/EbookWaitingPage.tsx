"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface Advertisement {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  affiliateUrl: string;
  type: string;
}

interface EbookWaitingPageProps {
  ebookTitle: string;
  ebookSlug: string;
  downloadUrl: string;
}

const EbookWaitingPage: React.FC<EbookWaitingPageProps> = ({
  ebookTitle,
  ebookSlug,
  downloadUrl,
}) => {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [message, setMessage] = useState("Đang chuẩn bị ebook của bạn...");
  const [topAd, setTopAd] = useState<Advertisement | null>(null);
  const [bottomAd, setBottomAd] = useState<Advertisement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch ads when component mounts
  useEffect(() => {
    const fetchAds = async () => {
      try {
        setIsLoading(true);
        // Fetch top ad
        const topResponse = await fetch("/api/ads/ebook-waiting?position=top");
        // Fetch bottom ad
        const bottomResponse = await fetch(
          "/api/ads/ebook-waiting?position=bottom"
        );

        if (topResponse.ok) {
          const topData = await topResponse.json();
          if (topData.advertisements && topData.advertisements.length > 0) {
            setTopAd(topData.advertisements[0]);
          }
        }

        if (bottomResponse.ok) {
          const bottomData = await bottomResponse.json();
          if (
            bottomData.advertisements &&
            bottomData.advertisements.length > 0
          ) {
            setBottomAd(bottomData.advertisements[0]);
          }
        }
      } catch (err) {
        console.error("Error fetching ads:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAds();
  }, []);

  // Setup progress bar and countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (progress < 100) {
      interval = setInterval(() => {
        setProgress((prevProgress) => {
          const newProgress = prevProgress + 100 / 30; // 100% in 30 seconds

          // Update message based on progress
          if (newProgress >= 66.6) {
            setMessage("Hoàn tất! Đang tạo liên kết tải về…");
          } else if (newProgress >= 33.3) {
            setMessage(
              "Bạn có biết? Ebook này có hơn 1.000 lượt tải mỗi tháng"
            );
          }

          // Show popup at 100%
          if (newProgress >= 100) {
            setShowPopup(true);
            clearInterval(interval);
            return 100;
          }

          return newProgress;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [progress]);

  // Handle ad click
  const handleAdClick = async (adId: number) => {
    try {
      await fetch("/api/ads/click", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adId }),
      });
    } catch (err) {
      console.error("Error tracking ad click:", err);
    }
  };

  // Download function
  const handleDownload = () => {
    window.open(downloadUrl, "_blank");
    // Redirect back to ebook detail page after a short delay
    setTimeout(() => {
      router.push(`/ebook/${ebookSlug}`);
    }, 1000);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-center mb-8">
          Đang chuẩn bị tải xuống ebook &quot;{ebookTitle}&quot;
        </h1>

        {/* Top Ad */}
        {!isLoading && topAd && (
          <div className="mb-6">
            <Link
              href={topAd.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleAdClick(topAd.id)}
              className="block"
            >
              <div className="flex flex-col items-center p-3 gap-3 md:gap-6 bg-base-200 hover:bg-base-300 transition-colors rounded-lg">
                <h3 className="font-bold text-xl text-center mb-0 md:mb-1">
                  {topAd.title}
                </h3>

                {topAd.imageUrl && (
                  <div className="relative w-full h-[220px] md:h-[280px]">
                    <Image
                      src={topAd.imageUrl}
                      alt={topAd.title}
                      fill
                      className="object-contain rounded"
                      sizes="100vw"
                      priority
                    />
                  </div>
                )}

                {topAd.description && (
                  <p className="text-base text-base-content/80 text-center mt-0 md:mt-1">
                    {topAd.description}
                  </p>
                )}

                <div className="btn btn-primary mt-1 md:mt-3">Xem ngay</div>
              </div>
            </Link>
          </div>
        )}

        {/* Progress Section */}
        <div className="card bg-base-100 shadow-lg mb-6">
          <div className="card-body p-4 md:p-6">
            <h2 className="card-title text-center mx-auto mb-4 md:mb-6">
              {message}
            </h2>

            <div className="w-full mb-4 md:mb-6">
              <progress
                className="progress progress-primary w-full"
                value={progress}
                max="100"
              ></progress>
              <p className="text-center mt-2">{Math.round(progress)}%</p>
            </div>

            <p className="text-center text-sm opacity-70">
              Vui lòng đợi trong khi chúng tôi chuẩn bị ebook của bạn.
              <br />
              Quá trình này sẽ mất khoảng 30 giây.
            </p>
          </div>
        </div>

        {/* Bottom Ad */}
        {!isLoading && bottomAd && (
          <div className="mb-6">
            <Link
              href={bottomAd.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleAdClick(bottomAd.id)}
              className="block"
            >
              <div className="flex flex-col items-center p-3 gap-3 md:gap-6 bg-base-200 hover:bg-base-300 transition-colors rounded-lg">
                <h3 className="font-bold text-xl text-center mb-0 md:mb-1">
                  {bottomAd.title}
                </h3>

                {bottomAd.imageUrl && (
                  <div className="relative w-full h-[220px] md:h-[280px]">
                    <Image
                      src={bottomAd.imageUrl}
                      alt={bottomAd.title}
                      fill
                      className="object-contain rounded"
                      sizes="100vw"
                      priority
                    />
                  </div>
                )}

                {bottomAd.description && (
                  <p className="text-base text-base-content/80 text-center mt-0 md:mt-1">
                    {bottomAd.description}
                  </p>
                )}

                <div className="btn btn-primary mt-1 md:mt-3">Xem ngay</div>
              </div>
            </Link>
          </div>
        )}

        {/* Download Popup */}
        {showPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-base-100 p-6 rounded-lg shadow-lg max-w-md w-full text-center">
              <div className="text-success text-5xl mb-4">✓</div>
              <h3 className="font-bold text-xl mb-4">Ebook đã sẵn sàng!</h3>
              <p className="mb-6">
                Ebook &quot;{ebookTitle}&quot; đã sẵn sàng để tải về. Nhấn nút
                bên dưới để bắt đầu tải xuống.
              </p>
              <div className="flex flex-col gap-3">
                <button onClick={handleDownload} className="btn btn-primary">
                  Tải xuống ngay
                </button>
                <Link href={`/ebook/${ebookSlug}`} className="btn btn-outline">
                  Quay lại trang chi tiết
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EbookWaitingPage;
