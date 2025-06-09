import { NextRequest, NextResponse } from "next/server";
import {
  db,
  getChapter,
  upsertChapter,
  deleteChapter,
  fixChapterNumbering,
} from "@/lib/db";
import { stories, chapters } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/server";
import { eq } from "drizzle-orm";
import { revalidateChapter } from "@/app/actions";

// GET: Fetch a specific chapter
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; chapterId: string } }
) {
  const { id, chapterId } = params;

  try {
    // Check authentication and authorization
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const novelId = parseInt(id);
    const chapterIdInt = parseInt(chapterId);

    if (isNaN(novelId) || isNaN(chapterIdInt)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // Fetch the chapter using the helper function
    const chapter = await getChapter(novelId, chapterIdInt);

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    return NextResponse.json({ chapter });
  } catch (error) {
    console.error("Error fetching chapter:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT: Update a chapter
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; chapterId: string } }
) {
  const { id, chapterId } = params;

  try {
    // Check authentication and authorization
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const novelId = parseInt(id);
    const chapterIdInt = parseInt(chapterId);

    if (isNaN(novelId) || isNaN(chapterIdInt)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // Check if the chapter exists
    const existingChapter = await getChapter(novelId, chapterIdInt);

    if (!existingChapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { title, content, chapterNumber, slug } = body;

    // Validate required fields
    if (!title || !content || !chapterNumber || !slug) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if the new chapter number already exists (but skip if it's the same as current)
    if (chapterNumber !== existingChapter.chapterNumber) {
      const conflictingChapter = await db.query.chapters.findFirst({
        where: (chapter) =>
          eq(chapter.novelId, novelId) &&
          eq(chapter.chapterNumber, chapterNumber),
      });

      if (conflictingChapter) {
        return NextResponse.json(
          {
            error: `Chapter number ${chapterNumber} already exists for this novel`,
          },
          { status: 409 }
        );
      }
    }

    // Check if the new slug already exists (but skip if it's the same as current)
    if (slug !== existingChapter.slug) {
      const conflictingSlug = await db.query.chapters.findFirst({
        where: eq(chapters.slug, slug),
      });

      if (conflictingSlug) {
        return NextResponse.json(
          {
            error: `Slug '${slug}' already exists`,
          },
          { status: 409 }
        );
      }
    }

    // Update the chapter using the helper function
    const updatedChapter = await upsertChapter(novelId, chapterIdInt, {
      title,
      content,
      chapterNumber,
      slug,
    });

    // Update the novel's updatedAt timestamp
    await db
      .update(stories)
      .set({ updatedAt: Math.floor(Date.now() / 1000) })
      .where(eq(stories.id, novelId));

    // Get the story slug for revalidation
    const story = await db.query.stories.findFirst({
      where: eq(stories.id, novelId),
    });

    if (story) {
      // Revalidate both the story and chapter pages
      await revalidateChapter(story.slug, chapterNumber);
    }

    return NextResponse.json({
      message: "Chapter updated successfully",
      chapter: updatedChapter[0],
    });
  } catch (error) {
    console.error("Error updating chapter:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a chapter
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; chapterId: string } }
) {
  const { id, chapterId } = params;

  try {
    // Check authentication and authorization
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const novelId = parseInt(id);
    const chapterIdInt = parseInt(chapterId);

    if (isNaN(novelId) || isNaN(chapterIdInt)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // Check if the chapter exists
    const existingChapter = await getChapter(novelId, chapterIdInt);

    if (!existingChapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    // Delete the chapter and automatically renumber the remaining chapters
    await deleteChapter(novelId, chapterIdInt);

    // In case there were any numbering issues, fix them
    await fixChapterNumbering(novelId);

    // Update the novel's updatedAt timestamp
    await db
      .update(stories)
      .set({ updatedAt: Math.floor(Date.now() / 1000) })
      .where(eq(stories.id, novelId));

    // Get the story slug for revalidation
    const story = await db.query.stories.findFirst({
      where: eq(stories.id, novelId),
    });

    if (story) {
      // Revalidate the story page after chapter deletion
      await revalidateChapter(story.slug, existingChapter.chapterNumber);
    }

    return NextResponse.json({
      message: "Chapter deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting chapter:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
