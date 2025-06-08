import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { createClient } from "@libsql/client";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function main() {
  console.log("Running migrations...");

  try {
    // Get the current file's directory
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const migrationsFolder = path.resolve(__dirname, "../../../drizzle");

    console.log(`Looking for migration files in: ${migrationsFolder}`);

    // Check if the migration file exists
    const migrationFile = path.join(
      migrationsFolder,
      "0001_military_naoko.sql"
    );
    if (!fs.existsSync(migrationFile)) {
      console.error(`Migration file not found: ${migrationFile}`);
      process.exit(1);
    }

    // Read the SQL content
    const sql = fs.readFileSync(migrationFile, "utf8");
    console.log(`Executing SQL: ${sql}`);

    // Create a direct client connection
    const client = createClient({
      url: process.env.DATABASE_URL || "file:./sqlite.db",
      authToken: process.env.DATABASE_AUTH_TOKEN,
    });

    // Execute the SQL
    await client.execute(sql);

    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Error running migration:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error during migration:", error);
    process.exit(1);
  });
