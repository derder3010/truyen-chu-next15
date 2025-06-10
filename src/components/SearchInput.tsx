"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import SearchIcon from "./icons/SearchIcon";

interface SearchInputProps {
  initialValue?: string;
  size?: "sm" | "md" | "lg";
  placeholder?: string;
  className?: string;
  onSearch?: (term: string) => void;
  hasMiniSearch?: boolean;
}

const SearchInput: React.FC<SearchInputProps> = ({
  initialValue = "",
  size = "md",
  placeholder = "Tìm truyện...",
  className = "",
  onSearch,
  // hasMiniSearch = false,
}) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Xử lý auto-suggestions bằng API
  useEffect(() => {
    // Dọn dẹp timer cũ nếu có
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (searchTerm && searchTerm.length >= 2) {
      // Thiết lập debounce để tránh gọi API quá nhiều
      debounceTimerRef.current = setTimeout(async () => {
        try {
          setIsLoading(true);
          const response = await fetch(
            `/api/suggestions?q=${encodeURIComponent(searchTerm)}`
          );
          const data = await response.json();

          if (data && Array.isArray(data.suggestions)) {
            setSuggestions(data.suggestions);
            setShowSuggestions(data.suggestions.length > 0);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        } catch (error) {
          console.error("Error fetching suggestions:", error);
          setSuggestions([]);
          setShowSuggestions(false);
        } finally {
          setIsLoading(false);
        }
      }, 300); // 300ms debounce
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm]);

  // Đóng suggestions khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      if (onSearch) {
        onSearch(searchTerm.trim());
      } else {
        router.push(`/tim-kiem?q=${encodeURIComponent(searchTerm.trim())}`);
      }
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion);
    if (onSearch) {
      onSearch(suggestion);
    } else {
      router.push(`/tim-kiem?q=${encodeURIComponent(suggestion)}`);
    }
    setShowSuggestions(false);
  };

  // DaisyUI sizing classes
  const sizeClasses = {
    sm: "input-sm",
    md: "input-md",
    lg: "input-lg",
  };

  const buttonSizeClasses = {
    sm: "btn-sm",
    md: "btn-md",
    lg: "btn-lg",
  };

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSearch} className="flex items-center">
        <div className="join w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={placeholder}
            className={`input input-bordered join-item w-full ${sizeClasses[size]}`}
            onFocus={() => setShowSuggestions(suggestions.length > 0)}
          />
          <button
            type="submit"
            className={`btn btn-primary join-item ${buttonSizeClasses[size]}`}
          >
            <SearchIcon className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} />
          </button>
        </div>
      </form>

      {/* Auto Suggestions */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-base-100 border border-base-300 rounded-md shadow-lg z-10"
        >
          <ul className="menu menu-compact p-0">
            {isLoading ? (
              <li className="py-2 px-4 text-center">
                <span className="loading loading-dots loading-xs"></span>
              </li>
            ) : suggestions.length > 0 ? (
              suggestions.map((suggestion, index) => (
                <li key={index}>
                  <button
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="py-2 px-4 hover:bg-base-200"
                  >
                    {suggestion}
                  </button>
                </li>
              ))
            ) : (
              <li className="py-2 px-4 text-center opacity-70">
                Không có gợi ý
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchInput;
