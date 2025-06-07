import { Story, Chapter, StoryStatus } from "@/types";

// Export StoryStatus so it can be imported from this module
export { StoryStatus };

export const NAV_LINKS = [
  { label: "Trang Chủ", path: "/" },
  { label: "Thể Loại", path: "/the-loai" },
  { label: "Truyện Full", path: "/truyen-full" },
  { label: "Lịch Sử Đọc", path: "/lich-su" },
];

export const MOCK_STORIES: Story[] = [
  {
    id: "1",
    title: "Linh Vũ Thiên Hạ",
    author: "Vũ Phong",
    coverImage: "https://picsum.photos/seed/linhvu/300/450",
    genres: ["Tiên Hiệp", "Huyền Huyễn", "Dị Giới"],
    description:
      "Truyện này thì nổi tiếng khỏi phải bàn rồi. Truyện kể về ma quỷ tại chính thủ đô Hà Nội thời 7 8x gì đó... Cũng chả có gì cần nói nhiều ngoài từ hay và sợ. Ngoài ra truyện cũng được các MC đọc lại, kèm âm thanh các thứ tối ngủ nghe rất phiêu... Ai lười đọc thì có thể tìm truyện audio đất độc nhé. Truyện này thì nổi tiếng khỏi phải bàn rồi. Truyện kể về ma quỷ tại chính thủ đô Hà Nội thời 7 8x gì đó... Cũng chả có gì cần nói nhiều ngoài từ hay và sợ. Ngoài ra truyện cũng được các MC đọc lại, kèm âm thanh các thứ tối ngủ nghe rất phiêu... Ai lười đọc thì có thể tìm truyện audio đất độc nhé. Truyện này thì nổi tiếng khỏi phải bàn rồi. Truyện kể về ma quỷ tại chính thủ đô Hà Nội thời 7 8x gì đó... Cũng chả có gì cần nói nhiều ngoài từ hay và sợ. Ngoài ra truyện cũng được các MC đọc lại, kèm âm thanh các thứ tối ngủ nghe rất phiêu... Ai lười đọc thì có thể tìm truyện audio đất độc nhé. Truyện này thì nổi tiếng khỏi phải bàn rồi. Truyện kể về ma quỷ tại chính thủ đô Hà Nội thời 7 8x gì đó... Cũng chả có gì cần nói nhiều ngoài từ hay và sợ. Ngoài ra truyện cũng được các MC đọc lại, kèm âm thanh các thứ tối ngủ nghe rất phiêu... Ai lười đọc thì có thể tìm truyện audio đất độc nhé. Truyện này thì nổi tiếng khỏi phải bàn rồi. Truyện kể về ma quỷ tại chính thủ đô Hà Nội thời 7 8x gì đó... Cũng chả có gì cần nói nhiều ngoài từ hay và sợ. Ngoài ra truyện cũng được các MC đọc lại, kèm âm thanh các thứ tối ngủ nghe rất phiêu... Ai lười đọc thì có thể tìm truyện audio đất độc nhé.",
    status: StoryStatus.COMPLETED,
    totalChapters: 3886,
    views: 1205678,
    rating: 4.8,
    lastUpdated: "12/08/2021",
    slug: "linh-vu-thien-ha",
  },
  {
    id: "2",
    title: "Đấu Phá Thương Khung",
    author: "Thiên Tằm Thổ Đậu",
    coverImage: "https://picsum.photos/seed/daupha/300/450",
    genres: ["Dị Giới", "Huyền Huyễn", "Xuyên Không"],
    description:
      "Đây là một thế giới đấu khí, không có ma pháp hoa tiếu diễm lệ, chỉ có đấu khí cương mãnh phồn thịnh đến đỉnh phong!",
    status: StoryStatus.COMPLETED,
    totalChapters: 1623,
    views: 2500987,
    rating: 4.9,
    lastUpdated: "10/05/2018",
    slug: "dau-pha-thuong-khung",
  },
  {
    id: "3",
    title: "Phàm Nhân Tu Tiên",
    author: "Vong Ngữ",
    coverImage: "https://picsum.photos/seed/phamnhan/300/450",
    genres: ["Tiên Hiệp", "Kiếm Hiệp"],
    description:
      "Một tiểu tử nghèo bình thường ở sơn thôn, ngẫu nhiên một lần tình cờ xuống núi gia nhập vào một môn phái giang hồ nhỏ bé...",
    status: StoryStatus.COMPLETED,
    totalChapters: 2446,
    views: 1800500,
    rating: 4.7,
    lastUpdated: "01/11/2013",
    slug: "pham-nhan-tu-tien",
  },
  {
    id: "4",
    title: "Vạn Cổ Thần Đế",
    author: "Phi Thiên Ngư",
    coverImage: "https://picsum.photos/seed/vanco/300/450",
    genres: ["Huyền Huyễn", "Trọng Sinh"],
    description:
      "Tám trăm năm trước, Minh Đế Trương Nhược Trần bị vị hôn thê của hắn là Trì Dao công chúa giết chết, thiên kiêu một đời cứ thế vẫn lạc...",
    status: StoryStatus.ONGOING,
    totalChapters: 4000, // Approx, still ongoing
    views: 950321,
    rating: 4.6,
    lastUpdated: "Mới nhất",
    slug: "van-co-than-de",
  },
  {
    id: "5",
    title: "Thần Mộ",
    author: "Thần Đông",
    coverImage: "https://picsum.photos/seed/thanmo/300/450",
    genres: ["Huyền Huyễn", "Tiên Hiệp", "Đông Phương"],
    description:
      "Một thanh niên bình thường sau khi chết đi một vạn năm đã sống lại từ một ngôi mộ cổ trong thần ma nghĩa địa...",
    status: StoryStatus.COMPLETED,
    totalChapters: 300,
    views: 850123,
    rating: 4.5,
    lastUpdated: "05/09/2009",
    slug: "than-mo",
  },
  {
    id: "6",
    title: "Nguyên Tôn",
    author: "Thiên Tằm Thổ Đậu",
    coverImage: "https://picsum.photos/seed/nguyenton/300/450",
    genres: ["Huyền Huyễn", "Dị Giới"],
    description:
      "Ta có một ngụm Huyền Hoàng Khí, có thể thôn thiên địa nhật nguyệt tinh thần...",
    status: StoryStatus.ONGOING,
    totalChapters: 1500, // Approx
    views: 1100456,
    rating: 4.7,
    lastUpdated: "Mới nhất",
    slug: "nguyen-ton",
  },
];

