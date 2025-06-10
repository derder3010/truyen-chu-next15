import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { advertisements } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

// GET /api/ads/ebook-waiting - Get random ebook-waiting advertisements
export async function GET(request: NextRequest) {
  try {
    // Get query parameter for position (top or bottom)
    const searchParams = request.nextUrl.searchParams;
    // const position = searchParams.get("position"); // Optional: 'top' or 'bottom'
    const limit = parseInt(searchParams.get("limit") || "1", 10);

    // Find ads that are active and have the ebook-waiting type
    const conditions = [
      eq(advertisements.isActive, true),
      eq(advertisements.type, "ebook-waiting"),
    ];

    // Find ads
    const displayableAds = await db
      .select()
      .from(advertisements)
      .where(and(...conditions))
      .orderBy(sql`RANDOM()`) // Use SQL for randomization
      .limit(limit);

    // If no ad matches the criteria, return empty
    if (displayableAds.length === 0) {
      return NextResponse.json({ advertisements: [] });
    }

    // Update impression count for all returned ads
    for (const advertisement of displayableAds) {
      await db
        .update(advertisements)
        .set({
          impressionCount: (advertisement.impressionCount || 0) + 1,
          updatedAt: Math.floor(Date.now() / 1000),
        })
        .where(eq(advertisements.id, advertisement.id));
    }

    // Remove sensitive information before returning
    const cleanedAds = displayableAds.map((ad) => {
      const { id, title, description, imageUrl, affiliateUrl, type } = ad;
      return {
        id: Number(id),
        title: title || "",
        description: description || "",
        imageUrl: imageUrl || "",
        affiliateUrl: affiliateUrl || "",
        type: type || "ebook-waiting",
      };
    });

    return NextResponse.json({
      advertisements: cleanedAds,
    });
  } catch (error) {
    console.error("Error fetching ebook waiting advertisements:", error);
    return NextResponse.json(
      { error: "Failed to fetch advertisements" },
      { status: 500 }
    );
  }
}
