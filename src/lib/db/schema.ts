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
  youtubeEmbed: text("youtube_embed"),
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

// Licensed Stories table for copyrighted content
export const licensedStories = sqliteTable("licensed_stories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  author: text("author").notNull(),
  description: text("description"),
  coverImage: text("cover_image"),
  genres: text("genres"),
  status: text("status", { enum: ["ongoing", "completed"] }).default("ongoing"),
  purchaseLinks: text("purchase_links"), // JSON string containing store name and URL pairs
  viewCount: integer("view_count").default(0),
  createdAt: integer("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Ebooks table for digital book content
export const ebooks = sqliteTable("ebooks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  author: text("author").notNull(),
  description: text("description"),
  coverImage: text("cover_image"),
  genres: text("genres"),
  status: text("status", { enum: ["ongoing", "completed"] }).default(
    "completed"
  ),
  purchaseLinks: text("purchase_links"), // JSON string containing store name and URL pairs
  viewCount: integer("view_count").default(0),
  createdAt: integer("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Advertisements table for affiliate links
export const advertisements = sqliteTable("advertisements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  affiliateUrl: text("affiliate_url").notNull(),
  impressionCount: integer("impression_count").default(0),
  clickCount: integer("click_count").default(0),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  displayFrequency: integer("display_frequency").default(3), // Hiển thị sau mỗi n chương
  type: text("type", {
    enum: [
      "in-chapter",
      "priority",
      "banner",
      "loading",
      "ebook-waiting",
      "other",
    ],
  }).default("in-chapter"),
  createdAt: integer("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// ChapterLocks table to track which chapters are locked for which users
export const chapterLocks = sqliteTable("chapter_locks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id"), // Null means applies to all non-logged in users
  chapterId: integer("chapter_id").notNull(),
  advertisementId: integer("advertisement_id").notNull(),
  isUnlocked: integer("is_unlocked", { mode: "boolean" }).default(false),
  unlockExpiry: integer("unlock_expiry"), // Timestamp when lock expires (null = never)
  createdAt: integer("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at").default(sql`CURRENT_TIMESTAMP`),
});
