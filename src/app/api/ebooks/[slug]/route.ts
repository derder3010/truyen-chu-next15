import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ebooks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/server";

// GET: Fetch a single ebook by slug
export async function GET(
  request: NextRequest,
  context: { params: { slug: string } }
) {
  try {
    // Context params is already awaited in this case, but we'll make it explicit
    const params = await context.params;
    const slug = params.slug;

    // Get by slug
    const result = await db
      .select()
      .from(ebooks)
      .where(eq(ebooks.slug, slug))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: "Ebook not found" }, { status: 404 });
    }

    const ebook = result[0];

    // Parse purchase links JSON
    const processedEbook = {
      ...ebook,
      purchaseLinks: ebook.purchaseLinks
        ? JSON.parse(ebook.purchaseLinks as string)
        : [],
    };

    return NextResponse.json({ story: processedEbook });
  } catch (error) {
    console.error("Error fetching ebook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT: Update an ebook by slug
export async function PUT(
  request: NextRequest,
  context: { params: { slug: string } }
) {
  try {
    // Check authentication and authorization
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const currentSlug = params.slug;

    // Check if the ebook exists
    const existingEbook = await db
      .select()
      .from(ebooks)
      .where(eq(ebooks.slug, currentSlug))
      .limit(1);

    if (existingEbook.length === 0) {
      return NextResponse.json({ error: "Ebook not found" }, { status: 404 });
    }

    // Process form data
    const body = await request.json();
    const title = body.title;
    const slug = body.slug;
    const author = body.author;
    const status = body.status === "ongoing" ? "ongoing" : "completed";
    const description = body.description;
    const coverImage = body.coverImage;
    const genres = body.genres;

    // Process purchase links (ensure it's stored as a JSON string)
    const purchaseLinks = body.purchaseLinks
      ? JSON.stringify(body.purchaseLinks)
      : null;

    // Validate required fields
    if (!title || !slug || !author) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check slug uniqueness (if changed)
    if (slug !== currentSlug) {
      const slugExists = await db
        .select()
        .from(ebooks)
        .where(eq(ebooks.slug, slug))
        .limit(1);

      if (slugExists.length > 0) {
        return NextResponse.json(
          { error: "An ebook with this slug already exists" },
          { status: 400 }
        );
      }
    }

    // Update the ebook in the database
    const updatedEbook = await db
      .update(ebooks)
      .set({
        title,
        slug,
        author,
        description,
        coverImage,
        genres,
        status,
        purchaseLinks,
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .where(eq(ebooks.slug, currentSlug))
      .returning();

    // Return the updated ebook with parsed purchase links
    return NextResponse.json({
      message: "Ebook updated successfully",
      story: {
        ...updatedEbook[0],
        purchaseLinks: body.purchaseLinks || [],
      },
    });
  } catch (error) {
    console.error("Error updating ebook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete an ebook by slug
export async function DELETE(
  request: NextRequest,
  context: { params: { slug: string } }
) {
  try {
    // Check authentication and authorization
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const slug = params.slug;

    // Check if the ebook exists
    const existingEbook = await db
      .select()
      .from(ebooks)
      .where(eq(ebooks.slug, slug))
      .limit(1);

    if (existingEbook.length === 0) {
      return NextResponse.json({ error: "Ebook not found" }, { status: 404 });
    }

    // Delete the ebook
    await db.delete(ebooks).where(eq(ebooks.slug, slug));

    return NextResponse.json({
      message: "Ebook deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting ebook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
