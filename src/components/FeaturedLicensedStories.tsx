import React from "react";
import Link from "next/link";
import BookCard from "./LicensedAndEbookComponents/BookCard";

interface PurchaseLink {
  name?: string;
  store?: string;
  url: string;
}

interface LicensedStory {
  id: string | number;
  title: string;
  author: string;
  coverImage?: string;
  genres: string[] | string;
  description: string;
  status: string;
  slug: string;
  purchaseLinks?: PurchaseLink[];
}

interface FeaturedLicensedStoriesProps {
  stories: LicensedStory[];
}

const FeaturedLicensedStories = ({ stories }: FeaturedLicensedStoriesProps) => {
  if (stories.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-2xl font-bold">Truyện Xuất Bản</h2>
        <div className="h-1 flex-1 bg-primary opacity-20 rounded-full"></div>
        <Link href="/xuat-ban" className="btn btn-sm btn-outline">
          Xem tất cả
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {stories.map((story: LicensedStory) => (
          <BookCard key={story.id} book={story} type="licensed" />
        ))}
      </div>
    </section>
  );
};

export default FeaturedLicensedStories;
