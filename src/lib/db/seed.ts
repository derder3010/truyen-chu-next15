import { db } from "./index";
import { users } from "./schema";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Seeding database with initial data...");

  try {
    // Check if admin user exists and create if not
    const adminExists = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, "admin@example.com"),
    });

    if (!adminExists) {
      console.log("Creating default admin user...");
      const password = await bcrypt.hash("admin123", 10);

      await db.insert(users).values({
        name: "Admin",
        email: "admin@example.com",
        password,
        role: "admin",
      });
      console.log("Default admin user created successfully");
    }

    // You can add more seed data here as needed

    console.log("Database seeding completed successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

// Run the seed function
seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error during seeding:", error);
    process.exit(1);
  });
