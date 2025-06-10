"use server";

import { Story, Chapter, StoryStatus } from "@/types";
import { db } from "./db";
import { stories, chapters, licensedStories, ebooks } from "./db/schema";
import { sql, eq, desc, like, ne, and } from "drizzle-orm";

// Database result types
interface DbStoryResult {
  id: number;
  title: string;
  slug: string;
  author: string | null;
  description: string | null;
  coverImage: string | null;
  genres: string | null;
  status: "completed" | "ongoing" | null;
  viewCount: number | null;
  createdAt: number | null;
  updatedAt: number | null;
  youtubeEmbed: string | null;
}

interface DbChapterResult {
  id: number;
  novelId: number;
  title: string;
  slug: string;
  content: string;
  chapterNumber: number;
  viewCount: number | null;
  createdAt: number | null;
  updatedAt: number | null;
}

// Helper functions to format database results to match frontend types
function formatStory(dbStory: DbStoryResult): Story {
  return {
    id: String(dbStory.id),
    title: dbStory.title,
    author: dbStory.author || "Unknown",
    coverImage:
      dbStory.coverImage || "https://picsum.photos/seed/default/300/450",
    genres: dbStory.genres
      ? dbStory.genres.split(",").map((g: string) => g.trim())
      : [],
    description: dbStory.description || "",
    status:
      dbStory.status === "completed"
        ? StoryStatus.COMPLETED
        : StoryStatus.ONGOING,
    totalChapters: 0, // Will be populated separately if needed
    views: dbStory.viewCount || 0,
    rating: 0, // Not implemented yet
    lastUpdated: dbStory.updatedAt
      ? new Date(dbStory.updatedAt * 1000).toLocaleDateString("vi-VN")
      : new Date().toLocaleDateString("vi-VN"),
    slug: dbStory.slug,
    youtubeEmbed: dbStory.youtubeEmbed || "",
  };
}

function formatChapter(dbChapter: DbChapterResult): Chapter {
  return {
    id: String(dbChapter.id),
    storyId: String(dbChapter.novelId),
    storySlug: "", // Will be populated separately if needed
    chapterNumber: dbChapter.chapterNumber,
    title: dbChapter.title,
    content: dbChapter.content,
    publishedDate: dbChapter.createdAt
      ? new Date(dbChapter.createdAt * 1000).toLocaleDateString("vi-VN")
      : new Date().toLocaleDateString("vi-VN"),
  };
}

