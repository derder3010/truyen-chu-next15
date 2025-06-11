export interface Chapter {
  id: string;
  storyId: string;
  storySlug: string;
  storyTitle?: string; // Tên truyện
  storyAuthor?: string; // Tác giả
  chapterNumber: number;
  slug: string; // Slug của chương
  title: string;
  content: string; // Plain text or simple HTML for chapter content
  publishedDate: string; // ISO date string or human-readable
}
