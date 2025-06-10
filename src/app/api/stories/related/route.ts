import { NextRequest, NextResponse } from "next/server";
import { getRelatedStories } from "@/lib/api";

// GET /api/stories/related - Get related stories based on genre
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const storyId = parseInt(searchParams.get("storyId") || "0", 10);
    const limit = parseInt(searchParams.get("limit") || "4", 10);

    if (!storyId) {
      return NextResponse.json(
        { error: "Story ID is required" },
        { status: 400 }
      );
    }

    const stories = await getRelatedStories(storyId, limit);

    return NextResponse.json({
      stories,
    });
  } catch (error) {
    console.error("Error fetching related stories:", error);
    return NextResponse.json(
      { error: "Failed to fetch related stories" },
      { status: 500 }
    );
  }
}
