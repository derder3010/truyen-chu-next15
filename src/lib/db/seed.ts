import { db } from "./";
import { stories, chapters } from "./schema";
import { StoryStatus } from "@/types";

// Dữ liệu mẫu để seed database
const SEED_STORIES = [
  {
    id: "1",
    title: "Linh Vũ Thiên Hạ",
    author: "Vũ Phong",
    coverImage: "https://picsum.photos/seed/linhvu/300/450",
    genres: ["Tiên Hiệp", "Huyền Huyễn", "Dị Giới"],
    description:
      "Truyện này thì nổi tiếng khỏi phải bàn rồi. Truyện kể về ma quỷ tại chính thủ đô Hà Nội thời 7 8x gì đó... Cũng chả có gì cần nói nhiều ngoài từ hay và sợ.",
    status: StoryStatus.COMPLETED,
    slug: "linh-vu-thien-ha",
    views: 1205678,
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
    slug: "dau-pha-thuong-khung",
    views: 2500987,
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
    slug: "pham-nhan-tu-tien",
    views: 1800500,
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
    slug: "van-co-than-de",
    views: 950321,
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
    slug: "than-mo",
    views: 850123,
  },
];

const SEED_CHAPTERS = [
  {
    id: "lvth-1",
    storyId: "1",
    storySlug: "linh-vu-thien-ha",
    chapterNumber: 1,
    title: "Chương 1: Xuyên qua dị giới",
    content: "Nội dung chương 1 của Linh Vũ Thiên Hạ...",
  },
  {
    id: "lvth-2",
    storyId: "1",
    storySlug: "linh-vu-thien-ha",
    chapterNumber: 2,
    title: "Chương 2: Thức tỉnh võ hồn",
    content: "Nội dung chương 2 của Linh Vũ Thiên Hạ...",
  },
  {
    id: "lvth-3",
    storyId: "1",
    storySlug: "linh-vu-thien-ha",
    chapterNumber: 3,
    title: "Chương 3: Đại Hội Gia Tộc",
    content: "Nội dung chương 3 của Linh Vũ Thiên Hạ...",
  },
  {
    id: "dp-1",
    storyId: "2",
    storySlug: "dau-pha-thuong-khung",
    chapterNumber: 1,
    title: "Chương 1: Thiên tài vẫn lạc",
    content: "Nội dung chương 1 của Đấu Phá Thương Khung...",
  },
  {
    id: "dp-2",
    storyId: "2",
    storySlug: "dau-pha-thuong-khung",
    chapterNumber: 2,
    title: "Chương 2: Dược lão",
    content: "Nội dung chương 2 của Đấu Phá Thương Khung...",
  },
  {
    id: "pntt-1",
    storyId: "3",
    storySlug: "pham-nhan-tu-tien",
    chapterNumber: 1,
    title: "Chương 1: Thiếu niên Hàn Lập",
    content: "Nội dung chương 1 của Phàm Nhân Tu Tiên...",
  },
  {
    id: "vctd-1",
    storyId: "4",
    storySlug: "van-co-than-de",
    chapterNumber: 1,
    title: "Chương 1: Tám trăm năm sau",
    content: "Nội dung chương 1 của Vạn Cổ Thần Đế...",
  },
  {
    id: "tm-1",
    storyId: "5",
    storySlug: "than-mo",
    chapterNumber: 1,
    title: "Chương 1: Thần Ma Nghĩa Địa",
    content: "Nội dung chương 1 của Thần Mộ...",
  },
];

async function seed() {
  console.log("Seeding database...");

  // Clear existing data
  console.log("Clearing existing data...");
  await db.delete(chapters);
  await db.delete(stories);

  // Insert stories
  console.log("Inserting stories...");
  for (const story of SEED_STORIES) {
    // Convert genres array to comma-separated string
    const genresString = story.genres.join(",");

    // Convert StoryStatus to database enum
    const status =
      story.status === StoryStatus.COMPLETED ? "completed" : "ongoing";

    // Insert story
    await db.insert(stories).values({
      title: story.title,
      slug: story.slug,
      author: story.author,
      description: story.description,
      coverImage: story.coverImage,
      genres: genresString,
      status,
      viewCount: story.views,
      createdAt: Math.floor(Date.now() / 1000),
      updatedAt: Math.floor(Date.now() / 1000),
    });
  }

  // Get inserted stories to get their IDs
  const insertedStories = await db.select().from(stories);
  const storySlugToId = new Map(insertedStories.map((s) => [s.slug, s.id]));

  // Insert chapters
  console.log("Inserting chapters...");
  for (const chapter of SEED_CHAPTERS) {
    const novelId = storySlugToId.get(chapter.storySlug);
    if (!novelId) {
      console.warn(
        `Story with slug ${chapter.storySlug} not found, skipping chapter ${chapter.chapterNumber}`
      );
      continue;
    }

    // Create slug for chapter
    const chapterSlug = `chuong-${chapter.chapterNumber}`;

    // Insert chapter
    await db.insert(chapters).values({
      novelId,
      title: chapter.title,
      slug: chapterSlug,
      content: chapter.content,
      chapterNumber: chapter.chapterNumber,
      viewCount: 0,
      createdAt: Math.floor(Date.now() / 1000),
      updatedAt: Math.floor(Date.now() / 1000),
    });
  }

  console.log("Database seeded successfully!");
}

// Run seed function
seed()
  .catch((error) => {
    console.error("Error seeding database:", error);
    process.exit(1);
  })
  .finally(async () => {
    console.log("Seed process completed.");
    process.exit(0);
  });
