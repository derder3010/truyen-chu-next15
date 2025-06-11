"use server";

// Import all necessary dependencies
import { Story, Chapter, StoryStatus } from "@/types";
import { db } from "./db";
import { PAGINATION } from "./config";
import {
  stories,
  chapters,
  licensedStories,
  ebooks,
  advertisements,
  users,
} from "./db/schema";
import { sql, eq, desc, like, ne, and, or, asc } from "drizzle-orm";
import { getSession } from "./auth/server";
import { createSearchIndex, search } from "./search";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { UserRole } from "@/types/auth";

// Simple revalidation functions
async function revalidateStory(slug: string) {
  revalidatePath(`/truyen/${slug}`);
}

async function revalidateChapter(storySlug: string, chapterNumber: number) {
  revalidatePath(`/truyen/${storySlug}/${chapterNumber}`);
}

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

// =====================================================================
// GENERAL API ACTIONS (from api.ts)
// =====================================================================

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

    const storySlug = storyResults.length > 0 ? storyResults[0].slug : "";

    // Add the story slug to each chapter
    const formattedResults = results.map((chapter) => {
      const formatted = formatChapter(chapter);
      formatted.storySlug = storySlug;
      return formatted;
    });

    return {
      chapters: formattedResults,
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

// Server action to get related stories
export async function getRelatedStories(storyId: number, limit = 4) {
  try {
    // Get the current story to extract genres
    const currentStory = await db
      .select()
      .from(stories)
      .where(eq(stories.id, storyId))
      .limit(1);

    if (!currentStory.length) {
      throw new Error("Story not found");
    }

    // Extract genres from the current story
    const genres = currentStory[0].genres
      ? currentStory[0].genres.split(",").map((g) => g.trim())
      : [];

    // If no genres, return random stories
    if (!genres.length) {
      const randomStories = await db
        .select()
        .from(stories)
        .where(ne(stories.id, storyId)) // Exclude current story
        .orderBy(sql`RANDOM()`)
        .limit(limit);

      return randomStories.map(formatStory);
    }

    // Find stories with matching genres
    const relatedStories = [];

    for (const genre of genres) {
      const genreMatches = await db
        .select()
        .from(stories)
        .where(
          and(
            ne(stories.id, storyId), // Exclude current story
            like(stories.genres || "", `%${genre}%`) // Match genre
          )
        )
        .orderBy(sql`RANDOM()`)
        .limit(limit);

      relatedStories.push(...genreMatches);

      if (relatedStories.length >= limit) {
        break;
      }
    }

    // Deduplicate stories by ID
    const uniqueStories = Array.from(
      new Map(relatedStories.map((s) => [s.id, s])).values()
    );

    // If still not enough, add random stories
    if (uniqueStories.length < limit) {
      const existingIds = uniqueStories.map((s) => s.id);
      existingIds.push(storyId); // Also exclude current story

      const moreRandomStories = await db
        .select()
        .from(stories)
        .where(sql`id NOT IN (${existingIds.join(",")})` as any)
        .orderBy(sql`RANDOM()`)
        .limit(limit - uniqueStories.length);

      uniqueStories.push(...moreRandomStories);
    }

    return uniqueStories.slice(0, limit).map(formatStory);
  } catch (error) {
    console.error(
      `Error fetching related stories for story ${storyId}:`,
      error
    );
    throw new Error("Failed to fetch related stories");
  }
}

// =====================================================================
// CLIENT ACTIONS (from client-actions.ts)
// =====================================================================

// Server action wrappers for client components
export async function clientGetChapters(storyId: string, page: number) {
  return getChaptersByStoryId(Number(storyId), page);
}

export async function clientGetRelatedStories(
  storyId: string,
  limit: number = 6
) {
  return getRelatedStories(Number(storyId), limit);
}

export async function clientGetStoriesByGenre(
  tag: string | null,
  page: number
) {
  // Get stories from API
  const { stories: allStories, pagination } = await getStories(
    page,
    PAGINATION.STORIES_PER_PAGE
  );

  // Filter stories by genre if tag is provided
  const filteredStories = tag
    ? allStories.filter((story) => story.genres.includes(tag))
    : allStories;

  // Count stories per genre
  const genreCount: Record<string, number> = {};
  allStories.forEach((story) => {
    story.genres.forEach((genre) => {
      genreCount[genre] = (genreCount[genre] || 0) + 1;
    });
  });

  return {
    stories: filteredStories,
    pagination: {
      ...pagination,
      // Recalculate total pages if filtering
      totalPages: tag
        ? Math.ceil(filteredStories.length / PAGINATION.STORIES_PER_PAGE) || 1
        : pagination.totalPages,
    },
    genreCount,
  };
}

// Licensed Stories server actions
export async function clientGetLicensedStories(
  page: number = 1,
  limit: number = 10,
  status: string | null = null,
  search: string | null = null,
  tag: string | null = null
) {
  try {
    const offset = (page - 1) * limit;

    // Build query based on filters
    let query = db.select().from(licensedStories);
    let countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(licensedStories);

    if (status) {
      const statusValue = status === "completed" ? "completed" : "ongoing";
      query = query.where(eq(licensedStories.status, statusValue)) as any;
      countQuery = countQuery.where(
        eq(licensedStories.status, statusValue)
      ) as any;
    }

    if (search) {
      const likeSearch = `%${search}%`;
      query = query.where(
        or(
          like(licensedStories.title, likeSearch),
          like(licensedStories.author, likeSearch)
        )
      ) as any;
      countQuery = countQuery.where(
        or(
          like(licensedStories.title, likeSearch),
          like(licensedStories.author, likeSearch)
        )
      ) as any;
    }

    if (tag) {
      const likeTag = `%${tag}%`;
      query = query.where(like(licensedStories.genres, likeTag)) as any;
      countQuery = countQuery.where(
        like(licensedStories.genres, likeTag)
      ) as any;
    }

    // Apply pagination
    query = query
      .limit(limit)
      .offset(offset)
      .orderBy(desc(licensedStories.createdAt)) as any;

    // Execute queries
    const stories = await query;
    const totalResult = await countQuery;
    const total = totalResult[0]?.count || 0;

    // Process purchase links
    const processedStories = stories.map((story) => ({
      ...story,
      purchaseLinks: story.purchaseLinks
        ? JSON.parse(story.purchaseLinks as string)
        : [],
    }));

    // Return results with pagination
    return {
      stories: processedStories,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching licensed stories:", error);
    return {
      stories: [],
      pagination: {
        total: 0,
        page,
        limit,
        totalPages: 0,
      },
    };
  }
}

// Get ebook by slug
export async function getEbookBySlug(slugOrId: string) {
  try {
    let query;

    if (isNaN(Number(slugOrId))) {
      // Search by slug
      query = eq(ebooks.slug, slugOrId);
    } else {
      // Search by ID
      query = eq(ebooks.id, Number(slugOrId));
    }

    const result = await db.select().from(ebooks).where(query).limit(1);

    if (result.length === 0) {
      return null;
    }

    // Process purchase links
    return {
      ...result[0],
      purchaseLinks: result[0].purchaseLinks
        ? JSON.parse(result[0].purchaseLinks as string)
        : [],
    };
  } catch (error) {
    console.error(`Error fetching ebook by ${slugOrId}:`, error);
    throw new Error("Failed to fetch ebook");
  }
}

// Get licensed story by slug
export async function getLicensedStoryBySlug(slugOrId: string) {
  try {
    let query;

    if (isNaN(Number(slugOrId))) {
      // Search by slug
      query = eq(licensedStories.slug, slugOrId);
    } else {
      // Search by ID
      query = eq(licensedStories.id, Number(slugOrId));
    }

    const result = await db
      .select()
      .from(licensedStories)
      .where(query)
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    // Process purchase links
    return {
      ...result[0],
      purchaseLinks: result[0].purchaseLinks
        ? JSON.parse(result[0].purchaseLinks as string)
        : [],
    };
  } catch (error) {
    console.error(`Error fetching licensed story by ${slugOrId}:`, error);
    throw new Error("Failed to fetch licensed story");
  }
}

// Get ebook by slug (server action wrapper)
export async function clientGetEbookBySlug(slug: string) {
  try {
    return getEbookBySlug(slug);
  } catch (error) {
    console.error("Error fetching ebook:", error);
    return null;
  }
}

// Get licensed story by slug (server action wrapper)
export async function clientGetLicensedStoryBySlug(slug: string) {
  try {
    return getLicensedStoryBySlug(slug);
  } catch (error) {
    console.error("Error fetching licensed story:", error);
    return null;
  }
}

// Biến lưu trữ trạng thái đã khởi tạo index chưa
let initialized = false;

export async function clientSearch(searchQuery: string | null) {
  if (!searchQuery) {
    return { stories: [], ebooks: [], licensedStories: [], allResults: [] };
  }

  try {
    // Khởi tạo search index nếu chưa được khởi tạo
    if (!initialized) {
      // Lấy tất cả truyện để đánh index
      const { stories } = await getStories(1, 500);
      createSearchIndex(stories);
      initialized = true;
    }

    // Thực hiện tìm kiếm với MiniSearch cho truyện thường
    const searchResults = search(searchQuery);

    // Tìm kiếm truyện bản quyền (Licensed Stories)
    const lowercasedQuery = `%${searchQuery.toLowerCase()}%`;
    const licensedResults = await db
      .select()
      .from(licensedStories)
      .where(
        or(
          like(licensedStories.title, lowercasedQuery),
          like(licensedStories.author, lowercasedQuery),
          like(licensedStories.genres || "", lowercasedQuery)
        )
      )
      .limit(20);

    // Tìm kiếm ebooks
    const ebookResults = await db
      .select()
      .from(ebooks)
      .where(
        or(
          like(ebooks.title, lowercasedQuery),
          like(ebooks.author, lowercasedQuery),
          like(ebooks.genres || "", lowercasedQuery)
        )
      )
      .limit(20);

    // Xử lý purchaseLinks cho licensed stories và ebooks
    const processedLicensedStories = licensedResults.map((story) => ({
      ...story,
      type: "licensed",
      purchaseLinks: story.purchaseLinks
        ? JSON.parse(story.purchaseLinks as string)
        : [],
    }));

    const processedEbooks = ebookResults.map((book) => ({
      ...book,
      type: "ebook",
      purchaseLinks: book.purchaseLinks
        ? JSON.parse(book.purchaseLinks as string)
        : [],
    }));

    // Thêm type cho các kết quả tìm kiếm thông thường
    const processedStories = searchResults.map((story) => ({
      ...story,
      type: "story",
    }));

    // Kết hợp tất cả kết quả
    const allResults = [
      ...processedStories,
      ...processedLicensedStories,
      ...processedEbooks,
    ];

    // Kết quả đã được sắp xếp theo độ phù hợp
    return {
      stories: processedStories,
      licensedStories: processedLicensedStories,
      ebooks: processedEbooks,
      allResults: allResults,
    };
  } catch (error) {
    console.error("Search error:", error);
    return {
      stories: [],
      licensedStories: [],
      ebooks: [],
      allResults: [],
      error: "Failed to search stories",
    };
  }
}

// Get related books by genre
export async function clientGetRelatedBooks(
  genre: string,
  type: "ebook" | "licensed",
  limit: number = 6,
  excludeId?: string | number
) {
  try {
    const likeTag = `%${genre}%`;

    if (type === "ebook") {
      // Create conditions array for WHERE clause
      const conditions = [like(ebooks.genres, likeTag)];

      if (excludeId) {
        conditions.push(ne(ebooks.id, Number(excludeId)));
      }

      const results = await db
        .select()
        .from(ebooks)
        .where(and(...conditions))
        .limit(limit)
        .orderBy(sql`RANDOM()`);

      return results.map((book) => ({
        ...book,
        purchaseLinks: book.purchaseLinks
          ? JSON.parse(book.purchaseLinks as string)
          : [],
      }));
    } else {
      // Create conditions array for WHERE clause
      const conditions = [like(licensedStories.genres, likeTag)];

      if (excludeId) {
        conditions.push(ne(licensedStories.id, Number(excludeId)));
      }

      const results = await db
        .select()
        .from(licensedStories)
        .where(and(...conditions))
        .limit(limit)
        .orderBy(sql`RANDOM()`);

      return results.map((book) => ({
        ...book,
        purchaseLinks: book.purchaseLinks
          ? JSON.parse(book.purchaseLinks as string)
          : [],
      }));
    }
  } catch (error) {
    console.error(`Error fetching related ${type} books:`, error);
    return [];
  }
}

// Ebooks server actions
export async function clientGetEbooks(
  page: number = 1,
  limit: number = 10,
  status: string | null = null,
  search: string | null = null,
  tag: string | null = null
) {
  try {
    const offset = (page - 1) * limit;

    // Build query based on filters
    let query = db.select().from(ebooks);
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(ebooks);

    if (status) {
      const statusValue = status === "completed" ? "completed" : "ongoing";
      query = query.where(eq(ebooks.status, statusValue)) as any;
      countQuery = countQuery.where(eq(ebooks.status, statusValue)) as any;
    }

    if (search) {
      const likeSearch = `%${search}%`;
      query = query.where(
        or(like(ebooks.title, likeSearch), like(ebooks.author, likeSearch))
      ) as any;
      countQuery = countQuery.where(
        or(like(ebooks.title, likeSearch), like(ebooks.author, likeSearch))
      ) as any;
    }

    if (tag) {
      const likeTag = `%${tag}%`;
      query = query.where(like(ebooks.genres, likeTag)) as any;
      countQuery = countQuery.where(like(ebooks.genres, likeTag)) as any;
    }

    // Apply pagination
    query = query
      .limit(limit)
      .offset(offset)
      .orderBy(desc(ebooks.createdAt)) as any;

    // Execute queries
    const stories = await query;
    const totalResult = await countQuery;
    const total = totalResult[0]?.count || 0;

    // Process purchase links
    const processedStories = stories.map((story) => ({
      ...story,
      purchaseLinks: story.purchaseLinks
        ? JSON.parse(story.purchaseLinks as string)
        : [],
    }));

    // Return results with pagination
    return {
      stories: processedStories,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching ebooks:", error);
    return {
      stories: [],
      pagination: {
        total: 0,
        page,
        limit,
        totalPages: 0,
      },
    };
  }
}

// =====================================================================
// ADMIN ACTIONS (from admin-actions.ts)
// =====================================================================

// Admin actions to get all novels with filtering and pagination
export async function adminGetAllNovels(
  page: number = 1,
  limit: number = 10,
  status: string | null = null,
  search: string | null = null
) {
  try {
    // Check authentication and authorization
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    // Fetch all novels
    const allNovels = await db.query.stories.findMany({
      orderBy: (stories, { desc }) => [desc(stories.createdAt)],
    });

    // Apply filters in memory (simpler than query building)
    let filteredNovels = [...allNovels];

    if (status) {
      filteredNovels = filteredNovels.filter(
        (novel) => novel.status === status
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredNovels = filteredNovels.filter(
        (novel) =>
          novel.title.toLowerCase().includes(searchLower) ||
          novel.author?.toLowerCase().includes(searchLower)
      );
    }

    // Simple pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedNovels = filteredNovels.slice(startIndex, endIndex);

    return {
      novels: paginatedNovels,
      pagination: {
        total: filteredNovels.length,
        page,
        limit,
        totalPages: Math.ceil(filteredNovels.length / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching novels:", error);
    return {
      novels: [],
      pagination: {
        total: 0,
        page,
        limit,
        totalPages: 0,
      },
      error: error instanceof Error ? error.message : "Failed to fetch novels",
    };
  }
}

// Get novel by ID
export async function adminGetNovelById(id: number) {
  try {
    // Check authentication and authorization
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    // Fetch the novel
    const novel = await db.query.stories.findFirst({
      where: eq(stories.id, id),
    });

    if (!novel) {
      throw new Error("Novel not found");
    }

    // Map the database 'genres' field to both 'genres' and 'genre' for backward compatibility
    return {
      novel: {
        ...novel,
        genre: novel.genres,
      },
    };
  } catch (error) {
    console.error("Error fetching novel:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to fetch novel",
    };
  }
}

// Delete novel by ID
export async function adminDeleteNovel(id: number) {
  try {
    // Check authentication and authorization
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    // Check if the novel exists
    const existingNovel = await db.query.stories.findFirst({
      where: eq(stories.id, id),
    });

    if (!existingNovel) {
      return { success: false, error: "Novel not found" };
    }

    // Delete the novel
    await db.delete(stories).where(eq(stories.id, id));

    return {
      success: true,
      message: "Novel deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting novel:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete novel",
    };
  }
}

// Add new novel
export async function adminAddNovel(formData: FormData) {
  try {
    // Check authentication and authorization
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    // Extract form data
    const title = formData.get("title") as string;
    const slug = formData.get("slug") as string;
    const author = formData.get("author") as string;
    const status = formData.get("status") as string;
    const description = formData.get("description") as string;
    const genre = formData.get("genre") as string;
    const youtubeEmbed = formData.get("youtubeEmbed") as string;

    // Validate required fields
    if (!title || !slug || !author || !description) {
      return { success: false, error: "Missing required fields" };
    }

    // Handle cover image - we'll skip the file upload implementation
    // In a real scenario, you would use a storage solution like AWS S3
    // For now, we'll just use a placeholder image
    let coverImagePath = "";

    // In real implementation, add file processing logic here
    // For demo purposes, we'll use a placeholder
    coverImagePath = "/images/placeholder.jpg";

    // Insert the novel into the database
    const newNovel = await db
      .insert(stories)
      .values({
        title,
        slug,
        author,
        description,
        coverImage: coverImagePath,
        genres: genre || null,
        youtubeEmbed: youtubeEmbed || null,
        status:
          status === "paused" ? "ongoing" : (status as "ongoing" | "completed"),
        createdAt: Math.floor(Date.now() / 1000),
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .returning();

    return {
      success: true,
      message: "Novel created successfully",
      novel: newNovel[0],
    };
  } catch (error) {
    console.error("Error creating novel:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create novel",
    };
  }
}

// Get chapters for a novel
export async function adminGetChapters(
  novelId: number,
  page: number = 1,
  limit: number = 10,
  sort: string = "desc"
) {
  try {
    // Check authentication and authorization
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return { error: "Unauthorized: Admin access required" };
    }

    // Check if the novel exists
    const novel = await db.query.stories.findFirst({
      where: eq(stories.id, novelId),
    });

    if (!novel) {
      return { error: "Novel not found" };
    }

    // Calculate pagination values
    const offset = (page - 1) * limit;

    // Get total count of chapters
    const countResult = await db
      .select({ count: sql`count(*)` })
      .from(chapters)
      .where(eq(chapters.novelId, novelId));

    const total = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(total / limit);

    // Fetch chapters for the novel with pagination and sorting
    const chaptersList = await db
      .select()
      .from(chapters)
      .where(eq(chapters.novelId, novelId))
      .orderBy(
        sort === "asc"
          ? asc(chapters.chapterNumber)
          : desc(chapters.chapterNumber)
      )
      .limit(limit)
      .offset(offset);

    return {
      chapters: chaptersList,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  } catch (error) {
    console.error("Error fetching chapters:", error);
    return {
      chapters: [],
      pagination: {
        total: 0,
        page,
        limit,
        totalPages: 0,
      },
      error:
        error instanceof Error ? error.message : "Failed to fetch chapters",
    };
  }
}

// Add chapter to a novel
export async function adminAddChapter(
  novelId: number,
  data: {
    title: string;
    content: string;
    chapterNumber: number;
    slug: string;
  }
) {
  try {
    // Check authentication and authorization
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    // Check if the novel exists
    const novel = await db.query.stories.findFirst({
      where: eq(stories.id, novelId),
    });

    if (!novel) {
      return { success: false, error: "Novel not found" };
    }

    // Validate required fields
    if (!data.title || !data.content || !data.slug || !data.chapterNumber) {
      return { success: false, error: "Missing required fields" };
    }

    // Check if chapter number already exists
    const existingChapter = await db
      .select()
      .from(chapters)
      .where(
        and(
          eq(chapters.novelId, novelId),
          eq(chapters.chapterNumber, data.chapterNumber)
        )
      )
      .limit(1);

    if (existingChapter.length > 0) {
      return {
        success: false,
        error: `Chapter number ${data.chapterNumber} already exists`,
      };
    }

    // Insert the new chapter
    const newChapter = await db
      .insert(chapters)
      .values({
        novelId,
        title: data.title,
        slug: data.slug,
        content: data.content,
        chapterNumber: data.chapterNumber,
        createdAt: Math.floor(Date.now() / 1000),
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .returning();

    // Update the novel's status and updated_at timestamp
    await db
      .update(stories)
      .set({
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .where(eq(stories.id, novelId));

    // Revalidate relevant pages
    try {
      await revalidateStory(novel.slug);
      await revalidateChapter(novel.slug, data.chapterNumber);
    } catch (e) {
      console.error("Failed to revalidate pages:", e);
    }

    return {
      success: true,
      message: "Chapter created successfully",
      chapter: newChapter[0],
    };
  } catch (error) {
    console.error("Error adding chapter:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add chapter",
    };
  }
}

// Get a specific chapter
export async function adminGetChapter(novelId: number, chapterId: number) {
  try {
    // Check authentication and authorization
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return { error: "Unauthorized: Admin access required" };
    }

    // Check if the chapter exists
    const chapter = await db
      .select()
      .from(chapters)
      .where(and(eq(chapters.novelId, novelId), eq(chapters.id, chapterId)))
      .limit(1);

    if (chapter.length === 0) {
      return { error: "Chapter not found" };
    }

    return { chapter: chapter[0] };
  } catch (error) {
    console.error("Error fetching chapter:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to fetch chapter",
    };
  }
}

// Update a chapter
export async function adminUpdateChapter(
  novelId: number,
  chapterId: number,
  data: {
    title: string;
    content: string;
    chapterNumber: number;
    slug: string;
  }
) {
  try {
    // Check authentication and authorization
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    // Check if the chapter exists
    const existingChapter = await db
      .select()
      .from(chapters)
      .where(and(eq(chapters.novelId, novelId), eq(chapters.id, chapterId)))
      .limit(1);

    if (existingChapter.length === 0) {
      return { success: false, error: "Chapter not found" };
    }

    // Check if new chapter number conflicts with another chapter
    if (data.chapterNumber !== existingChapter[0].chapterNumber) {
      const conflictingChapter = await db
        .select()
        .from(chapters)
        .where(
          and(
            eq(chapters.novelId, novelId),
            eq(chapters.chapterNumber, data.chapterNumber),
            ne(chapters.id, chapterId)
          )
        )
        .limit(1);

      if (conflictingChapter.length > 0) {
        return {
          success: false,
          error: `Chapter number ${data.chapterNumber} already exists`,
        };
      }
    }

    // Update the chapter
    await db
      .update(chapters)
      .set({
        title: data.title,
        content: data.content,
        chapterNumber: data.chapterNumber,
        slug: data.slug,
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .where(and(eq(chapters.novelId, novelId), eq(chapters.id, chapterId)));

    // Get the novel for revalidation
    const novel = await db.query.stories.findFirst({
      where: eq(stories.id, novelId),
    });

    if (novel) {
      // Revalidate relevant pages
      try {
        await revalidateStory(novel.slug);
        await revalidateChapter(novel.slug, data.chapterNumber);

        // If chapter number changed, revalidate old chapter number too
        if (data.chapterNumber !== existingChapter[0].chapterNumber) {
          await revalidateChapter(novel.slug, existingChapter[0].chapterNumber);
        }
      } catch (e) {
        console.error("Failed to revalidate pages:", e);
      }
    }

    return { success: true, message: "Chapter updated successfully" };
  } catch (error) {
    console.error("Error updating chapter:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update chapter",
    };
  }
}

// Delete a chapter
export async function adminDeleteChapter(novelId: number, chapterId: number) {
  try {
    // Check authentication and authorization
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    // Check if the chapter exists
    const existingChapter = await db
      .select()
      .from(chapters)
      .where(and(eq(chapters.novelId, novelId), eq(chapters.id, chapterId)))
      .limit(1);

    if (existingChapter.length === 0) {
      return { success: false, error: "Chapter not found" };
    }

    // Get the novel for revalidation
    const novel = await db.query.stories.findFirst({
      where: eq(stories.id, novelId),
    });

    // Delete the chapter
    await db
      .delete(chapters)
      .where(and(eq(chapters.novelId, novelId), eq(chapters.id, chapterId)));

    // Revalidate relevant pages
    if (novel) {
      try {
        await revalidateStory(novel.slug);
        await revalidateChapter(novel.slug, existingChapter[0].chapterNumber);
      } catch (e) {
        console.error("Failed to revalidate pages:", e);
      }
    }

    return { success: true, message: "Chapter deleted successfully" };
  } catch (error) {
    console.error("Error deleting chapter:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete chapter",
    };
  }
}

// =====================================================================
// ADVERTISEMENT ACTIONS
// =====================================================================

// Get all advertisements for admin
export async function clientGetAdvertisements(
  page: number = 1,
  limit: number = 10,
  status: string | null = null,
  search: string | null = null
) {
  try {
    // Check authentication and authorization
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return { error: "Unauthorized. Admin access required." };
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build query conditions
    const conditions = [];
    const countConditions = [];

    // Add status filter if provided
    if (status) {
      if (status === "active") {
        conditions.push(eq(advertisements.isActive, true));
        countConditions.push(eq(advertisements.isActive, true));
      } else if (status === "inactive") {
        conditions.push(eq(advertisements.isActive, false));
        countConditions.push(eq(advertisements.isActive, false));
      }
    }

    // Add search filter if provided
    if (search) {
      const searchFilter = or(
        like(advertisements.title, `%${search}%`),
        like(advertisements.description || "", `%${search}%`)
      );
      conditions.push(searchFilter);
      countConditions.push(searchFilter);
    }

    // Create where clause
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const countWhereClause =
      countConditions.length > 0 ? and(...countConditions) : undefined;

    // Fetch total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(advertisements)
      .where(countWhereClause);

    const total = countResult[0]?.count || 0;

    // Fetch ads with pagination
    const result = await db
      .select()
      .from(advertisements)
      .where(whereClause)
      .orderBy(desc(advertisements.updatedAt))
      .limit(limit)
      .offset(offset);

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    return {
      advertisements: result,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  } catch (error) {
    console.error("Error fetching advertisements:", error);
    return { error: "Failed to fetch advertisements" };
  }
}

// Get a specific advertisement by ID
export async function clientGetAdvertisementById(id: number) {
  try {
    // Check authentication and authorization
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return { error: "Unauthorized. Admin access required." };
    }

    if (isNaN(id)) {
      return { error: "Invalid advertisement ID" };
    }

    // Fetch the advertisement
    const result = await db
      .select()
      .from(advertisements)
      .where(eq(advertisements.id, id))
      .limit(1);

    if (result.length === 0) {
      return { error: "Advertisement not found" };
    }

    return result[0];
  } catch (error) {
    console.error("Error fetching advertisement:", error);
    return { error: "Failed to fetch advertisement" };
  }
}

// Create a new advertisement
export async function clientCreateAdvertisement(data: {
  title: string;
  description?: string;
  imageUrl?: string;
  affiliateUrl: string;
  displayFrequency?: number;
  isActive?: boolean;
  type?:
    | "in-chapter"
    | "priority"
    | "banner"
    | "loading"
    | "ebook-waiting"
    | "other";
}) {
  try {
    // Check authentication and authorization
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return { error: "Unauthorized. Admin access required." };
    }

    // Validate required fields
    if (!data.title || !data.affiliateUrl) {
      return { error: "Title and affiliate URL are required" };
    }

    // Insert new advertisement
    const result = await db.insert(advertisements).values({
      title: data.title,
      description: data.description || null,
      imageUrl: data.imageUrl || null,
      affiliateUrl: data.affiliateUrl,
      displayFrequency: data.displayFrequency || 3,
      isActive: data.isActive !== undefined ? data.isActive : true,
      type: data.type || "in-chapter",
      createdAt: Math.floor(Date.now() / 1000),
      updatedAt: Math.floor(Date.now() / 1000),
    });

    return {
      message: "Advertisement created successfully",
      id: result.lastInsertRowid ? Number(result.lastInsertRowid) : null,
    };
  } catch (error) {
    console.error("Error creating advertisement:", error);
    return { error: "Failed to create advertisement" };
  }
}

// Update an advertisement
export async function clientUpdateAdvertisement(
  id: number,
  data: {
    title?: string;
    description?: string;
    imageUrl?: string;
    affiliateUrl?: string;
    displayFrequency?: number;
    isActive?: boolean;
    impressionCount?: number;
    clickCount?: number;
    type?:
      | "in-chapter"
      | "priority"
      | "banner"
      | "loading"
      | "ebook-waiting"
      | "other";
  }
) {
  try {
    // Check authentication and authorization
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return { error: "Unauthorized. Admin access required." };
    }

    if (isNaN(id)) {
      return { error: "Invalid advertisement ID" };
    }

    // Validate the advertisement exists
    const existingAd = await db
      .select()
      .from(advertisements)
      .where(eq(advertisements.id, id))
      .limit(1);

    if (existingAd.length === 0) {
      return { error: "Advertisement not found" };
    }

    // Update fields
    const updateData: {
      updatedAt: number;
      title?: string;
      description?: string | null;
      imageUrl?: string | null;
      affiliateUrl?: string;
      isActive?: boolean;
      displayFrequency?: number;
      impressionCount?: number;
      clickCount?: number;
      type?:
        | "in-chapter"
        | "priority"
        | "banner"
        | "loading"
        | "ebook-waiting"
        | "other";
    } = {
      updatedAt: Math.floor(Date.now() / 1000),
    };

    // Only update provided fields
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.affiliateUrl !== undefined)
      updateData.affiliateUrl = data.affiliateUrl;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.displayFrequency !== undefined)
      updateData.displayFrequency = data.displayFrequency;
    if (data.impressionCount !== undefined)
      updateData.impressionCount = data.impressionCount;
    if (data.clickCount !== undefined) updateData.clickCount = data.clickCount;
    if (data.type !== undefined) {
      const validTypes = [
        "in-chapter",
        "priority",
        "banner",
        "loading",
        "ebook-waiting",
        "other",
      ];
      if (validTypes.includes(data.type)) {
        updateData.type = data.type as
          | "in-chapter"
          | "priority"
          | "banner"
          | "loading"
          | "ebook-waiting"
          | "other";
      }
    }

    // Update the advertisement
    await db
      .update(advertisements)
      .set(updateData)
      .where(eq(advertisements.id, id));

    return { message: "Advertisement updated successfully" };
  } catch (error) {
    console.error("Error updating advertisement:", error);
    return { error: "Failed to update advertisement" };
  }
}

// Delete an advertisement
export async function clientDeleteAdvertisement(id: number) {
  try {
    // Check authentication and authorization
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return { error: "Unauthorized. Admin access required." };
    }

    if (isNaN(id)) {
      return { error: "Invalid advertisement ID" };
    }

    // Validate the advertisement exists
    const existingAd = await db
      .select()
      .from(advertisements)
      .where(eq(advertisements.id, id))
      .limit(1);

    if (existingAd.length === 0) {
      return { error: "Advertisement not found" };
    }

    // Delete the advertisement
    await db.delete(advertisements).where(eq(advertisements.id, id));

    return { message: "Advertisement deleted successfully" };
  } catch (error) {
    console.error("Error deleting advertisement:", error);
    return { error: "Failed to delete advertisement" };
  }
}

// Admin actions to get all licensed stories with filtering and pagination
export async function clientGetAllLicensedStories(
  page: number = 1,
  limit: number = 10,
  status: string | null = null,
  search: string | null = null
) {
  try {
    const offset = (page - 1) * limit;

    // Build query based on filters
    let query = db.select().from(licensedStories);
    let countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(licensedStories);

    // Add filter conditions
    const conditions = [];
    const countConditions = [];

    if (status) {
      const statusValue = status === "completed" ? "completed" : "ongoing";
      conditions.push(eq(licensedStories.status, statusValue));
      countConditions.push(eq(licensedStories.status, statusValue));
    }

    if (search) {
      const likeSearch = `%${search}%`;
      const searchFilter = or(
        like(licensedStories.title, likeSearch),
        like(licensedStories.author || "", likeSearch)
      );
      conditions.push(searchFilter);
      countConditions.push(searchFilter);
    }

    // Apply conditions if any
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    if (countConditions.length > 0) {
      countQuery = countQuery.where(and(...countConditions)) as any;
    }

    // Apply pagination and ordering
    query = query
      .limit(limit)
      .offset(offset)
      .orderBy(desc(licensedStories.createdAt)) as any;

    // Execute queries
    const stories = await query;
    const totalResult = await countQuery;
    const total = Number(totalResult[0]?.count || 0);

    // Process purchase links
    const processedStories = stories.map((story) => ({
      ...story,
      purchaseLinks: story.purchaseLinks
        ? JSON.parse(story.purchaseLinks as string)
        : [],
    }));

    // Return results with pagination
    return {
      stories: processedStories,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching all licensed stories:", error);
    return {
      stories: [],
      pagination: {
        total: 0,
        page,
        limit,
        totalPages: 0,
      },
    };
  }
}

// Delete licensed story by slug or ID (admin only)
export async function clientDeleteLicensedStory(slugOrId: string) {
  try {
    // Check auth as admin
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    // Check if the story exists and delete it using appropriate condition
    if (isNaN(Number(slugOrId))) {
      // Delete by slug
      const existingStory = await db
        .select()
        .from(licensedStories)
        .where(eq(licensedStories.slug, slugOrId))
        .limit(1);

      if (existingStory.length === 0) {
        return { success: false, error: "Licensed story not found" };
      }

      await db
        .delete(licensedStories)
        .where(eq(licensedStories.slug, slugOrId));
    } else {
      // Delete by ID
      const id = Number(slugOrId);
      const existingStory = await db
        .select()
        .from(licensedStories)
        .where(eq(licensedStories.id, id))
        .limit(1);

      if (existingStory.length === 0) {
        return { success: false, error: "Licensed story not found" };
      }

      await db.delete(licensedStories).where(eq(licensedStories.id, id));
    }

    return { success: true, message: "Licensed story deleted successfully" };
  } catch (error) {
    console.error("Error deleting licensed story:", error);
    return { success: false, error: "Failed to delete licensed story" };
  }
}

// Admin actions to get all ebooks with filtering and pagination
export async function clientGetAllEbooks(
  page: number = 1,
  limit: number = 10,
  status: string | null = null,
  search: string | null = null
) {
  try {
    const offset = (page - 1) * limit;

    // Build query based on filters
    let query = db.select().from(ebooks);
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(ebooks);

    // Add filter conditions
    const conditions = [];
    const countConditions = [];

    if (status) {
      const statusValue = status === "completed" ? "completed" : "ongoing";
      conditions.push(eq(ebooks.status, statusValue));
      countConditions.push(eq(ebooks.status, statusValue));
    }

    if (search) {
      const likeSearch = `%${search}%`;
      const searchFilter = or(
        like(ebooks.title, likeSearch),
        like(ebooks.author || "", likeSearch)
      );
      conditions.push(searchFilter);
      countConditions.push(searchFilter);
    }

    // Apply conditions if any
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    if (countConditions.length > 0) {
      countQuery = countQuery.where(and(...countConditions)) as any;
    }

    // Apply pagination and ordering
    query = query
      .limit(limit)
      .offset(offset)
      .orderBy(desc(ebooks.createdAt)) as any;

    // Execute queries
    const stories = await query;
    const totalResult = await countQuery;
    const total = Number(totalResult[0]?.count || 0);

    // Process purchase links
    const processedStories = stories.map((story) => ({
      ...story,
      purchaseLinks: story.purchaseLinks
        ? JSON.parse(story.purchaseLinks as string)
        : [],
    }));

    // Return results with pagination
    return {
      stories: processedStories,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching all ebooks:", error);
    return {
      stories: [],
      pagination: {
        total: 0,
        page,
        limit,
        totalPages: 0,
      },
    };
  }
}

// Delete ebook by slug or ID (admin only)
export async function clientDeleteEbook(slugOrId: string) {
  try {
    // Check auth as admin
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    // Check if the ebook exists and delete it using appropriate condition
    if (isNaN(Number(slugOrId))) {
      // Delete by slug
      const existingEbook = await db
        .select()
        .from(ebooks)
        .where(eq(ebooks.slug, slugOrId))
        .limit(1);

      if (existingEbook.length === 0) {
        return { success: false, error: "Ebook not found" };
      }

      await db.delete(ebooks).where(eq(ebooks.slug, slugOrId));
    } else {
      // Delete by ID
      const id = Number(slugOrId);
      const existingEbook = await db
        .select()
        .from(ebooks)
        .where(eq(ebooks.id, id))
        .limit(1);

      if (existingEbook.length === 0) {
        return { success: false, error: "Ebook not found" };
      }

      await db.delete(ebooks).where(eq(ebooks.id, id));
    }

    return { success: true, message: "Ebook deleted successfully" };
  } catch (error) {
    console.error("Error deleting ebook:", error);
    return { success: false, error: "Failed to delete ebook" };
  }
}

// =====================================================================
// USER MANAGEMENT ACTIONS
// =====================================================================

// Get all users (admin only)
export async function adminGetUsers() {
  try {
    // Check authentication and authorization
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return { error: "Unauthorized: Admin access required" };
    }

    // Fetch all users
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(users.id);

    return allUsers;
  } catch (error) {
    console.error("Error fetching users:", error);
    return { error: "Failed to fetch users" };
  }
}

// Create new user (admin only)
export async function adminAddUser(data: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}) {
  try {
    // Check authentication and authorization
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return { error: "Unauthorized: Admin access required" };
    }

    // Basic validation
    if (!data.name || !data.email || !data.password) {
      return { error: "Missing required fields" };
    }

    // Check if user with email already exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, data.email),
    });

    if (existingUser) {
      return { error: "Email already in use" };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role === "admin" ? "admin" : "editor",
      })
      .returning();

    // Create a new object without the password
    const userWithoutPassword = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      createdAt: newUser.createdAt,
    };

    return { success: true, user: userWithoutPassword };
  } catch (error) {
    console.error("Error creating user:", error);
    return { error: "Failed to create user" };
  }
}

// Get user by ID (admin only)
export async function adminGetUserById(id: number) {
  try {
    // Check authentication and authorization
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return { error: "Unauthorized: Admin access required" };
    }

    // Fetch user
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, id),
      columns: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return { error: "User not found" };
    }

    return { user };
  } catch (error) {
    console.error("Error fetching user:", error);
    return { error: "Failed to fetch user" };
  }
}

// Update user (admin only)
export async function adminUpdateUser(
  id: number,
  data: {
    name?: string;
    email?: string;
    password?: string;
    role?: UserRole;
  }
) {
  try {
    // Check authentication and authorization
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return { error: "Unauthorized: Admin access required" };
    }

    // Verify user exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, id),
    });

    if (!existingUser) {
      return { error: "User not found" };
    }

    // If email is being changed, check it's not already in use
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, data.email as string),
      });

      if (emailExists) {
        return { error: "Email already in use" };
      }
    }

    // Prepare update data
    const updateData: Record<string, any> = {};
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.role) updateData.role = data.role;

    // Hash password if provided
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    // Update user
    await db.update(users).set(updateData).where(eq(users.id, id));

    // Fetch updated user
    const updatedUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, id),
      columns: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Error updating user:", error);
    return { error: "Failed to update user" };
  }
}

