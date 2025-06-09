import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stories } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { existsSync } from "fs";
import { eq } from "drizzle-orm";
import {
  revalidateStory,
  revalidateGenres,
  revalidateCompletedStories,
} from "@/app/actions";

// GET: Fetch a single novel by ID
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Check authentication and authorization
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // Fetch the novel
    const novel = await db.query.stories.findFirst({
      where: eq(stories.id, id),
    });

    if (!novel) {
      return NextResponse.json({ error: "Novel not found" }, { status: 404 });
    }

    // Map the database 'genres' field to both 'genres' and 'genre' for backward compatibility
    return NextResponse.json({
      novel: {
        ...novel,
        genre: novel.genres,
      },
    });
  } catch (error) {
    console.error("Error fetching novel:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT: Update a novel
export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Check authentication and authorization
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // Check if the novel exists
    const existingNovel = await db.query.stories.findFirst({
      where: eq(stories.id, id),
    });

    if (!existingNovel) {
      return NextResponse.json({ error: "Novel not found" }, { status: 404 });
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
    let coverImagePath = existingNovel.coverImage || "";
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

    // Update the novel in the database
    const updatedNovel = await db
      .update(stories)
      .set({
        title,
        slug,
        author,
        description,
        coverImage: coverImagePath,
        genres,
        youtubeEmbed: youtubeEmbed || null,
        status:
          status === "paused" ? "ongoing" : (status as "ongoing" | "completed"),
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .where(eq(stories.id, id))
      .returning();

    // Revalidate the story pages
    await revalidateStory(slug);

    // If genres were updated, revalidate genre pages
    await revalidateGenres();

    // If status is completed, revalidate completed stories page
    if (status === "completed") {
      await revalidateCompletedStories();
    }

    return NextResponse.json({
      message: "Novel updated successfully",
      novel: updatedNovel[0],
    });
  } catch (error) {
    console.error("Error updating novel:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a novel
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Check authentication and authorization
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // Check if the novel exists
    const existingNovel = await db.query.stories.findFirst({
      where: eq(stories.id, id),
    });

    if (!existingNovel) {
      return NextResponse.json({ error: "Novel not found" }, { status: 404 });
    }

    // Delete the novel
    await db.delete(stories).where(eq(stories.id, id));

    return NextResponse.json({
      message: "Novel deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting novel:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
