import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { advertisements } from "@/lib/db/schema";
import { eq, and, sql, or } from "drizzle-orm";

// GET /api/ads/banner - Get random banner or priority advertisements
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "1", 10);
    const type = searchParams.get("type"); // Optional: 'banner' or 'priority'

    console.log(`Fetching ads, type: ${type || "any"}, limit: ${limit}`);

    // Build the where condition based on type parameter
    let whereCondition;
    if (type === "banner" || type === "priority") {
      // Filter by specific type if provided
      whereCondition = and(
        eq(advertisements.isActive, true),
        eq(advertisements.type, type)
      );
    } else {
      // Default: get both banner and priority
      whereCondition = and(
        eq(advertisements.isActive, true),
        or(
          eq(advertisements.type, "banner"),
          eq(advertisements.type, "priority")
        )
      );
    }

    // Find ads that match the criteria
    const displayableAds = await db
      .select()
      .from(advertisements)
      .where(whereCondition)
      .orderBy(sql`RANDOM()`) // Use SQL for randomization
      .limit(limit);

    console.log(`Found ${displayableAds.length} ads matching criteria`);

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
        type: type || "banner",
      };
    });

    return NextResponse.json({ advertisements: cleanedAds });
  } catch (error) {
    console.error("Error fetching advertisements:", error);
    return NextResponse.json(
      { error: "Failed to fetch advertisements" },
      { status: 500 }
    );
  }
}
