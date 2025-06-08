"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import StoryCard from "@/components/StoryCard";
import SearchIcon from "@/components/icons/SearchIcon";
import { Story } from "@/types";

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
  const [results, setResults] = useState<Story[]>(initialStories);
  const [allStories] = useState<Story[]>(initialStories);

  const handleSearch = useCallback(
    (currentSearchTerm: string) => {
      if (currentSearchTerm.trim() === "") {
        setResults([]);
        window.history.pushState({}, "", "/tim-kiem"); // Clear query param if search term is empty
        return;
      }
      const lowercasedTerm = currentSearchTerm.toLowerCase();
      const filteredStories = allStories.filter(
        (story) =>
          story.title.toLowerCase().includes(lowercasedTerm) ||
          story.author.toLowerCase().includes(lowercasedTerm) ||
          story.genres.some((genre) =>
            genre.toLowerCase().includes(lowercasedTerm)
          )
      );
      setResults(filteredStories);
      window.history.pushState(
        {},
        "",
        `/tim-kiem?q=${encodeURIComponent(currentSearchTerm)}`
      ); // Update query param
    },
    [allStories]
  );

  // Perform search when component mounts or initialQuery changes
  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery, handleSearch]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSearch(searchTerm);
  };

  return (
    <div className="space-y-8">
      <div className="shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6 ">Tìm Kiếm Truyện</h1>
        <form onSubmit={handleSubmit} className="flex items-center gap-2 mb-6">
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Nhập tên truyện, tác giả, hoặc thể loại..."
            className="flex-grow px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-DEFAULT focus:border-primary-DEFAULT dark:focus:ring-secondary-light dark:focus:border-secondary-light"
          />
          <button
            type="submit"
            className="px-4 py-2  rounded-md hover:bg-primary-dark  dark:hover:bg-secondary-dark transition-colors flex items-center"
          >
            <SearchIcon className="w-5 h-5 mr-2" />
            Tìm
          </button>
        </form>
      </div>

      {initialQuery && (
        <div>
          <h2 className="text-xl font-semibold mb-4 ">
            Kết quả tìm kiếm cho: &quot;{initialQuery}&quot; ({results.length}{" "}
            truyện)
          </h2>
          {results.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {results.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          ) : (
            <p className=" text-center py-8">
              Không tìm thấy truyện nào phù hợp. Vui lòng thử từ khóa khác.
            </p>
          )}
        </div>
      )}
      {!initialQuery && (
        <p className="text-center py-8">
          Nhập từ khóa vào ô tìm kiếm để bắt đầu.
        </p>
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
