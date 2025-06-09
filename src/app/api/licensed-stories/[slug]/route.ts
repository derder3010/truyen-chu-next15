import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { licensedStories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/server";

// GET /api/licensed-stories/[slug] - Get a single story by slug
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Await the params object before using its properties
    const slug = (await params).slug;

    // Get by slug
    const result = await db
      .select()
      .from(licensedStories)
      .where(eq(licensedStories.slug, slug))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    const story = result[0];

    // Parse purchase links
    const purchaseLinks = story.purchaseLinks
      ? JSON.parse(story.purchaseLinks as string)
      : [];

    return NextResponse.json({
      story: {
        ...story,
        id: Number(story.id),
        purchaseLinks,
      },
    });
  } catch (error) {
    console.error("Error fetching licensed story:", error);
    return NextResponse.json(
      { error: "Failed to fetch story" },
      { status: 500 }
    );
  }
}

// PUT /api/licensed-stories/[slug] - Update a story
export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Check auth as admin
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    // Await the params object before using its properties
    const currentSlug = (await params).slug;

    // Check if story exists
    const existingStory = await db
      .select()
      .from(licensedStories)
      .where(eq(licensedStories.slug, currentSlug))
      .limit(1);

    if (existingStory.length === 0) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      title,
      slug: newSlug,
      author,
      description,
      coverImage,
      genres,
      status,
      purchaseLinks,
    } = body;

    if (!title || !newSlug || !author) {
      return NextResponse.json(
        { error: "Title, slug, and author are required" },
        { status: 400 }
      );
    }

    // If slug changed, check it's not used by another story
    if (newSlug !== currentSlug) {
      const slugCheck = await db
        .select()
        .from(licensedStories)
        .where(eq(licensedStories.slug, newSlug))
        .limit(1);

      if (slugCheck.length > 0) {
        return NextResponse.json(
          { error: "A story with this slug already exists" },
          { status: 400 }
        );
      }
    }

    // Store purchase links as JSON string
    const purchaseLinksJson =
      purchaseLinks && purchaseLinks.length > 0
        ? JSON.stringify(purchaseLinks)
        : null;

    // Update the story
    await db
      .update(licensedStories)
      .set({
        title,
        slug: newSlug,
        author,
        description: description || null,
        coverImage: coverImage || null,
        genres: genres || null,
        status: status || "ongoing",
        purchaseLinks: purchaseLinksJson,
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .where(eq(licensedStories.slug, currentSlug));

    return NextResponse.json({
      message: "Story updated successfully",
    });
  } catch (error) {
    console.error("Error updating licensed story:", error);
    return NextResponse.json(
      { error: "Failed to update story" },
      { status: 500 }
    );
  }
}

// DELETE /api/licensed-stories/[slug] - Delete a story
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Check auth as admin
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    // Await the params object before using its properties
    const slug = (await params).slug;

    // Check if story exists
    const existingStory = await db
      .select()
      .from(licensedStories)
      .where(eq(licensedStories.slug, slug))
      .limit(1);

    if (existingStory.length === 0) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    // Delete the story
    await db.delete(licensedStories).where(eq(licensedStories.slug, slug));

    return NextResponse.json({
      message: "Story deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting licensed story:", error);
    return NextResponse.json(
      { error: "Failed to delete story" },
      { status: 500 }
    );
  }
}
