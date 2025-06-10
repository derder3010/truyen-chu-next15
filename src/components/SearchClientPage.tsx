"use client";

import React, { useState, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import SearchInput from "@/components/SearchInput";
import SearchResultItem from "@/components/SearchResultItem";
import { Story } from "@/types";
import MiniSearch from "minisearch";
import { createSearchIndex } from "@/lib/search";

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface SearchClientPageProps {
  initialStories: Story[]; // Các truyện ban đầu từ server component
}

// Loading fallback component
function SearchLoadingFallback() {
  return (
    <div className="flex justify-center items-center py-12">
      <div className="loading loading-spinner loading-lg text-primary"></div>
    </div>
  );
}

// Component using useSearchParams
function SearchContent({ initialStories }: SearchClientPageProps) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState("all"); // "all", "stories", "licensed", "ebooks"

  // Khởi tạo MiniSearch ở client-side cho auto-suggestions
  const [miniSearchClient, setMiniSearchClient] =
    useState<MiniSearch<any> | null>(null);

  useEffect(() => {
    // Khởi tạo MiniSearch ở client-side
    if (initialStories.length > 0 && !miniSearchClient) {
      const searchIndex = createSearchIndex(initialStories);
      setMiniSearchClient(searchIndex);
    }
  }, [initialStories, miniSearchClient]);

  // SWR hook cho tìm kiếm
  const { data, error, isLoading } = useSWR(
    searchTerm ? `/api/search?q=${encodeURIComponent(searchTerm)}` : null,
    fetcher,
    {
      fallbackData: {
        stories: initialQuery
          ? initialStories.map((story) => ({ ...story, type: "story" }))
          : [],
        licensedStories: [],
        ebooks: [],
        allResults: initialQuery
          ? initialStories.map((story) => ({ ...story, type: "story" }))
          : [],
      },
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 phút cache
    }
  );

  // Lấy kết quả tìm kiếm dựa trên tab đang chọn
  const getFilteredResults = () => {
    if (!data) return [];

    switch (activeTab) {
      case "stories":
        return data.stories || [];
      case "licensed":
        return data.licensedStories || [];
      case "ebooks":
        return data.ebooks || [];
      case "all":
      default:
        return data.allResults || [];
    }
  };

  const results = getFilteredResults();

  // Đếm số lượng kết quả cho mỗi loại
  const storiesCount = data?.stories?.length || 0;
  const licensedCount = data?.licensedStories?.length || 0;
  const ebooksCount = data?.ebooks?.length || 0;
  const totalCount = storiesCount + licensedCount + ebooksCount;

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    window.history.pushState({}, "", `/tim-kiem?q=${encodeURIComponent(term)}`);
  };

  return (
    <div className="space-y-8">
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h1 className="card-title text-2xl mb-4">Tìm Kiếm Truyện</h1>
          <SearchInput
            initialValue={initialQuery}
            size="md"
            placeholder="Nhập tên truyện, tác giả, hoặc thể loại..."
            onSearch={handleSearch}
            hasMiniSearch={!!miniSearchClient}
            className="w-full"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="loading loading-spinner loading-lg text-primary"></div>
        </div>
      ) : searchTerm ? (
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">
              Kết quả tìm kiếm cho: &quot;{searchTerm}&quot;
              <div className="badge badge-primary">{totalCount} kết quả</div>
            </h2>

            {/* Tabs để chọn loại kết quả */}
            <div className="tabs tabs-boxed mb-4">
              <button
                className={`tab ${activeTab === "all" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("all")}
              >
                Tất cả <span className="badge badge-sm ml-1">{totalCount}</span>
              </button>
              <button
                className={`tab ${activeTab === "stories" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("stories")}
              >
                Truyện{" "}
                <span className="badge badge-sm ml-1">{storiesCount}</span>
              </button>
              <button
                className={`tab ${
                  activeTab === "licensed" ? "tab-active" : ""
                }`}
                onClick={() => setActiveTab("licensed")}
              >
                Xuất bản{" "}
                <span className="badge badge-sm ml-1">{licensedCount}</span>
              </button>
              <button
                className={`tab ${activeTab === "ebooks" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("ebooks")}
              >
                Ebook <span className="badge badge-sm ml-1">{ebooksCount}</span>
              </button>
            </div>

            {error ? (
              <div className="alert alert-error mt-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="stroke-current shrink-0 h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Đã xảy ra lỗi khi tìm kiếm. Vui lòng thử lại sau.</span>
              </div>
            ) : results.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 mt-4">
                {results.map((item: any) => (
                  <SearchResultItem
                    key={`${item.type}-${item.id}`}
                    item={item}
                  />
                ))}
              </div>
            ) : (
              <div className="alert alert-info mt-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="stroke-current shrink-0 w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <span>
                  Không tìm thấy kết quả nào phù hợp với từ khóa &quot;
                  {searchTerm}&quot;. Vui lòng thử từ khóa khác.
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card bg-base-100 shadow-md">
          <div className="card-body text-center py-12">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-16 h-16 mx-auto text-primary opacity-50 mb-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
            <p className="text-lg opacity-70">
              Nhập từ khóa vào ô tìm kiếm để bắt đầu.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Main component with Suspense
const SearchClientPage: React.FC<SearchClientPageProps> = (props) => {
  return (
    <Suspense fallback={<SearchLoadingFallback />}>
      <SearchContent {...props} />
    </Suspense>
  );
};

export default SearchClientPage;
