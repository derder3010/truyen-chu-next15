import { db } from "@/lib/db";
import { ebooks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Helper function to get ebook by slug
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
      genres: ebook.genres
        ? ebook.genres.split(",").map((g: string) => g.trim())
        : [],
      purchaseLinks: ebook.purchaseLinks
        ? JSON.parse(ebook.purchaseLinks as string)
        : [],
    };
  } catch (error) {
    console.error(`Error fetching ebook by slug/id ${slugOrId}:`, error);
    return null;
  }
}
