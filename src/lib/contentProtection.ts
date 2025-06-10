/**
 * Content Protection Utility
 * Provides basic content protection methods for frontend content.
 */

// Creates CSS that prevents selection and screenshots but with exceptions
export const createProtectionStyles = () => `
  /* Prevent images from being dragged */
  img {
    pointer-events: none !important;
    -webkit-touch-callout: none !important;
  }
  
  /* Protect content selectively */
  .chapter-content, .story-content {
    -webkit-user-select: none !important;
    -moz-user-select: none !important;
    -ms-user-select: none !important;
    user-select: none !important;
  }
  
  /* Exception for input elements */
  input, textarea, [contenteditable="true"] {
    -webkit-user-select: auto !important;
    -moz-user-select: auto !important;
    -ms-user-select: auto !important;
    user-select: auto !important;
    pointer-events: auto !important;
  }
  
  /* Print styles - allow printing but with warning watermark */
  @media print {
    body::before {
      content: "Nội dung bản quyền DocTruyenFull.vn";
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
      color: rgba(0,0,0,0.15);
      transform: rotate(-45deg);
      pointer-events: none;
      z-index: 9999;
    }
  }
`;

// Simplified version that exports only the essential functions
export const getAllProtectionScripts = () => {
  return {
    styles: createProtectionStyles(),
  };
};
