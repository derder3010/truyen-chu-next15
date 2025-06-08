import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stories, chapters } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET: Fetch a single novel by slug for public view
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    // Fetch the novel
    const novel = await db.query.stories.findFirst({
      where: eq(stories.slug, slug),
    });

    if (!novel) {
      return NextResponse.json({ error: "Novel not found" }, { status: 404 });
    }

    // Fetch all chapters for this novel
    const novelChapters = await db.query.chapters.findMany({
      where: eq(chapters.novelId, novel.id),
      orderBy: (chapters, { asc }) => [asc(chapters.chapterNumber)],
    });

    // Format the genres as an array, handling the case where there's no genre
    const genresArray = novel.genres
      ? novel.genres.split(",").map((genre) => genre.trim())
      : [];

    // Format the response to match the expected Story type in frontend
    const formattedNovel = {
      ...novel,
      genres: genresArray,
      totalChapters: novelChapters.length,
      views: novel.viewCount || 0,
      rating: 0, // Not implemented yet
      lastUpdated: novel.updatedAt
        ? new Date(novel.updatedAt * 1000).toISOString()
        : new Date().toISOString(),
      status: novel.status === "ongoing" ? "Đang tiến hành" : "Đã hoàn thành",
    };

    return NextResponse.json({
      novel: formattedNovel,
      chapters: novelChapters,
    });
  } catch (error) {
    console.error("Error fetching novel:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
