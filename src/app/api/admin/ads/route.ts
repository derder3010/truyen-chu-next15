import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { advertisements } from "@/lib/db/schema";
import { eq, like, desc, asc, and, or } from "drizzle-orm";
import { getSession } from "@/lib/auth/server";

export async function GET(request: NextRequest) {
  try {
    // Verify authentication and admin role
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build query conditions
    let conditions = [];

    // Add status filter if provided
    if (status) {
      if (status === "active") {
        conditions.push(eq(advertisements.isActive, true));
      } else if (status === "inactive") {
        conditions.push(eq(advertisements.isActive, false));
      }
    }

    // Add search filter if provided
    if (search) {
      conditions.push(
        or(
          like(advertisements.title, `%${search}%`),
          like(advertisements.description || "", `%${search}%`)
        )
      );
    }

    // Create where clause
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Fetch total count
    const countResult = await db
      .select({ count: advertisements.id })
      .from(advertisements)
      .where(whereClause)
      .groupBy(advertisements.id);

    const total = countResult.length;

    // Fetch ads with pagination
    const result = await db
      .select()
      .from(advertisements)
      .where(whereClause)
      .orderBy(desc(advertisements.updatedAt))
      .limit(limit)
      .offset(offset);

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      advertisements: result,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching advertisements:", error);
    return NextResponse.json(
      { error: "Failed to fetch advertisements" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication and admin role
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.affiliateUrl) {
      return NextResponse.json(
        { error: "Title and affiliate URL are required" },
        { status: 400 }
      );
    }

    // Insert new advertisement
    const result = await db.insert(advertisements).values({
      title: body.title,
      description: body.description || null,
      imageUrl: body.imageUrl || null,
      affiliateUrl: body.affiliateUrl,
      displayFrequency: body.displayFrequency || 3,
      isActive: body.isActive !== undefined ? body.isActive : true,
      createdAt: Math.floor(Date.now() / 1000),
      updatedAt: Math.floor(Date.now() / 1000),
    });

    return NextResponse.json(
      {
        message: "Advertisement created successfully",
        id: result.lastInsertRowid ? Number(result.lastInsertRowid) : null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating advertisement:", error);
    return NextResponse.json(
      { error: "Failed to create advertisement" },
      { status: 500 }
    );
  }
}
