export interface Chapter {
  id: string;
  storyId: string;
  storySlug: string;
  chapterNumber: number;
  title: string;
  content: string; // Plain text or simple HTML for chapter content
  publishedDate: string; // ISO date string or human-readable
}
