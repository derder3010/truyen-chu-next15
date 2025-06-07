import { NextRequest, NextResponse } from "next/server";
import { db, getNovelChapters, fixChapterNumbering } from "@/lib/db";
import { chapters, stories } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/server";
import { eq } from "drizzle-orm";

// GET: Fetch all chapters for a novel
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    // Check authentication and authorization
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const novelId = parseInt(id);
    if (isNaN(novelId)) {
      return NextResponse.json(
        { error: "Invalid novel ID format" },
        { status: 400 }
      );
    }

    // Check if the novel exists
    const novel = await db.query.stories.findFirst({
      where: eq(stories.id, novelId),
    });

    if (!novel) {
      return NextResponse.json({ error: "Novel not found" }, { status: 404 });
    }

    // Check if we need to fix numbering
    const shouldFix =
      request.nextUrl.searchParams.get("fix_numbering") === "true";
    if (shouldFix) {
      await fixChapterNumbering(novelId);
    }

    // Fetch chapters for the novel using the helper function
    const chaptersList = await getNovelChapters(novelId);

    return NextResponse.json({ chapters: chaptersList });
  } catch (error) {
    console.error("Error fetching chapters:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Add a new chapter
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    // Check authentication and authorization
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const novelId = parseInt(id);
    if (isNaN(novelId)) {
      return NextResponse.json(
        { error: "Invalid novel ID format" },
        { status: 400 }
      );
    }

    // Check if the novel exists
    const novel = await db.query.stories.findFirst({
      where: eq(stories.id, novelId),
    });

    if (!novel) {
      return NextResponse.json({ error: "Novel not found" }, { status: 404 });
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

    // Check if chapter number already exists for this novel
    const existingChapter = await db.query.chapters.findFirst({
      where: (chapter) =>
        eq(chapter.novelId, novelId) &&
        eq(chapter.chapterNumber, chapterNumber),
    });

    if (existingChapter) {
      return NextResponse.json(
        {
          error: `Chapter number ${chapterNumber} already exists for this novel`,
        },
        { status: 409 }
      );
    }

    // Check if slug already exists
    const existingSlug = await db.query.chapters.findFirst({
      where: eq(chapters.slug, slug),
    });

    if (existingSlug) {
      return NextResponse.json(
        { error: `Slug '${slug}' already exists` },
        { status: 409 }
      );
    }

    // Insert the chapter using the helper function
    const newChapter = await db
      .insert(chapters)
      .values({
        novelId,
        title,
        content,
        chapterNumber,
        slug,
        createdAt: Math.floor(Date.now() / 1000),
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .returning();

    // Update the novel's updatedAt timestamp
    await db
      .update(stories)
      .set({ updatedAt: Math.floor(Date.now() / 1000) })
      .where(eq(stories.id, novelId));

    return NextResponse.json({
      message: "Chapter added successfully",
      chapter: newChapter[0],
    });
  } catch (error) {
    console.error("Error adding chapter:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
