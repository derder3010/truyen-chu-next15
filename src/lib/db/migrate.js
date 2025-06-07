import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigration() {
  const client = createClient({
    url: process.env.DATABASE_URL || "file:./sqlite.db",
  });

  const db = drizzle(client);

  console.log("Running migrations...");

  try {
    await migrate(db, {
      migrationsFolder: path.join(__dirname, "../../../drizzle"),
    });
    console.log("Migrations completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

runMigration();
