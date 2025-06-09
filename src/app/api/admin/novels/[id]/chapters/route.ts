import { NextRequest, NextResponse } from "next/server";
import { db, fixChapterNumbering } from "@/lib/db";
import { chapters, stories } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/server";
import { eq, desc, asc } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { revalidateChapter } from "@/app/actions";

// GET: Fetch all chapters for a novel
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const params = await context.params;
  const { id } = params;
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const sort = searchParams.get("sort") || "desc"; // desc for newest first, asc for oldest first

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

    // Calculate pagination values
    const offset = (page - 1) * limit;

    // Get total count of chapters
    const countResult = await db
      .select({ count: sql`count(*)` })
      .from(chapters)
      .where(eq(chapters.novelId, novelId));

    const total = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(total / limit);

    // Fetch chapters for the novel with pagination and sorting
    const chaptersList = await db
      .select()
      .from(chapters)
      .where(eq(chapters.novelId, novelId))
      .orderBy(
        sort === "desc"
          ? desc(chapters.chapterNumber)
          : asc(chapters.chapterNumber)
      )
      .limit(limit)
      .offset(offset);

    // Format createdAt and updatedAt
    const formattedChapters = chaptersList.map((chapter) => ({
      ...chapter,
      createdAt: chapter.createdAt || Math.floor(Date.now() / 1000),
      updatedAt: chapter.updatedAt || Math.floor(Date.now() / 1000),
    }));

    return NextResponse.json({
      chapters: formattedChapters,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
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
  context: { params: { id: string } }
) {
  const params = await context.params;
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

    // Get the story slug for revalidation
    const story = await db.query.stories.findFirst({
      where: eq(stories.id, novelId),
    });

    if (story) {
      // Revalidate both the story and new chapter pages
      await revalidateChapter(story.slug, chapterNumber);
    }

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
