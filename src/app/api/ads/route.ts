import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { advertisements } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

// GET /api/ads - Get an active advertisement
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const chapterNumber = parseInt(searchParams.get("chapter") || "1", 10);

    // Find ads that are active and should be displayed for this chapter
    const displayableAds = await db
      .select()
      .from(advertisements)
      .where(
        and(
          eq(advertisements.isActive, true),
          // Only show ads where chapter number is divisible by display frequency
          // e.g. if displayFrequency is 3, show on chapters 3, 6, 9, etc.
          sql`${chapterNumber} % ${advertisements.displayFrequency} = 0`
        )
      )
      .orderBy(sql`RANDOM()`) // Use SQL for randomization
      .limit(1);

    // If no ad matches the criteria, return empty
    if (displayableAds.length === 0) {
      return NextResponse.json({ advertisement: null });
    }

    const advertisement = displayableAds[0];

    // Get current impression count or default to 0 if null
    const currentImpressionCount = advertisement.impressionCount ?? 0;

    // Update impression count
    await db
      .update(advertisements)
      .set({
        impressionCount: currentImpressionCount + 1,
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .where(eq(advertisements.id, advertisement.id));

    // Remove sensitive information before returning
    const { id, title, description, imageUrl, affiliateUrl } = advertisement;

    return NextResponse.json({
      advertisement: {
        id: Number(id), // Convert BigInt to number
        title: title ?? "",
        description: description ?? "",
        imageUrl: imageUrl ?? "",
        affiliateUrl: affiliateUrl ?? "",
      },
    });
  } catch (error) {
    console.error("Error fetching advertisement:", error);
    return NextResponse.json(
      { error: "Failed to fetch advertisement" },
      { status: 500 }
    );
  }
}

// POST /api/ads/click - Track ad click
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adId } = body;

    if (!adId) {
      return NextResponse.json(
        { error: "Advertisement ID is required" },
        { status: 400 }
      );
    }

    const id = parseInt(adId, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid advertisement ID" },
        { status: 400 }
      );
    }

    // Get the current ad
    const existingAd = await db
      .select()
      .from(advertisements)
      .where(eq(advertisements.id, id))
      .limit(1);

    if (existingAd.length === 0) {
      return NextResponse.json(
        { error: "Advertisement not found" },
        { status: 404 }
      );
    }

    // Update click count
    await db
      .update(advertisements)
      .set({
        clickCount: (existingAd[0].clickCount ?? 0) + 1,
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .where(eq(advertisements.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking advertisement click:", error);
    return NextResponse.json(
      { error: "Failed to track advertisement click" },
      { status: 500 }
    );
  }
}
