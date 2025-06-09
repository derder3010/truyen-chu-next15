import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { advertisements } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/server";

interface Params {
  params: {
    id: string;
  };
}

// Get a specific advertisement by ID
export async function GET(request: NextRequest, { params }: Params) {
  try {
    // Verify authentication and admin role
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const id = parseInt((await params).id, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid advertisement ID" },
        { status: 400 }
      );
    }

    // Fetch the advertisement
    const result = await db
      .select()
      .from(advertisements)
      .where(eq(advertisements.id, id))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Advertisement not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error fetching advertisement:", error);
    return NextResponse.json(
      { error: "Failed to fetch advertisement" },
      { status: 500 }
    );
  }
}

// Update an advertisement
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    // Verify authentication and admin role
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const id = parseInt((await params).id, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid advertisement ID" },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    console.log("PATCH request body:", body);

    // Validate the advertisement exists
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

    // Update fields
    const updateData: any = {
      updatedAt: Math.floor(Date.now() / 1000),
    };

    // Only update provided fields
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.affiliateUrl !== undefined)
      updateData.affiliateUrl = body.affiliateUrl;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.displayFrequency !== undefined)
      updateData.displayFrequency = body.displayFrequency;
    if (body.impressionCount !== undefined)
      updateData.impressionCount = body.impressionCount;
    if (body.clickCount !== undefined) updateData.clickCount = body.clickCount;

    console.log("Updating advertisement with data:", updateData);

    // Update the advertisement
    await db
      .update(advertisements)
      .set(updateData)
      .where(eq(advertisements.id, id));

    return NextResponse.json({ message: "Advertisement updated successfully" });
  } catch (error) {
    console.error("Error updating advertisement:", error);
    return NextResponse.json(
      { error: "Failed to update advertisement" },
      { status: 500 }
    );
  }
}

// Delete an advertisement
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    // Verify authentication and admin role
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const id = parseInt((await params).id, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid advertisement ID" },
        { status: 400 }
      );
    }

    console.log("Deleting advertisement with ID:", id);

    // Validate the advertisement exists
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

    // Delete the advertisement
    await db.delete(advertisements).where(eq(advertisements.id, id));

    return NextResponse.json({ message: "Advertisement deleted successfully" });
  } catch (error) {
    console.error("Error deleting advertisement:", error);
    return NextResponse.json(
      { error: "Failed to delete advertisement" },
      { status: 500 }
    );
  }
}
