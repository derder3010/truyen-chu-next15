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

    // Get the latest migration file
    const migrationFiles = fs
      .readdirSync(migrationsFolder)
      .filter((file) => file.endsWith(".sql"))
      .sort(); // Sort to get in order

    if (migrationFiles.length === 0) {
      console.error("No migration files found");
      process.exit(1);
    }

    const latestMigration = migrationFiles[migrationFiles.length - 1];
    const migrationFile = path.join(migrationsFolder, latestMigration);

    console.log(`Applying migration: ${latestMigration}`);

    // Read the SQL content
    const sqlContent = fs.readFileSync(migrationFile, "utf8");

    // Split SQL at statement-breakpoint markers
    const statements = sqlContent
      .split("--> statement-breakpoint")
      .map((statement) => statement.trim())
      .filter((statement) => statement.length > 0);

    console.log(`Found ${statements.length} SQL statements to execute`);

    // Create a direct client connection
    const client = createClient({
      url: process.env.DATABASE_URL || "file:./sqlite.db",
      authToken: process.env.DATABASE_AUTH_TOKEN,
    });

    // Execute each SQL statement separately
    for (const sql of statements) {
      console.log(`Executing SQL:\n${sql}`);
      await client.execute(sql);
    }

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
