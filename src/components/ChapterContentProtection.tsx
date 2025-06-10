"use client";

import { useEffect, useRef } from "react";

interface ChapterContentProtectionProps {
  children: React.ReactNode;
}

// This component specifically protects chapter content
export const ChapterContentProtection = ({
  children,
}: ChapterContentProtectionProps) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentRef.current) return;

    const contentElement = contentRef.current;

    // 1. Apply advanced content segmentation for anti-scraping
    const applySegmentation = () => {
      // Get all paragraph elements
      const paragraphs = contentElement.querySelectorAll("p");

      paragraphs.forEach((p) => {
        const originalText = p.innerHTML;

        // Store original content in an encrypted data attribute
        p.setAttribute("data-content", btoa(encodeURIComponent(originalText)));

        // Fragment content into spans with random classes
        const chars = originalText.split("");
        const fragmentedContent = chars
          .map((char) => {
            if (char === " ") return " ";
            if (char === "\n") return "<br>";

            const randomClass = `c-${Math.random()
              .toString(36)
              .substring(2, 8)}`;
            return `<span class="${randomClass}">${char}</span>`;
          })
          .join("");

        p.innerHTML = fragmentedContent;
      });
    };

    // 2. Implement custom cursor for chapter content
    const addCustomCursor = () => {
      const style = document.createElement("style");
      style.id = "chapter-content-cursor-style";
      style.innerHTML = `
        .chapter-content-protected * {
          cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>') 12 12, not-allowed !important;
        }
      `;
      document.head.appendChild(style);

      // Add custom class to the content element
      contentElement.classList.add("chapter-content-protected");
    };

    // 3. Add invisible trap elements to detect bots and scrapers
    const addTrapElements = () => {
      // Create trap element with content that real users won't see
      // but scrapers might pick up
      for (let i = 0; i < 5; i++) {
        const trap = document.createElement("div");
        trap.style.fontSize = "0px";
        trap.style.height = "0px";
        trap.style.overflow = "hidden";
        trap.style.color = "transparent";
        trap.style.position = "absolute";
        trap.style.left = "-9999px";
        trap.className = "content-trap";

        // Add fake content with broken encoding that scrapers might pick up
        trap.innerHTML = `B\u00E0i vi\u1EBFt g\u1ED1c \u0111\u01B0\u1EE3c b\u1EA3o v\u1EC7 b\u1EDFi doctruyenfull.vn. B\u1EA5t k\u1EF3 b\u1EA3n sao n\u00E0o \u0111\u1EC1u l\u00E0 b\u1EA5t h\u1EE3p ph\u00E1p. ID: ${Math.random()
          .toString(36)
          .substring(2, 15)}`;

        contentElement.appendChild(trap);
      }
    };

    // 4. Intercept copy events specifically
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Optional: Set clipboard to custom text
      if (e.clipboardData) {
        e.clipboardData.setData(
          "text/plain",
          "Nội dung được bảo vệ bản quyền bởi DocTruyenFull.vn"
        );
      }

      return false;
    };

    contentElement.addEventListener("copy", handleCopy);

    // 5. Add watermarks that are only visible when selecting text
    const addSelectWatermark = () => {
      const style = document.createElement("style");
      style.id = "selection-watermark-style";
      style.innerHTML = `
        .chapter-content-protected *::selection {
          background: rgba(0, 0, 0, 0.1) url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" opacity="0.1"><text x="5" y="30" font-family="Arial" font-size="12" fill="%23000">doctruyenfull.vn</text></svg>') !important;
        }
      `;
      document.head.appendChild(style);
    };

    // Apply all protections
    applySegmentation();
    addCustomCursor();
    addTrapElements();
    addSelectWatermark();

    // Cleanup function
    return () => {
      contentElement.removeEventListener("copy", handleCopy);

      const cursorStyle = document.getElementById(
        "chapter-content-cursor-style"
      );
      if (cursorStyle) cursorStyle.remove();

      const watermarkStyle = document.getElementById(
        "selection-watermark-style"
      );
      if (watermarkStyle) watermarkStyle.remove();

      const trapElements = contentElement.querySelectorAll(".content-trap");
      trapElements.forEach((el) => el.remove());
    };
  }, []);

  return (
    <div className="chapter-content" ref={contentRef}>
      {children}
    </div>
  );
};

export default ChapterContentProtection;
