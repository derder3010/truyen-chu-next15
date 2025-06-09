import { db } from "./";
import { stories, chapters } from "./schema";
import { eq, and } from "drizzle-orm";
import fs from "fs";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config();

// Kiểm tra biến môi trường
const dbUrl = process.env.DATABASE_URL || "file:./sqlite.db";
console.log(`Using database URL: ${dbUrl}`);

interface StoryImport {
  title: string;
  slug: string;
  author: string;
  description: string;
  coverImage: string;
  genres: string[];
  status: "completed" | "ongoing";
  chapters: ChapterImport[];
}

interface ChapterImport {
  title: string;
  chapterNumber: number;
  content: string;
}

async function uploadStories(filePath: string) {
  console.log(`Reading stories from ${filePath}...`);

  try {
    // Read the JSON file
    const jsonData = fs.readFileSync(filePath, "utf8");
    const storiesToImport: StoryImport[] = JSON.parse(jsonData);

    console.log(`Found ${storiesToImport.length} stories to import.`);

    for (const storyData of storiesToImport) {
      console.log(`Processing story: ${storyData.title}`);

      // Check if story already exists
      const existingStory = await db
        .select()
        .from(stories)
        .where(eq(stories.slug, storyData.slug))
        .get();

      let storyId: number;

      if (existingStory) {
        console.log(
          `Story '${storyData.title}' already exists with ID ${existingStory.id}, updating...`
        );
        storyId = existingStory.id;

        // Update the story
        await db
          .update(stories)
          .set({
            title: storyData.title,
            author: storyData.author,
            description: storyData.description,
            coverImage: storyData.coverImage,
            genres: storyData.genres.join(","),
            status: storyData.status,
            updatedAt: Math.floor(Date.now() / 1000),
          })
          .where(eq(stories.id, storyId));
      } else {
        console.log(`Creating new story '${storyData.title}'...`);

        // Insert the story
        const [newStory] = await db
          .insert(stories)
          .values({
            title: storyData.title,
            slug: storyData.slug,
            author: storyData.author,
            description: storyData.description,
            coverImage: storyData.coverImage,
            genres: storyData.genres.join(","),
            status: storyData.status,
            viewCount: 0,
            createdAt: Math.floor(Date.now() / 1000),
            updatedAt: Math.floor(Date.now() / 1000),
          })
          .returning();

        storyId = newStory.id;
      }

      // Process chapters
      console.log(
        `Processing ${storyData.chapters.length} chapters for story '${storyData.title}'...`
      );

      for (const chapterData of storyData.chapters) {
        // Create slug for chapter
        const chapterSlug = `chuong-${chapterData.chapterNumber}`;

        // Check if chapter already exists
        const existingChapter = await db
          .select()
          .from(chapters)
          .where(
            and(
              eq(chapters.novelId, storyId),
              eq(chapters.chapterNumber, chapterData.chapterNumber)
            )
          )
          .get();

        if (existingChapter) {
          console.log(
            `Updating chapter ${chapterData.chapterNumber}: '${chapterData.title}'...`
          );

          // Update the chapter
          await db
            .update(chapters)
            .set({
              title: chapterData.title,
              content: chapterData.content,
              updatedAt: Math.floor(Date.now() / 1000),
            })
            .where(eq(chapters.id, existingChapter.id));
        } else {
          console.log(
            `Creating chapter ${chapterData.chapterNumber}: '${chapterData.title}'...`
          );

          // Insert the chapter
          await db.insert(chapters).values({
            novelId: storyId,
            title: chapterData.title,
            slug: chapterSlug,
            content: chapterData.content,
            chapterNumber: chapterData.chapterNumber,
            viewCount: 0,
            createdAt: Math.floor(Date.now() / 1000),
            updatedAt: Math.floor(Date.now() / 1000),
          });
        }
      }

      console.log(`Finished processing story '${storyData.title}'.`);
    }

    console.log("Import completed successfully!");
  } catch (error) {
    console.error("Error importing stories:", error);
    process.exit(1);
  }
}

// Get the file path from command line arguments
const args = process.argv.slice(2);
let filePath: string;

if (args.length === 0) {
  // Sử dụng đường dẫn mặc định đến thư mục data
  const defaultPath = path.resolve(
    process.cwd(),
    "src",
    "data",
    "stories.json"
  );

  // Kiểm tra xem file mặc định có tồn tại không
  if (fs.existsSync(defaultPath)) {
    filePath = defaultPath;
    console.log(`No file path provided, using default: ${filePath}`);
  } else {
    // Thử tìm file stories-sample.json
    const samplePath = path.resolve(
      process.cwd(),
      "src",
      "data",
      "stories-sample.json"
    );

    if (fs.existsSync(samplePath)) {
      filePath = samplePath;
      console.log(`No file path provided, using sample file: ${filePath}`);
    } else {
      console.error("Default data file not found at: " + defaultPath);
      console.log("Usage: npm run upload:stories -- [path/to/stories.json]");
      console.log("Or create src/data/stories.json file");
      process.exit(1);
    }
  }
} else {
  filePath = args[0];
}

// Run the upload function
uploadStories(filePath)
  .catch((error) => {
    console.error("Error in upload process:", error);
    process.exit(1);
  })
  .finally(() => {
    console.log("Upload process completed.");
    process.exit(0);
  });
