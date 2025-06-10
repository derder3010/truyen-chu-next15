import { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { stories, chapters, licensedStories, ebooks } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Base URL from env or default
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://doctruyenfull.io.vn";

  // Current date for lastModified
  const now = new Date();

  try {
    // Fetch data with individual try/catch blocks
    let allStories: any[] = [];
    let allChapters: any[] = [];
    let allLicensedStories: any[] = [];
    let allEbooks: any[] = [];
    let genres: string[] = [];

    // Fetch regular stories
    try {
      allStories = await db
        .select({
          id: stories.id,
          slug: stories.slug,
          updatedAt: stories.updatedAt,
        })
        .from(stories)
        .orderBy(stories.updatedAt);
    } catch (error) {
      console.error("Error fetching stories for sitemap:", error);
    }

    // Fetch chapters for stories
    try {
      // Limit to reasonable number to avoid sitemap getting too large
      allChapters = await db
        .select({
          id: chapters.id,
          storyId: chapters.novelId,
          chapterNumber: chapters.chapterNumber,
          updatedAt: chapters.updatedAt,
        })
        .from(chapters)
        .orderBy(chapters.updatedAt)
        .limit(1000); // Limit to 1000 chapters for sitemap
    } catch (error) {
      console.error("Error fetching chapters for sitemap:", error);
    }

    // Fetch licensed stories
    try {
      allLicensedStories = await db
        .select({
          slug: licensedStories.slug,
          updatedAt: licensedStories.updatedAt,
        })
        .from(licensedStories)
        .orderBy(licensedStories.updatedAt);
    } catch (error) {
      console.error("Error fetching licensed stories for sitemap:", error);
    }

    // Fetch ebooks
    try {
      allEbooks = await db
        .select({
          slug: ebooks.slug,
          updatedAt: ebooks.updatedAt,
        })
        .from(ebooks)
        .orderBy(ebooks.updatedAt);
    } catch (error) {
      console.error("Error fetching ebooks for sitemap:", error);
    }

    // Fetch unique genres from stories
    try {
      const genresResult = await db
        .select({ genres: stories.genres })
        .from(stories)
        .where(sql`${stories.genres} IS NOT NULL`);

      // Extract and flatten genres from all stories
      const genreSet = new Set<string>();
      genresResult.forEach((result) => {
        if (result.genres) {
          const storyGenres = result.genres
            .split(",")
            .map((g: string) => g.trim());
          storyGenres.forEach((genre: string) => {
            if (genre) genreSet.add(genre);
          });
        }
      });

      genres = Array.from(genreSet);
    } catch (error) {
      console.error("Error fetching genres for sitemap:", error);
    }

    // Static routes
    const staticRoutes = [
      {
        url: baseUrl,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 1,
      },
      {
        url: `${baseUrl}/truyen`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.8,
      },
      {
        url: `${baseUrl}/the-loai`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      },
      {
        url: `${baseUrl}/bang-xep-hang`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.6,
      },
      {
        url: `${baseUrl}/tim-kiem`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.7,
      },
      {
        url: `${baseUrl}/lich-su`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.5,
      },
      {
        url: `${baseUrl}/truyen-ban-quyen`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      },
      {
        url: `${baseUrl}/ebook`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      },
    ] as MetadataRoute.Sitemap;

    // Genre routes
    const genreRoutes = genres.map((genre) => {
      // Convert genre to slug format
      const slug = genre
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^\w\s]/gi, "")
        .replace(/\s+/g, "-");

      return {
        url: `${baseUrl}/the-loai/${slug}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      };
    });

    // Story routes
    const storyRoutes = allStories.map((story) => ({
      url: `${baseUrl}/truyen/${story.slug}`,
      lastModified: story.updatedAt ? new Date(story.updatedAt * 1000) : now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    // Get the mapping of story IDs to slugs
    const storyIdToSlugMap = new Map();
    allStories.forEach((story) => {
      storyIdToSlugMap.set(story.id, story.slug);
    });

    // Chapter routes - only include if we have the story slug
    const chapterRoutes = allChapters
      .filter((chapter) => storyIdToSlugMap.has(chapter.storyId))
      .map((chapter) => {
        const storySlug = storyIdToSlugMap.get(chapter.storyId);
        return {
          url: `${baseUrl}/truyen/${storySlug}/chuong-${chapter.chapterNumber}`,
          lastModified: chapter.updatedAt
            ? new Date(chapter.updatedAt * 1000)
            : now,
          changeFrequency: "monthly" as const,
          priority: 0.7,
        };
      });

    // Licensed story routes
    const licensedStoryRoutes = allLicensedStories.map((story) => ({
      url: `${baseUrl}/truyen-ban-quyen/${story.slug}`,
      lastModified: story.updatedAt ? new Date(story.updatedAt * 1000) : now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

    // Ebook routes
    const ebookRoutes = allEbooks.map((ebook) => ({
      url: `${baseUrl}/ebook/${ebook.slug}`,
      lastModified: ebook.updatedAt ? new Date(ebook.updatedAt * 1000) : now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

    // Combine all routes
    const allRoutes = [
      ...staticRoutes,
      ...genreRoutes,
      ...storyRoutes,
      ...chapterRoutes,
      ...licensedStoryRoutes,
      ...ebookRoutes,
    ];

    // Limit the sitemap size if it's too large (50,000 URLs is the limit for a single sitemap)
    const maxSitemapSize = 45000;
    if (allRoutes.length > maxSitemapSize) {
      console.warn(
        `Sitemap is too large (${allRoutes.length} URLs). Limiting to ${maxSitemapSize} URLs.`
      );
      return allRoutes.slice(0, maxSitemapSize);
    }

    return allRoutes;
  } catch (error) {
    console.error("Error generating sitemap:", error);

    // Return at least static routes on error
    return [
      {
        url: baseUrl,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 1,
      },
      {
        url: `${baseUrl}/truyen`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.8,
      },
      {
        url: `${baseUrl}/the-loai`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      },
      {
        url: `${baseUrl}/bang-xep-hang`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.6,
      },
    ];
  }
}
