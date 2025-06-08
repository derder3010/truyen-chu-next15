/**
 * Cấu hình ứng dụng
 * File này chứa các giá trị cấu hình cần thiết cho ứng dụng
 */

// Cấu hình phân trang
export const PAGINATION = {
  CHAPTERS_PER_PAGE: 10,
  STORIES_PER_PAGE: 10,
  LATEST_CHAPTERS_HOME_COUNT: 5,
  FEATURED_STORIES_HOME_COUNT: 6,
};

// Các liên kết điều hướng
export const NAV_LINKS = [
  { label: "Trang Chủ", path: "/" },
  { label: "Thể Loại", path: "/the-loai" },
  { label: "Hoàn Thành", path: "/truyen-full" },
  { label: "Lịch Sử", path: "/lich-su" },
];

// Các cấu hình khác
export const APP_CONFIG = {
  APP_NAME: "Truyện Full",
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "https://truyen-cv.vercel.app",
};
