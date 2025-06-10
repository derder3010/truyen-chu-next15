"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const ScrollToTop: React.FC = () => {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);

  // Cuộn lên đầu trang khi chuyển trang
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Hiển thị/ẩn nút dựa trên vị trí cuộn
  useEffect(() => {
    const toggleVisibility = () => {
      // Hiển thị nút khi đã cuộn xuống quá 300px
      setIsVisible(window.scrollY > 300);
    };

    // Đăng ký sự kiện lắng nghe cuộn
    window.addEventListener("scroll", toggleVisibility);

    // Kiểm tra trạng thái ban đầu
    toggleVisibility();

    // Dọn dẹp
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  // Xử lý sự kiện click vào nút
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return isVisible ? (
    <button
      onClick={scrollToTop}
      className="btn btn-circle btn-primary fixed bottom-24 md:bottom-6 right-6 z-50 shadow-lg opacity-90 hover:opacity-100 transition-opacity duration-300"
      aria-label="Cuộn lên đầu trang"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M5 15l7-7 7 7"
        />
      </svg>
    </button>
  ) : null;
};

export default ScrollToTop;
