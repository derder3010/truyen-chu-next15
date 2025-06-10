"use client";

import { useEffect } from "react";

export const ContentProtection = () => {
  useEffect(() => {
    // Chỉ áp dụng các biện pháp bảo vệ cơ bản

    // Vô hiệu hóa menu chuột phải
    const disableRightClick = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };
    document.addEventListener("contextmenu", disableRightClick);

    // Vô hiệu hóa copy/paste tùy chọn
    const disableCopy = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputOrTextarea =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // Cho phép copy trong các trường nhập liệu
      if (!isInputOrTextarea) {
        e.preventDefault();
        return false;
      }
      return true;
    };
    document.addEventListener("copy", disableCopy);
    document.addEventListener("cut", disableCopy);

    // Vô hiệu hóa kéo thả
    const disableDragDrop = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      const isInputOrTextarea =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (!isInputOrTextarea) {
        e.preventDefault();
        return false;
      }
      return true;
    };
    document.addEventListener("dragstart", disableDragDrop);

    // Thêm watermark ẩn để nhận diện nguồn sao chép
    const addHiddenWatermark = () => {
      // Tạo một watermark không nhìn thấy nhưng sẽ được bao gồm khi copy-paste
      const watermarkContainers = document.querySelectorAll(
        ".chapter-content, .story-content"
      );

      watermarkContainers.forEach((container) => {
        // Chỉ thêm nếu chưa có
        if (!container.querySelector(".hidden-watermark")) {
          const watermark = document.createElement("div");
          watermark.className = "hidden-watermark";
          watermark.style.position = "absolute";
          watermark.style.color = "transparent";
          watermark.style.userSelect = "none";
          watermark.style.zIndex = "-1";
          watermark.style.opacity = "0.01";
          watermark.style.pointerEvents = "none";

          // Tạo ID ngẫu nhiên cho mỗi phiên
          const sessionId = Math.random().toString(36).substring(2, 10);
          watermark.innerHTML = `Content from DocTruyenFull.vn - ID: ${sessionId} - ${window.location.href}`;

          if (container.firstChild) {
            container.insertBefore(watermark, container.firstChild);
          } else {
            container.appendChild(watermark);
          }
        }
      });
    };

    // Gọi hàm thêm watermark
    setTimeout(addHiddenWatermark, 1000);

    // Phát hiện phím tắt DevTools
    const handleKeyDown = (e: KeyboardEvent) => {
      // Chỉ ngăn F12 và Ctrl+Shift+I/J/C, không ảnh hưởng đến các phím tắt khác
      if (
        e.key === "F12" ||
        (e.ctrlKey &&
          e.shiftKey &&
          (e.key === "I" ||
            e.key === "i" ||
            e.key === "J" ||
            e.key === "j" ||
            e.key === "C" ||
            e.key === "c"))
      ) {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Cleanup function
    return () => {
      document.removeEventListener("contextmenu", disableRightClick);
      document.removeEventListener("copy", disableCopy);
      document.removeEventListener("cut", disableCopy);
      document.removeEventListener("dragstart", disableDragDrop);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return null;
};

export default ContentProtection;
