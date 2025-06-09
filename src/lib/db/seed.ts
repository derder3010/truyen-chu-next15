import { db } from "./";
import { users } from "./schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Kiểm tra biến môi trường
const dbUrl = process.env.DATABASE_URL || "file:./sqlite.db";
console.log(`Using database URL: ${dbUrl}`);

async function seed() {
  console.log("Seeding database...");

  try {
    // Check if admin user already exists
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, "admin@example.com"))
      .get();

    if (existingAdmin) {
      console.log("Admin user already exists, skipping seed.");
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash("admin123", 10);

    // Create admin user
    await db.insert(users).values({
      name: "Admin User",
      email: "admin@example.com",
      password: hashedPassword,
      role: "admin",
      createdAt: Math.floor(Date.now() / 1000),
    });

    console.log("Admin user created successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

// Run seed function
seed()
  .catch((error) => {
    console.error("Error seeding database:", error);
    process.exit(1);
  })
  .finally(async () => {
    console.log("Seed process completed.");
    process.exit(0);
  });
