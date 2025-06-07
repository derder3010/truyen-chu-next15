export interface Story {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  genres: string[];
  description: string;
  status: "Đang tiến hành" | "Đã hoàn thành";
  totalChapters: number;
  views: number;
  rating: number; // e.g., 4.5
  lastUpdated: string; // ISO date string or human-readable
  slug: string;
}

export enum StoryStatus {
  ONGOING = "Đang tiến hành",
  COMPLETED = "Đã hoàn thành",
}
