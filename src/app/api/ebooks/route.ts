import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ebooks } from "@/lib/db/schema";
import { eq, like, or, desc, asc, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth/server";

// GET /api/ebooks - Get all ebooks with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const offset = (page - 1) * limit;

    // Build query based on filters
    let query = db.select().from(ebooks);
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(ebooks);

    if (status) {
      // Make sure to cast the status to the correct type
      const statusValue = status === "completed" ? "completed" : "ongoing";
      query = query.where(eq(ebooks.status, statusValue)) as any;
      countQuery = countQuery.where(eq(ebooks.status, statusValue)) as any;
    }

    if (search) {
      const likeSearch = `%${search}%`;
      query = query.where(
        or(like(ebooks.title, likeSearch), like(ebooks.author, likeSearch))
      ) as any;
      countQuery = countQuery.where(
        or(like(ebooks.title, likeSearch), like(ebooks.author, likeSearch))
      ) as any;
    }

    // Apply pagination
    query = query
      .limit(limit)
      .offset(offset)
      .orderBy(desc(ebooks.createdAt)) as any;

    // Execute queries
    const stories = await query;
    const totalResult = await countQuery;
    const total = totalResult[0]?.count || 0;

    // Process purchase links
    const processedStories = stories.map((story) => ({
      ...story,
      purchaseLinks: story.purchaseLinks
        ? JSON.parse(story.purchaseLinks as string)
        : [],
    }));

    // Return results with pagination
    return NextResponse.json({
      stories: processedStories,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching ebooks:", error);
    return NextResponse.json(
      { error: "Failed to fetch ebooks" },
      { status: 500 }
    );
  }
}

// POST /api/ebooks - Create a new ebook
export async function POST(request: NextRequest) {
  try {
    // Verify admin session
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.slug || !body.author) {
      return NextResponse.json(
        { error: "Title, slug and author are required" },
        { status: 400 }
      );
    }

    // Check for existing story with the same slug
    const existingStory = await db
      .select()
      .from(ebooks)
      .where(eq(ebooks.slug, body.slug))
      .limit(1);

    if (existingStory.length > 0) {
      return NextResponse.json(
        { error: "An ebook with this slug already exists" },
        { status: 400 }
      );
    }

    // Process purchase links (ensure it's stored as a JSON string)
    const purchaseLinks = body.purchaseLinks
      ? JSON.stringify(body.purchaseLinks)
      : null;

    // Cast status to the correct type
    const status = body.status === "ongoing" ? "ongoing" : "completed";

    // Insert the new ebook
    const newStory = await db
      .insert(ebooks)
      .values({
        title: body.title,
        slug: body.slug,
        author: body.author,
        description: body.description || null,
        coverImage: body.coverImage || null,
        genres: body.genres || null,
        status: status,
        purchaseLinks,
        viewCount: 0,
        createdAt: Math.floor(Date.now() / 1000),
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .returning();

    return NextResponse.json({
      message: "Ebook created successfully",
      story: {
        ...newStory[0],
        purchaseLinks: body.purchaseLinks || [],
      },
    });
  } catch (error) {
    console.error("Error creating ebook:", error);
    return NextResponse.json(
      { error: "Failed to create ebook" },
      { status: 500 }
    );
  }
}