// Server action to get all stories with pagination
export async function getStories(
  page = 1,
  limit = 10,
  status: string | null = null
) {
  try {
    // Use array to collect all results
    let results: DbStoryResult[] = [];

    // Run query based on status
    if (status) {
      const statusValue = status === "completed" ? "completed" : "ongoing";
      results = await db
        .select()
        .from(stories)
        .where(eq(stories.status, statusValue))
        .limit(limit)
        .offset((page - 1) * limit)
        .orderBy(desc(stories.createdAt));
    } else {
      results = await db
        .select()
        .from(stories)
        .limit(limit)
        .offset((page - 1) * limit)
        .orderBy(desc(stories.createdAt));
    }

    // Count total records
    let count = 0;
    if (status) {
      const statusValue = status === "completed" ? "completed" : "ongoing";
      const countResult = await db
        .select({ value: sql`count(*)` })
        .from(stories)
        .where(eq(stories.status, statusValue));
      count = Number(countResult[0]?.value || 0);
    } else {
      const countResult = await db
        .select({ value: sql`count(*)` })
        .from(stories);
      count = Number(countResult[0]?.value || 0);
    }

    return {
      stories: results.map(formatStory),
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching stories:", error);
    throw new Error("Failed to fetch stories");
  }
}

// Server action to get featured stories for homepage
export async function getFeaturedStories(count = 6) {
  try {
    const results = await db
      .select()
      .from(stories)
      .orderBy(desc(stories.viewCount))
      .limit(count);

    return results.map(formatStory);
  } catch (error) {
    console.error("Error fetching featured stories:", error);
    throw new Error("Failed to fetch featured stories");
  }
}

// Server action to get latest chapters for homepage
export async function getLatestChapters(count = 5) {
  try {
    // First get all stories
    const allStories = await db.select().from(stories).limit(10);

    const latestChapters = [];

    for (const story of allStories) {
      const latestChapter = await db
        .select()
        .from(chapters)
        .where(eq(chapters.novelId, story.id))
        .orderBy(desc(chapters.createdAt))
        .limit(1);

      if (latestChapter.length > 0) {
        const chapter = formatChapter(latestChapter[0]);
        chapter.storySlug = story.slug; // Add the story slug
        latestChapters.push(chapter);
      }

      if (latestChapters.length >= count) {
        break;
      }
    }

    return latestChapters;
  } catch (error) {
    console.error("Error fetching latest chapters:", error);
    throw new Error("Failed to fetch latest chapters");
  }
}

// Server action to get a story by slug
export async function getStoryBySlug(slug: string) {
  try {
    const storyResults = await db
      .select()
      .from(stories)
      .where(eq(stories.slug, slug));

    if (!storyResults.length) {
      return null;
    }

    const story = storyResults[0];

    // Increment view count
    await db
      .update(stories)
      .set({ viewCount: (story.viewCount || 0) + 1 })
      .where(eq(stories.id, story.id));

    // Get chapter count
    const chapterCountResult = await db
      .select({ count: sql`count(*)` })
      .from(chapters)
      .where(eq(chapters.novelId, story.id));

    const formattedStory = formatStory(story);
    formattedStory.totalChapters = Number(chapterCountResult[0]?.count || 0);

    return formattedStory;
  } catch (error) {
    console.error(`Error fetching story by slug ${slug}:`, error);
    throw new Error("Failed to fetch story");
  }
}

// Server action to get chapters for a story
export async function getChaptersByStoryId(
  storyId: number,
  page = 1,
  limit = 20
) {
  try {
    const offset = (page - 1) * limit;
    const results = await db
      .select()
      .from(chapters)
      .where(eq(chapters.novelId, storyId))
      .orderBy(desc(chapters.chapterNumber))
      .limit(limit)
      .offset(offset);

    const chapterCountResult = await db
      .select({ count: sql`count(*)` })
      .from(chapters)
      .where(eq(chapters.novelId, storyId));

    const total = Number(chapterCountResult[0]?.count || 0);

    // Get the story to add the slug to chapters
    const storyResults = await db
      .select()
      .from(stories)
      .where(eq(stories.id, storyId));

    const formattedChapters = results.map(formatChapter);

    if (storyResults.length > 0) {
      const story = storyResults[0];
      formattedChapters.forEach((chapter) => {
        chapter.storySlug = story.slug;
      });
    }

    return {
      chapters: formattedChapters,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error(`Error fetching chapters for story ${storyId}:`, error);
    throw new Error("Failed to fetch chapters");
  }
}

// Server action to get a specific chapter
export async function getChapter(novelId: number, chapterNumber: number) {
  try {
    // First check for novelId
    const chapterResults = await db
      .select()
      .from(chapters)
      .where(eq(chapters.novelId, novelId));

    // Then filter for chapter number in JavaScript
    const chapter = chapterResults.find(
      (c) => c.chapterNumber === chapterNumber
    );

    if (!chapter) {
      return null;
    }

    // Increment view count
    await db
      .update(chapters)
      .set({ viewCount: (chapter.viewCount || 0) + 1 })
      .where(eq(chapters.id, chapter.id));

    // Get the story to add the slug to the chapter
    const storyResults = await db
      .select()
      .from(stories)
      .where(eq(stories.id, novelId));

    const formattedChapter = formatChapter(chapter);

    if (storyResults.length > 0) {
      formattedChapter.storySlug = storyResults[0].slug;
    }

    return formattedChapter;
  } catch (error) {
    console.error(
      `Error fetching chapter ${chapterNumber} for novel ${novelId}:`,
      error
    );
    throw new Error("Failed to fetch chapter");
  }
}

// Server action to get all available genres
export async function getGenres() {
  try {
    // Lấy tất cả truyện từ database để xác định thể loại
    const allStories = await db.select().from(stories);

    // Đếm số lượng truyện cho mỗi thể loại
    const genreCount: Record<string, number> = {};

    // Extract all genres from stories
    allStories.forEach((story) => {
      if (story.genres) {
        story.genres.split(",").forEach((genre) => {
          const trimmedGenre = genre.trim();
          genreCount[trimmedGenre] = (genreCount[trimmedGenre] || 0) + 1;
        });
      }
    });

    // Chỉ giữ những thể loại có ít nhất 1 truyện
    const validGenres = Object.entries(genreCount)
      .filter(([, count]) => count > 0)
      .map(([genre]) => genre)
      .sort();

    return validGenres;
  } catch (error) {
    console.error("Error fetching genres:", error);
    throw new Error("Failed to fetch genres");
  }
}

// Server action to get featured licensed stories for homepage
export async function getFeaturedLicensedStories(count = 6) {
  try {
    // Truy vấn trực tiếp từ database thay vì qua API route
    const results = await db
      .select()
      .from(licensedStories)
      .orderBy(desc(licensedStories.createdAt))
      .limit(count);

    // Format dữ liệu trả về
    const formattedStories = results.map((story) => ({
      ...story,
      purchaseLinks: story.purchaseLinks
        ? JSON.parse(story.purchaseLinks as string)
        : [],
    }));

    return formattedStories;
  } catch (error) {
    console.error("Error fetching featured licensed stories:", error);
    return [];
  }
}

// Server action to get featured ebooks for homepage
export async function getFeaturedEbooks(count = 6) {
  try {
    // Truy vấn trực tiếp từ database thay vì qua API route
    const results = await db
      .select()
      .from(ebooks)
      .orderBy(desc(ebooks.createdAt))
      .limit(count);

    // Format dữ liệu trả về
    const formattedEbooks = results.map((ebook) => ({
      ...ebook,
      purchaseLinks: ebook.purchaseLinks
        ? JSON.parse(ebook.purchaseLinks as string)
        : [],
    }));

    return formattedEbooks;
  } catch (error) {
    console.error("Error fetching featured ebooks:", error);
    return [];
  }
}

// Server action to get related stories based on genre
export async function getRelatedStories(storyId: number, limit = 4) {
  try {
    // Get the current story first
    const storyResults = await db
      .select()
      .from(stories)
      .where(eq(stories.id, storyId));

    if (!storyResults.length) {
      return [];
    }

    const currentStory = storyResults[0];

    // If story has no genres, return random stories
    if (!currentStory.genres) {
      const randomStories = await db
        .select()
        .from(stories)
        .where(ne(stories.id, storyId))
        .orderBy(sql`RANDOM()`)
        .limit(limit);

      return randomStories.map(formatStory);
    }

    // Select a random genre from the story's genres
    const genres = currentStory.genres.split(",").map((g) => g.trim());
    const randomGenre = genres[Math.floor(Math.random() * genres.length)];

    // Find stories with similar genre
    const likeGenre = `%${randomGenre}%`;
    const relatedStories = await db
      .select()
      .from(stories)
      .where(and(ne(stories.id, storyId), like(stories.genres, likeGenre)))
      .orderBy(sql`RANDOM()`)
      .limit(limit);

    // If not enough related stories found, fill with random stories
    if (relatedStories.length < limit) {
      const remainingCount = limit - relatedStories.length;
      const existingIds = relatedStories.map((s) => s.id);
      existingIds.push(storyId); // Add current story id to exclude

      // Construct a NOT IN condition dynamically with multiple OR conditions
      const randomStories = await db
        .select()
        .from(stories)
        .where(and(...existingIds.map((id) => ne(stories.id, id))))
        .orderBy(sql`RANDOM()`)
        .limit(remainingCount);

      return [...relatedStories, ...randomStories].map(formatStory);
    }

    return relatedStories.map(formatStory);
  } catch (error) {
    console.error(
      `Error fetching related stories for story ${storyId}:`,
      error
    );
    return [];
  }
}

// Server action to get stories grouped by genres
export async function getStoriesByGenres(
  genres: string[],
  limit = 6,
  excludedStoryIds: number[] = []
) {
  try {
    if (!genres.length) {
      return [];
    }

    const result = [];

    // Get stories for each genre
    for (const genre of genres) {
      const likeGenre = `%${genre}%`;

      // Tạo điều kiện loại bỏ các truyện đã được chọn cho bất kỳ thể loại nào
      const excludeConditions = [...excludedStoryIds];

      // Lấy truyện cho thể loại hiện tại
      const genreStories = await db
        .select()
        .from(stories)
        .where(
          and(
            like(stories.genres, likeGenre),
            ...excludeConditions.map((id) => ne(stories.id, id))
          )
        )
        .orderBy(sql`RANDOM()`)
        .limit(limit);

      // Nếu có truyện cho thể loại này, thêm vào kết quả
      if (genreStories.length > 0) {
        result.push({
          genre,
          stories: genreStories.map(formatStory),
        });

        // Cập nhật danh sách excludedStoryIds để tránh trùng lặp
        excludedStoryIds = [
          ...excludedStoryIds,
          ...genreStories.map((s) => s.id),
        ];
      }
    }

    return result;
  } catch (error) {
    console.error(`Error fetching stories by genres:`, error);
    return [];
  }
}

// Server action to get an ebook by slug
export async function getEbookBySlug(slugOrId: string) {
  try {
    let ebookResults;

    // Check if this is a numeric ID
    if (/^\d+$/.test(slugOrId)) {
      // If numeric ID, query by ID
      ebookResults = await db
        .select()
        .from(ebooks)
        .where(eq(ebooks.id, parseInt(slugOrId)))
        .limit(1);
    } else {
      // Otherwise query by slug
      ebookResults = await db
        .select()
        .from(ebooks)
        .where(eq(ebooks.slug, slugOrId))
        .limit(1);
    }

    if (!ebookResults.length) {
      return null;
    }

    const ebook = ebookResults[0];

    // Process purchase links
    return {
      ...ebook,
      purchaseLinks: ebook.purchaseLinks
        ? JSON.parse(ebook.purchaseLinks as string)
        : [],
    };
  } catch (error) {
    console.error(`Error fetching ebook by slug/id ${slugOrId}:`, error);
    return null;
  }
}

// Server action to get a licensed story by slug
export async function getLicensedStoryBySlug(slugOrId: string) {
  try {
    let storyResults;

    // Check if this is a numeric ID
    if (/^\d+$/.test(slugOrId)) {
      // If numeric ID, query by ID
      storyResults = await db
        .select()
        .from(licensedStories)
        .where(eq(licensedStories.id, parseInt(slugOrId)))
        .limit(1);
    } else {
      // Otherwise query by slug
      storyResults = await db
        .select()
        .from(licensedStories)
        .where(eq(licensedStories.slug, slugOrId))
        .limit(1);
    }

    if (!storyResults.length) {
      return null;
    }

    const story = storyResults[0];

    // Process purchase links
    return {
      ...story,
      purchaseLinks: story.purchaseLinks
        ? JSON.parse(story.purchaseLinks as string)
        : [],
    };
  } catch (error) {
    console.error(
      `Error fetching licensed story by slug/id ${slugOrId}:`,
      error
    );
    return null;
  }
}

// Server action to update a licensed story
export async function updateLicensedStory(
  slugOrId: string,
  data: {
    title: string;
    slug: string;
    author: string;
    description: string;
    coverImage: string;
    genres: string;
    status: "ongoing" | "completed";
    purchaseLinks: { store: string; url: string }[];
  }
) {
  try {
    // Check if the story exists
    let existingStory;

    // Check if this is a numeric ID
    if (/^\d+$/.test(slugOrId)) {
      // If numeric ID, query by ID
      existingStory = await db
        .select()
        .from(licensedStories)
        .where(eq(licensedStories.id, parseInt(slugOrId)))
        .limit(1);
    } else {
      // Otherwise query by slug
      existingStory = await db
        .select()
        .from(licensedStories)
        .where(eq(licensedStories.slug, slugOrId))
        .limit(1);
    }

    if (existingStory.length === 0) {
      throw new Error("Licensed story not found");
    }

    // Process purchase links (convert to JSON string)
    const purchaseLinks = data.purchaseLinks
      ? JSON.stringify(data.purchaseLinks)
      : null;

    // Check slug uniqueness (if changed)
    if (data.slug !== existingStory[0].slug) {
      const slugExists = await db
        .select()
        .from(licensedStories)
        .where(eq(licensedStories.slug, data.slug))
        .limit(1);

      if (slugExists.length > 0) {
        throw new Error("A licensed story with this slug already exists");
      }
    }

    // Update the story in the database
    const updatedStory = await db
      .update(licensedStories)
      .set({
        title: data.title,
        slug: data.slug,
        author: data.author,
        description: data.description,
        coverImage: data.coverImage,
        genres: data.genres,
        status: data.status,
        purchaseLinks,
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .where(
        /^\d+$/.test(slugOrId)
          ? eq(licensedStories.id, parseInt(slugOrId))
          : eq(licensedStories.slug, slugOrId)
      )
      .returning();

    // Return the updated story with parsed purchase links
    return {
      ...updatedStory[0],
      purchaseLinks: data.purchaseLinks || [],
    };
  } catch (error) {
    console.error("Error updating licensed story:", error);
    throw error;
  }
}

// Server action to update an ebook by slug
export async function updateEbook(
  slugOrId: string,
  data: {
    title: string;
    slug: string;
    author: string;
    description: string;
    coverImage: string;
    genres: string;
    status: "ongoing" | "completed";
    purchaseLinks: { store: string; url: string }[];
  }
) {
  try {
    // Check if the ebook exists
    let existingEbook;

    // Check if this is a numeric ID
    if (/^\d+$/.test(slugOrId)) {
      // If numeric ID, query by ID
      existingEbook = await db
        .select()
        .from(ebooks)
        .where(eq(ebooks.id, parseInt(slugOrId)))
        .limit(1);
    } else {
      // Otherwise query by slug
      existingEbook = await db
        .select()
        .from(ebooks)
        .where(eq(ebooks.slug, slugOrId))
        .limit(1);
    }

    if (existingEbook.length === 0) {
      throw new Error("Ebook not found");
    }

    // Process purchase links (convert to JSON string)
    const purchaseLinks = data.purchaseLinks
      ? JSON.stringify(data.purchaseLinks)
      : null;

    // Check slug uniqueness (if changed)
    if (data.slug !== existingEbook[0].slug) {
      const slugExists = await db
        .select()
        .from(ebooks)
        .where(eq(ebooks.slug, data.slug))
        .limit(1);

      if (slugExists.length > 0) {
        throw new Error("An ebook with this slug already exists");
      }
    }

    // Update the ebook in the database
    const updatedEbook = await db
      .update(ebooks)
      .set({
        title: data.title,
        slug: data.slug,
        author: data.author,
        description: data.description,
        coverImage: data.coverImage,
        genres: data.genres,
        status: data.status,
        purchaseLinks,
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .where(
        /^\d+$/.test(slugOrId)
          ? eq(ebooks.id, parseInt(slugOrId))
          : eq(ebooks.slug, slugOrId)
      )
      .returning();

    // Return the updated ebook with parsed purchase links
    return {
      ...updatedEbook[0],
      purchaseLinks: data.purchaseLinks || [],
    };
  } catch (error) {
    console.error("Error updating ebook:", error);
    throw error;
  }
}
