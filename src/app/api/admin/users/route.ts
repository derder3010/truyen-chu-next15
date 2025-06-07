import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { verifySession } from "@/lib/auth/server";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();

    // Check if user is authenticated and is admin
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { message: "Không có quyền thực hiện hành động này" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, password, role } = body;

    // Basic validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Thiếu thông tin bắt buộc" },
        { status: 400 }
      );
    }

    // Check if user with email already exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Email đã được sử dụng" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
        password: hashedPassword,
        role: role === "admin" ? "admin" : "editor",
      })
      .returning();

    // Create a new object without the password
    const userWithoutPassword = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      createdAt: newUser.createdAt,
    };

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { message: "Lỗi máy chủ nội bộ" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await verifySession();

    // Check if user is authenticated and is admin
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { message: "Không có quyền thực hiện hành động này" },
        { status: 403 }
      );
    }

    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(users.id);

    return NextResponse.json(allUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { message: "Lỗi máy chủ nội bộ" },
      { status: 500 }
    );
  }
}
