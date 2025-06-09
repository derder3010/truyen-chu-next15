import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stories } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { existsSync } from "fs";

// GET: Fetch all novels
export async function GET(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const statusParam = searchParams.get("status");
    const searchParam = searchParams.get("search");

    // Fetch all novels
    const allNovels = await db.query.stories.findMany({
      orderBy: (stories, { desc }) => [desc(stories.createdAt)],
    });

    // Apply filters in memory (simpler than query building)
    let filteredNovels = allNovels;

    if (statusParam) {
      filteredNovels = filteredNovels.filter(
        (novel) => novel.status === statusParam
      );
    }

    if (searchParam) {
      const searchLower = searchParam.toLowerCase();
      filteredNovels = filteredNovels.filter(
        (novel) =>
          novel.title.toLowerCase().includes(searchLower) ||
          novel.author?.toLowerCase().includes(searchLower)
      );
    }

    // Simple pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedNovels = filteredNovels.slice(startIndex, endIndex);

    return NextResponse.json({
      novels: paginatedNovels,
      pagination: {
        total: filteredNovels.length,
        page,
        limit,
        totalPages: Math.ceil(filteredNovels.length / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching novels:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Process form data
    const formData = await request.formData();
    const title = formData.get("title") as string;
    const slug = formData.get("slug") as string;
    const author = formData.get("author") as string;
    const status = formData.get("status") as string;
    const description = formData.get("description") as string;
    const genre = formData.get("genre") as string;
    const keywords = formData.get("keywords") as string;
    const youtubeEmbed = formData.get("youtubeEmbed") as string;

    // Combine genre and keywords into genres field
    let genres = genre || "";
    if (keywords) {
      genres = genres ? `${genres},${keywords}` : keywords;
    }

    // Validate required fields
    if (!title || !slug || !author || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Handle file upload if present
    let coverImagePath = "";
    const coverImage = formData.get("coverImage") as File;

    if (coverImage && coverImage.size > 0) {
      try {
        const bytes = await coverImage.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create unique filename
        const fileExt = coverImage.name.split(".").pop() || "jpg";
        const fileName = `${randomUUID()}.${fileExt}`;

        // Ensure upload directory exists
        const uploadDir = join(process.cwd(), "public", "uploads", "covers");
        if (!existsSync(uploadDir)) {
          await mkdir(uploadDir, { recursive: true });
        }

        const filePath = join(uploadDir, fileName);

        // Save the file
        await writeFile(filePath, buffer);
        coverImagePath = `/uploads/covers/${fileName}`;
      } catch (error) {
        console.error("Error saving cover image:", error);
        return NextResponse.json(
          { error: "Failed to upload cover image" },
          { status: 500 }
        );
      }
    }

    // Insert the novel into the database
    const newNovel = await db
      .insert(stories)
      .values({
        title,
        slug,
        author,
        description,
        coverImage: coverImagePath,
        genres: genre || null,
        youtubeEmbed: youtubeEmbed || null,
        status:
          status === "paused" ? "ongoing" : (status as "ongoing" | "completed"),
        createdAt: Math.floor(Date.now() / 1000),
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .returning();

    return NextResponse.json({
      message: "Novel created successfully",
      novel: newNovel[0],
    });
  } catch (error) {
    console.error("Error creating novel:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
