"use client";

import Script from "next/script";
import { useEffect } from "react";
import { createProtectionStyles } from "@/lib/contentProtection";

export const ContentProtectionScript = () => {
  useEffect(() => {
    // Add protection styles to head
    const styleElement = document.createElement("style");
    styleElement.id = "content-protection-styles";
    styleElement.innerHTML = createProtectionStyles();
    document.head.appendChild(styleElement);

    // Cleanup function
    return () => {
      const styleToRemove = document.getElementById(
        "content-protection-styles"
      );
      if (styleToRemove) {
        styleToRemove.remove();
      }
    };
  }, []);

  // Create base protection script - simple version
  const baseProtectionScript = `
    // Disable right-click menu
    document.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      return false;
    });

    // Disable copy
    document.addEventListener('copy', function(e) {
      e.preventDefault();
      return false;
    });

    // Disable text selection in content areas only
    document.querySelectorAll('.chapter-content, .story-content').forEach(function(element) {
      element.style.userSelect = 'none';
    });
  `;

  return (
    <>
      {/* Basic protection script only */}
      <Script id="base-protection" strategy="afterInteractive">
        {baseProtectionScript}
      </Script>

      {/* Simple text fragmentation for anti-scraping */}
      <Script
        id="text-protection"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            // Apply basic text protection to content
            (function() {
              setTimeout(() => {
                const contentElements = document.querySelectorAll('.chapter-content p');
                if (contentElements && contentElements.length > 0) {
                  contentElements.forEach(element => {
                    const originalText = element.innerText;
                    element.setAttribute('data-content', originalText);
                  });
                }
              }, 1000);
            })();
          `,
        }}
      />
    </>
  );
};

export default ContentProtectionScript;
