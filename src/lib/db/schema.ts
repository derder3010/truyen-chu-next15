import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// Users table
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["admin", "editor"] })
    .default("editor")
    .notNull(),
  createdAt: integer("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Stories table (optional, if needed later)
export const stories = sqliteTable("stories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  author: text("author"),
  description: text("description"),
  coverImage: text("cover_image"),
  genres: text("genres"),
  status: text("status", { enum: ["ongoing", "completed"] }).default("ongoing"),
  viewCount: integer("view_count").default(0),
  createdAt: integer("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Chapters table
export const chapters = sqliteTable("chapters", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  novelId: integer("novel_id").notNull(),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  content: text("content").notNull(),
  chapterNumber: integer("chapter_number").notNull(),
  viewCount: integer("view_count").default(0),
  createdAt: integer("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at").default(sql`CURRENT_TIMESTAMP`),
});
