"use client";

const FontSizeScript = () => {
  // Script to apply font size when page is fully loaded
  const fontSizeApplyScript = `
    document.addEventListener('DOMContentLoaded', function() {
      // Kích hoạt sự kiện để thông báo với FontSizeControls
      window.dispatchEvent(new Event('fontSizeReapply'));
    });
  `;

  return <script dangerouslySetInnerHTML={{ __html: fontSizeApplyScript }} />;
};

export default FontSizeScript;
