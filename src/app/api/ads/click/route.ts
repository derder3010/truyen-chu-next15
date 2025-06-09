import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { advertisements } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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

    const currentAd = existingAd[0];
    if (!currentAd) {
      return NextResponse.json(
        { error: "Advertisement not found" },
        { status: 404 }
      );
    }

    // Get current click count or default to 0 if null
    const currentClickCount = currentAd.clickCount ?? 0;

    // Update click count
    await db
      .update(advertisements)
      .set({
        clickCount: currentClickCount + 1,
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
