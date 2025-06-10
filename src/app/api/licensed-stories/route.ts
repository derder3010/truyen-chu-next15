import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { licensedStories } from "@/lib/db/schema";
import { eq, like, or, desc, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth/server";

// GET /api/licensed-stories - Get all licensed stories
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const tag = searchParams.get("tag");
    const isAdmin = searchParams.get("admin") === "true";

    // Kiểm tra xác thực chỉ khi là API admin
    if (isAdmin) {
      const session = await getSession();
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const offset = (page - 1) * limit;

    // Build query based on filters
    let query = db.select().from(licensedStories);
    let countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(licensedStories);

    if (status) {
      // Make sure to cast the status to the correct type
      const statusValue = status === "completed" ? "completed" : "ongoing";
      query = query.where(eq(licensedStories.status, statusValue)) as any;
      countQuery = countQuery.where(
        eq(licensedStories.status, statusValue)
      ) as any;
    }

    if (search) {
      const likeSearch = `%${search}%`;
      query = query.where(
        or(
          like(licensedStories.title, likeSearch),
          like(licensedStories.author, likeSearch)
        )
      ) as any;
      countQuery = countQuery.where(
        or(
          like(licensedStories.title, likeSearch),
          like(licensedStories.author, likeSearch)
        )
      ) as any;
    }

    if (tag) {
      // Tìm kiếm theo tag trong trường genres
      // Vì genres là chuỗi nên chúng ta dùng like để tìm kiếm
      const likeTag = `%${tag}%`;
      query = query.where(like(licensedStories.genres, likeTag)) as any;
      countQuery = countQuery.where(
        like(licensedStories.genres, likeTag)
      ) as any;
    }

    // Apply pagination
    query = query
      .limit(limit)
      .offset(offset)
      .orderBy(desc(licensedStories.createdAt)) as any;

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
    console.error("Error fetching licensed stories:", error);
    return NextResponse.json(
      { error: "Failed to fetch licensed stories" },
      { status: 500 }
    );
  }
}

// POST /api/licensed-stories - Create a new licensed story
export async function POST(request: NextRequest) {
  try {
    // Check authentication for admin api
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      slug,
      author,
      // description,
      // coverImage,
      // genres,
      // status,
      // purchaseLinks,
    } = body;

    if (!title || !slug || !author) {
      return NextResponse.json(
        { error: "Title, slug, and author are required" },
        { status: 400 }
      );
    }

    // Check if the slug already exists
    const existingStory = await db
      .select()
      .from(licensedStories)
      .where(eq(licensedStories.slug, slug))
      .limit(1);

    if (existingStory.length > 0) {
      return NextResponse.json(
        { error: "A story with this slug already exists" },
        { status: 400 }
      );
    }

    // Store purchase links as JSON string
    // const purchaseLinksJson =
    //   purchaseLinks && purchaseLinks.length > 0
    //     ? JSON.stringify(purchaseLinks)
    //     : null;

    // const timestamp = Math.floor(Date.now() / 1000);

    // Insert the new story
    // const result = await db.insert(licensedStories).values({
    //   title,
    //   slug,
    //   author,
    //   description: description || null,
    //   coverImage: coverImage || null,
    //   genres: genres || null,
    //   status: status || "ongoing",
    //   purchaseLinks: purchaseLinksJson,
    //   createdAt: timestamp,
    //   updatedAt: timestamp,
    // });

    return NextResponse.json(
      { message: "Licensed story created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating licensed story:", error);
    return NextResponse.json(
      { error: "Failed to create licensed story" },
      { status: 500 }
    );
  }
}