// Delete user (admin only)
export async function adminDeleteUser(id: number) {
  try {
    // Check authentication and authorization
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return { error: "Unauthorized: Admin access required" };
    }

    // Prevent deleting own account
    if (session.user.id === id) {
      return { error: "Cannot delete your own account" };
    }

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, id),
    });

    if (!existingUser) {
      return { error: "User not found" };
    }

    // Delete user
    await db.delete(users).where(eq(users.id, id));

    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { error: "Failed to delete user" };
  }
}

// =====================================================================
// DASHBOARD ACTIONS
// =====================================================================

// Get dashboard statistics
export async function getDashboardStats() {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return { error: "Unauthorized" };
    }

    // Count stories
    const storiesCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(stories);

    // Count chapters
    const chaptersCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(chapters);

    // Count users
    const usersCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);

    // Count licensed stories
    const licensedStoriesCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(licensedStories);

    // Count ebooks
    const ebooksCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(ebooks);

    // Count advertisements
    const advertisementsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(advertisements);

    // Count active advertisements
    const activeAdsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(advertisements)
      .where(eq(advertisements.isActive, true));

    // Get ad impressions
    const adImpressions = await db
      .select({ sum: sql<number>`COALESCE(SUM(impression_count), 0)` })
      .from(advertisements);

    // Get ad clicks
    const adClicks = await db
      .select({ sum: sql<number>`COALESCE(SUM(click_count), 0)` })
      .from(advertisements);

    // Get total views (using null coalesce to handle null values)
    const totalViews = await db
      .select({ sum: sql<number>`COALESCE(SUM(view_count), 0)` })
      .from(stories);

    // Get recent stories
    const recentStories = await db
      .select({
        id: stories.id,
        title: stories.title,
        slug: stories.slug,
        createdAt: stories.createdAt,
      })
      .from(stories)
      .orderBy(desc(stories.createdAt))
      .limit(5);

    return {
      counts: {
        stories: storiesCount[0]?.count || 0,
        chapters: chaptersCount[0]?.count || 0,
        users: usersCount[0]?.count || 0,
        licensedStories: licensedStoriesCount[0]?.count || 0,
        ebooks: ebooksCount[0]?.count || 0,
        totalViews: totalViews[0]?.sum || 0,
        ads: {
          total: advertisementsCount[0]?.count || 0,
          active: activeAdsCount[0]?.count || 0,
          impressions: adImpressions[0]?.sum || 0,
          clicks: adClicks[0]?.sum || 0,
          ctr:
            adImpressions[0]?.sum && adImpressions[0].sum > 0
              ? (adClicks[0]?.sum || 0) / adImpressions[0].sum
              : 0,
        },
      },
      recentStories: recentStories,
    };
  } catch (error) {
    console.error("Error fetching dashboard statistics:", error);
    return { error: "Failed to fetch dashboard statistics" };
  }
}
