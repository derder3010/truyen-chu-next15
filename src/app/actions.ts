"use server";

import { revalidatePath } from "next/cache";

/**
 * Revalidate a story page when its content is updated
 */
export async function revalidateStory(slug: string) {
  // Revalidate the story page
  revalidatePath(`/truyen/${slug}`);
}

/**
 * Revalidate a chapter page when its content is updated
 */
export async function revalidateChapter(
  storySlug: string,
  chapterNumber: number
) {
  // Revalidate both the story and chapter pages
  revalidatePath(`/truyen/${storySlug}/${chapterNumber}`);
  revalidatePath(`/truyen/${storySlug}`);
}

/**
 * Revalidate genre pages when stories are added or updated
 */
export async function revalidateGenres() {
  revalidatePath("/the-loai");
}

/**
 * Revalidate completed stories page when stories are marked as completed
 */
export async function revalidateCompletedStories() {
  revalidatePath("/truyen-full");
}
