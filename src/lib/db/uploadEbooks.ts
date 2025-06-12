import { db } from "./";
import { ebooks } from "./schema";
import { eq } from "drizzle-orm";
import fs from "fs";
import dotenv from "dotenv";
import path from "path";
import { downloadAndUploadToR2 } from "../r2";

dotenv.config();

const dbUrl = process.env.DATABASE_URL || "file:./sqlite.db";
console.log(`Using database URL: ${dbUrl}`);

interface PurchaseLink {
  name: string;
  url: string;
}

interface EbookImport {
  title: string;
  slug: string;
  author: string;
  description: string;
  coverImage: string;
  genres: string[];
  status: "completed" | "ongoing";
  purchaseLinks: PurchaseLink[];
}

async function uploadEbooks(filePath: string) {
  console.log(`Reading ebooks from ${filePath}...`);

  try {
    const jsonData = fs.readFileSync(filePath, "utf8");
    const ebooksToImport: EbookImport[] = JSON.parse(jsonData);

    console.log(`Found ${ebooksToImport.length} ebooks to import.`);

    for (const ebookData of ebooksToImport) {
      console.log(`Processing ebook: ${ebookData.title}`);

      let coverImagePath = "";
      if (ebookData.coverImage) {
        try {
          coverImagePath = await downloadAndUploadToR2(
            ebookData.coverImage,
            "ebooks",
          );
        } catch (err) {
          console.warn(`Failed to upload cover image for ${ebookData.title}`);
        }
      }

      const existingEbook = await db
        .select()
        .from(ebooks)
        .where(eq(ebooks.slug, ebookData.slug))
        .get();

      if (existingEbook) {
        console.log(
          `Ebook '${ebookData.title}' already exists with ID ${existingEbook.id}, updating...`,
        );

        await db
          .update(ebooks)
          .set({
            title: ebookData.title,
            author: ebookData.author,
            description: ebookData.description,
            coverImage: coverImagePath || existingEbook.coverImage,
            genres: ebookData.genres.join(","),
            status: ebookData.status,
            purchaseLinks: JSON.stringify(ebookData.purchaseLinks || []),
            updatedAt: Math.floor(Date.now() / 1000),
          })
          .where(eq(ebooks.id, existingEbook.id));
      } else {
        console.log(`Creating new ebook '${ebookData.title}'...`);

        await db.insert(ebooks).values({
          title: ebookData.title,
          slug: ebookData.slug,
          author: ebookData.author,
          description: ebookData.description,
          coverImage: coverImagePath,
          genres: ebookData.genres.join(","),
          status: ebookData.status,
          purchaseLinks: JSON.stringify(ebookData.purchaseLinks || []),
          viewCount: 0,
          createdAt: Math.floor(Date.now() / 1000),
          updatedAt: Math.floor(Date.now() / 1000),
        });
      }

      console.log(`Finished processing ebook '${ebookData.title}'.`);
    }

    console.log("Import completed successfully!");
  } catch (error) {
    console.error("Error importing ebooks:", error);
    process.exit(1);
  }
}

const args = process.argv.slice(2);
let filePath: string;

if (args.length === 0) {
  const defaultPath = path.resolve(process.cwd(), "src", "data", "ebooks.json");

  if (fs.existsSync(defaultPath)) {
    filePath = defaultPath;
    console.log(`No file path provided, using default: ${filePath}`);
  } else {
    const samplePath = path.resolve(
      process.cwd(),
      "src",
      "data",
      "ebooks-sample.json",
    );

    if (fs.existsSync(samplePath)) {
      filePath = samplePath;
      console.log(`No file path provided, using sample file: ${filePath}`);
    } else {
      console.error("Default data file not found at: " + defaultPath);
      console.log("Usage: npm run upload:ebooks -- [path/to/ebooks.json]");
      console.log("Or create src/data/ebooks.json file");
      process.exit(1);
    }
  }
} else {
  filePath = args[0];
}

uploadEbooks(filePath)
  .catch((error) => {
    console.error("Error in upload process:", error);
    process.exit(1);
  })
  .finally(() => {
    console.log("Upload process completed.");
    process.exit(0);
  });
