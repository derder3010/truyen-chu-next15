"use client";

import React, { useEffect, useState } from "react";

interface FontSizeControlsProps {
  defaultSize?: number;
}

// Utility function to apply font size that can be called from anywhere
export const applyFontSize = (size: number): void => {
  if (typeof window === "undefined") return;

  console.log("Applying font size:", size);

  // Apply to all chapter content elements
  const contentDivs = document.querySelectorAll(".chapter-content-text");
  if (contentDivs.length === 0) {
    console.warn("No elements found with class .chapter-content-text");
  }

  contentDivs.forEach((div) => {
    (div as HTMLElement).style.fontSize = `${size}px`;
    console.log("Applied font size to element:", div);
  });

  // Store the current size in localStorage for persistence
  localStorage.setItem("chapterFontSize", size.toString());
};

// Function to get saved font size
export const getSavedFontSize = (defaultSize: number = 18): number => {
  // Check if we're in a browser environment
  if (typeof window === "undefined") return defaultSize;

  try {
    const savedSize = localStorage.getItem("chapterFontSize");
    if (!savedSize) {
      console.log("No saved font size found, using default:", defaultSize);
      return defaultSize;
    }

    const parsedSize = parseInt(savedSize, 10);
    console.log("Retrieved saved font size:", parsedSize);
    return isNaN(parsedSize) ? defaultSize : parsedSize;
  } catch (error) {
    console.error("Error getting saved font size:", error);
    return defaultSize;
  }
};

// A global function that can be called from anywhere to apply the saved font size
export const applySavedFontSize = (): void => {
  const savedSize = getSavedFontSize();
  applyFontSize(savedSize);
};

const FontSizeControls: React.FC<FontSizeControlsProps> = ({
  defaultSize = 18,
}) => {
  const [fontSize, setFontSize] = useState<number>(defaultSize);

  // Load font size from localStorage on initial render
  useEffect(() => {
    try {
      const savedSize = localStorage.getItem("chapterFontSize");
      if (savedSize) {
        const parsedSize = parseInt(savedSize, 10);
        setFontSize(parsedSize);
        applyFontSize(parsedSize);
      }
    } catch (error) {
      console.error("Error loading font size:", error);
    }
  }, []);

  // Function to apply font size
  const applyFontSize = (size: number) => {
    try {
      // Apply to all chapter content divs
      const contentDivs = document.querySelectorAll(".chapter-content-text");
      contentDivs.forEach((div) => {
        (div as HTMLElement).style.fontSize = `${size}px`;
      });

      // Save to localStorage
      localStorage.setItem("chapterFontSize", size.toString());
    } catch (error) {
      console.error("Error applying font size:", error);
    }
  };

  const handleFontSizeChange = (delta: number) => {
    setFontSize((prevSize) => {
      const newSize = Math.max(12, Math.min(32, prevSize + delta));
      applyFontSize(newSize);
      return newSize;
    });
  };

  // Listen for navigation events (custom event that can be triggered when needed)
  useEffect(() => {
    const reapplyFontSize = () => {
      try {
        const savedSize = localStorage.getItem("chapterFontSize");
        if (savedSize) {
          const parsedSize = parseInt(savedSize, 10);
          applyFontSize(parsedSize);
          setFontSize(parsedSize);
        }
      } catch (error) {
        console.error("Error reapplying font size:", error);
      }
    };

    // Listen for when chapter content changes
    window.addEventListener("fontSizeReapply", reapplyFontSize);

    // Also reapply when DOM content is loaded
    window.addEventListener("DOMContentLoaded", reapplyFontSize);

    // Set up MutationObserver to detect when chapter content changes
    try {
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (
            mutation.type === "childList" &&
            mutation.addedNodes.length > 0 &&
            document.querySelector(".chapter-content-text")
          ) {
            // Content has changed, reapply font size
            reapplyFontSize();
            break;
          }
        }
      });

      // Start observing the document body for changes
      observer.observe(document.body, { childList: true, subtree: true });

      return () => {
        window.removeEventListener("fontSizeReapply", reapplyFontSize);
        window.removeEventListener("DOMContentLoaded", reapplyFontSize);
        observer.disconnect();
      };
    } catch (error) {
      console.error("Error setting up observer:", error);
      return () => {
        window.removeEventListener("fontSizeReapply", reapplyFontSize);
        window.removeEventListener("DOMContentLoaded", reapplyFontSize);
      };
    }
  }, []);

  return (
    <div className="join">
      <button
        onClick={() => handleFontSizeChange(-2)}
        disabled={fontSize <= 12}
        className="btn btn-sm join-item"
        title="Giảm cỡ chữ"
      >
        A-
      </button>
      <span className="btn btn-sm join-item no-animation pointer-events-none">
        {fontSize}
      </span>
      <button
        onClick={() => handleFontSizeChange(2)}
        disabled={fontSize >= 32}
        className="btn btn-sm join-item"
        title="Tăng cỡ chữ"
      >
        A+
      </button>
    </div>
  );
};

export default FontSizeControls;
