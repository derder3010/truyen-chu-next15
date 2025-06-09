import React from "react";
import Link from "next/link";
import Image from "next/image";

interface SearchResultItemProps {
  item: any; // Có thể là Story, Licensed Story hoặc Ebook
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({ item }) => {
  // Xác định route dựa vào loại item
  const getItemRoute = () => {
    switch (item.type) {
      case "licensed":
        return `/xuat-ban/${item.slug}`;
      case "ebook":
        return `/ebook/${item.slug}`;
      case "story":
      default:
        return `/truyen/${item.slug}`;
    }
  };

  // Xác định badge và màu sắc dựa vào loại item
  const getBadgeInfo = () => {
    switch (item.type) {
      case "licensed":
        return { text: "Xuất bản", className: "badge-secondary" };
      case "ebook":
        return { text: "Ebook", className: "badge-accent" };
      case "story":
      default:
        return { text: "Truyện", className: "badge-primary" };
    }
  };

  const badge = getBadgeInfo();
  const itemRoute = getItemRoute();

  // Convert genres từ string sang array nếu cần
  const genres =
    typeof item.genres === "string"
      ? item.genres
          .split(",")
          .map((g: string) => g.trim())
          .filter(Boolean)
      : Array.isArray(item.genres)
      ? item.genres
      : [];

  return (
    <div className="card card-compact bg-base-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden rounded-xl">
      <Link href={itemRoute} className="group">
        <figure className="relative h-48 sm:h-56 md:h-64 w-full overflow-hidden rounded-t-xl">
          <Image
            src={item.coverImage || "/images/placeholder.jpg"}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div
            className={`badge ${badge.className} badge-sm absolute top-2 right-2`}
          >
            {badge.text}
          </div>
        </figure>

        <div className="card-body p-3 pt-2 rounded-b-xl">
          <h3 className="card-title text-base line-clamp-1 group-hover:text-primary group-hover:underline">
            {item.title}
          </h3>
          <p className="text-xs opacity-70">{item.author}</p>

          {/* Display genres if available */}
          {genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {genres.slice(0, 2).map((genre: string, index: number) => (
                <span key={index} className="badge badge-outline badge-xs">
                  {genre}
                </span>
              ))}
              {genres.length > 2 && (
                <span className="badge badge-outline badge-xs">
                  +{genres.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
};

export default SearchResultItem;
