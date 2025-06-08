import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import dotenv from "dotenv";
import { sql } from "drizzle-orm";

// Load environment variables
dotenv.config();

// Create the database connection
const client = createClient({
  url: process.env.DATABASE_URL || "file:./sqlite.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

// Export the database with schema
export const db = drizzle(client, { schema });

// Helper function to insert or update a chapter
export async function upsertChapter(
  novelId: number,
  chapterId: number | null,
  data: {
    title: string;
    content: string;
    chapterNumber: number;
    slug: string;
  }
) {
  // If chapterId is provided, update existing chapter
  if (chapterId) {
    return db
      .update(schema.chapters)
      .set({
        ...data,
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .where(
        sql`${schema.chapters.id} = ${chapterId} AND ${schema.chapters.novelId} = ${novelId}`
      )
      .returning();
  }
  // Otherwise insert a new chapter
  else {
    return db
      .insert(schema.chapters)
      .values({
        ...data,
        novelId,
        createdAt: Math.floor(Date.now() / 1000),
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .returning();
  }
}

// Helper function to delete a chapter
export async function deleteChapter(novelId: number, chapterId: number) {
  // First get the chapter to know its chapter number
  const chapterToDelete = await getChapter(novelId, chapterId);
  if (!chapterToDelete) return null;

  const chapterNumber = chapterToDelete.chapterNumber;

  // Delete the chapter
  await db
    .delete(schema.chapters)
    .where(
      sql`${schema.chapters.id} = ${chapterId} AND ${schema.chapters.novelId} = ${novelId}`
    );

  // Get all remaining chapters with higher number to renumber them
  const chaptersToRenumber = await db
    .select()
    .from(schema.chapters)
    .where(
      sql`${schema.chapters.novelId} = ${novelId} AND ${schema.chapters.chapterNumber} > ${chapterNumber}`
    )
    .orderBy(schema.chapters.chapterNumber);

  // Renumber each chapter (decrement by 1)
  for (const chapter of chaptersToRenumber) {
    await db
      .update(schema.chapters)
      .set({
        chapterNumber: chapter.chapterNumber - 1,
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .where(sql`${schema.chapters.id} = ${chapter.id}`);
  }

  return true;
}

// Helper function to get all chapters for a novel
export async function getNovelChapters(novelId: number) {
  const chapters = await db
    .select()
    .from(schema.chapters)
    .where(sql`${schema.chapters.novelId} = ${novelId}`)
    .orderBy(schema.chapters.chapterNumber);

  // Ensure createdAt and updatedAt are properly formatted
  return chapters.map((chapter) => ({
    ...chapter,
    createdAt: chapter.createdAt || Math.floor(Date.now() / 1000),
    updatedAt: chapter.updatedAt || Math.floor(Date.now() / 1000),
  }));
}

// Helper function to fix chapter numbering (ensures sequential numbering with no gaps)
export async function fixChapterNumbering(novelId: number) {
  // Get all chapters for the novel
  const chapters = await db
    .select()
    .from(schema.chapters)
    .where(sql`${schema.chapters.novelId} = ${novelId}`)
    .orderBy(schema.chapters.chapterNumber);

  // If there are no chapters or only one chapter, no need to fix
  if (chapters.length <= 1) return true;

  // Check for numbering issues and fix them
  let needsFixing = false;
  let expectedNumber = 1;

  for (const chapter of chapters) {
    if (chapter.chapterNumber !== expectedNumber) {
      needsFixing = true;
      break;
    }
    expectedNumber++;
  }

  // If there are no issues, return
  if (!needsFixing) return true;

  // Fix the numbering by reassigning sequential numbers
  for (let i = 0; i < chapters.length; i++) {
    const newChapterNumber = i + 1;
    if (chapters[i].chapterNumber !== newChapterNumber) {
      await db
        .update(schema.chapters)
        .set({
          chapterNumber: newChapterNumber,
          updatedAt: Math.floor(Date.now() / 1000),
        })
        .where(sql`${schema.chapters.id} = ${chapters[i].id}`);
    }
  }

  return true;
}

// Helper function to get a specific chapter
export async function getChapter(novelId: number, chapterId: number) {
  const chapter = await db
    .select()
    .from(schema.chapters)
    .where(
      sql`${schema.chapters.id} = ${chapterId} AND ${schema.chapters.novelId} = ${novelId}`
    )
    .get();

  if (!chapter) return null;

  // Ensure createdAt and updatedAt are properly formatted
  return {
    ...chapter,
    createdAt: chapter.createdAt || Math.floor(Date.now() / 1000),
    updatedAt: chapter.updatedAt || Math.floor(Date.now() / 1000),
  };
}
