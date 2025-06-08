"use server";

import { Story, Chapter, StoryStatus } from "@/types";
import { db } from "./db";
import { stories, chapters } from "./db/schema";
import { sql, eq, desc } from "drizzle-orm";

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
    const results = await db.select({ genres: stories.genres }).from(stories);

    // Extract all genres from stories
    const genresSet = new Set<string>();

    results.forEach((result) => {
      if (result.genres) {
        result.genres.split(",").forEach((genre) => {
          genresSet.add(genre.trim());
        });
      }
    });

    return Array.from(genresSet).sort();
  } catch (error) {
    console.error("Error fetching genres:", error);
    throw new Error("Failed to fetch genres");
  }
}
