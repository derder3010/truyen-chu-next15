/**
 * Cấu hình ứng dụng
 * File này chứa các giá trị cấu hình cần thiết cho ứng dụng
 */

// Cấu hình phân trang
export const PAGINATION = {
  CHAPTERS_PER_PAGE: 10,
  STORIES_PER_PAGE: 30,
  LATEST_CHAPTERS_HOME_COUNT: 10,
  FEATURED_STORIES_HOME_COUNT: 6,
};

// Các liên kết điều hướng
export const NAV_LINKS = [
  { label: "Trang Chủ", path: "/" },
  { label: "Thể Loại", path: "/the-loai" },
  { label: "Hoàn Thành", path: "/truyen-full" },
  { label: "Xuất Bản", path: "/xuat-ban" },
  { label: "Ebook", path: "/ebook" },
  { label: "Lịch Sử", path: "/lich-su" },
];

// Danh sách ID video YouTube để hiển thị ngẫu nhiên trong trang tải ebook
export const YOUTUBE_VIDEOS = [
  "YNqQGNMR3R4", // Video 1
  "SjMhfEvqSrE", // Video 2
  "uj0MMi9-i5Y", // Video 3
  "YwVQ7-NBSMI", // Video 4
  "DBU8umhgUn0", // Video 5
];

// Các cấu hình khác
export const APP_CONFIG = {
  APP_NAME: "Truyện Full",
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "https://truyen-cv.vercel.app",
};
