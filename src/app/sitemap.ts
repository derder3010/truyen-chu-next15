import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://yourdomain.com",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://yourdomain.com/truyen",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: "https://yourdomain.com/the-loai",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: "https://yourdomain.com/bang-xep-hang",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.6,
    },
    // Thêm các URL quan trọng khác của trang web vào đây
  ];
}