export const MOCK_CHAPTERS: Chapter[] = [
  // Linh Vu Thien Ha
  {
    id: "lvth-1",
    storyId: "1",
    storySlug: "linh-vu-thien-ha",
    chapterNumber: 1,
    title: "Chương 1: Xuyên qua dị giới",
    content: "Nội dung chương 1 của Linh Vũ Thiên Hạ...",
    publishedDate: "01/01/2024",
  },
  {
    id: "lvth-2",
    storyId: "1",
    storySlug: "linh-vu-thien-ha",
    chapterNumber: 2,
    title: "Chương 2: Thức tỉnh võ hồn",
    content: "Nội dung chương 2 của Linh Vũ Thiên Hạ...",
    publishedDate: "02/01/2024",
  },
  {
    id: "lvth-3",
    storyId: "1",
    storySlug: "linh-vu-thien-ha",
    chapterNumber: 3,
    title: "Chương 3: Đại Hội Gia Tộc",
    content: "Nội dung chương 3 của Linh Vũ Thiên Hạ...",
    publishedDate: "03/01/2024",
  },
  // ... add up to 50 chapters for Linh Vu Thien Ha
  // Dau Pha Thuong Khung
  {
    id: "dp-1",
    storyId: "2",
    storySlug: "dau-pha-thuong-khung",
    chapterNumber: 1,
    title: "Chương 1: Thiên tài vẫn lạc",
    content: "Nội dung chương 1 của Đấu Phá Thương Khung...",
    publishedDate: "10/01/2024",
  },
  {
    id: "dp-2",
    storyId: "2",
    storySlug: "dau-pha-thuong-khung",
    chapterNumber: 2,
    title: "Chương 2: Dược lão",
    content: "Nội dung chương 2 của Đấu Phá Thương Khung...",
    publishedDate: "11/01/2024",
  },
  // Pham Nhan Tu Tien
  {
    id: "pntt-1",
    storyId: "3",
    storySlug: "pham-nhan-tu-tien",
    chapterNumber: 1,
    title: "Chương 1: Thiếu niên Hàn Lập",
    content: "Nội dung chương 1 của Phàm Nhân Tu Tiên...",
    publishedDate: "15/01/2024",
  },
  // Van Co Than De
  {
    id: "vctd-1",
    storyId: "4",
    storySlug: "van-co-than-de",
    chapterNumber: 1,
    title: "Chương 1: Tám trăm năm sau",
    content: "Nội dung chương 1 của Vạn Cổ Thần Đế...",
    publishedDate: "20/01/2024",
  },
  // Than Mo
  {
    id: "tm-1",
    storyId: "5",
    storySlug: "than-mo",
    chapterNumber: 1,
    title: "Chương 1: Thần Ma Nghĩa Địa",
    content: "Nội dung chương 1 của Thần Mộ...",
    publishedDate: "22/01/2024",
  },
  // Nguyen Ton
  {
    id: "nt-1",
    storyId: "6",
    storySlug: "nguyen-ton",
    chapterNumber: 1,
    title: "Chương 1: Thiếu Niên Chu Nguyên",
    content: "Nội dung chương 1 của Nguyên Tôn...",
    publishedDate: "25/01/2024",
  },
];

// Generate more chapters for Linh Vu Thien Ha for testing pagination
for (let i = 4; i <= 50; i++) {
  MOCK_CHAPTERS.push({
    id: `lvth-${i}`,
    storyId: "1",
    storySlug: "linh-vu-thien-ha",
    chapterNumber: i,
    title: `Chương ${i}: Diễn biến mới`,
    content:
      `Đây là nội dung chi tiết của chương ${i} trong truyện Linh Vũ Thiên Hạ. Chương này kể về những sự kiện quan trọng và những thử thách mới mà nhân vật chính Lục Thiếu Du phải đối mặt trên con đường tu luyện của mình. Mỗi chương là một bước tiến mới, hé lộ thêm những bí mật của thế giới rộng lớn và huyền bí này. Lục Thiếu Du sẽ gặp gỡ những nhân vật mới, học được những kỹ năng mới, và đối đầu với những kẻ thù mạnh mẽ hơn. Hãy cùng theo dõi hành trình của anh ấy!`.repeat(
        10
      ), // Longer content
    publishedDate: `${String(i).padStart(2, "0")}/01/2024`,
  });
}

export const GENRES_LIST = [
  "Tiên Hiệp",
  "Huyền Huyễn",
  "Dị Giới",
  "Kiếm Hiệp",
  "Trọng Sinh",
  "Đô Thị",
  "Khoa Huyễn",
  "Lịch Sử",
  "Quân Sự",
  "Võng Du",
  "Đồng Nhân",
];

export const LATEST_CHAPTERS_HOME_COUNT = 5;
export const FEATURED_STORIES_HOME_COUNT = 6;
export const CHAPTERS_PER_PAGE = 20;
