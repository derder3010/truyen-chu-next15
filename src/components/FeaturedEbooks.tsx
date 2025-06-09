import React from "react";
import Link from "next/link";
import BookCard from "./LicensedAndEbookComponents/BookCard";

interface PurchaseLink {
  name?: string;
  store?: string;
  url: string;
}

interface Ebook {
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

interface FeaturedEbooksProps {
  stories: Ebook[];
}

const FeaturedEbooks = ({ stories }: FeaturedEbooksProps) => {
  if (stories.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-2xl font-bold">Ebook</h2>
        <div className="h-1 flex-1 bg-primary opacity-20 rounded-full"></div>
        <Link href="/ebook" className="btn btn-sm btn-outline">
          Xem tất cả
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {stories.map((ebook: Ebook) => (
          <BookCard key={ebook.id} book={ebook} type="ebook" />
        ))}
      </div>
    </section>
  );
};

export default FeaturedEbooks;
