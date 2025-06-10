"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookItem } from "./CategoryPage";
import { useRouter } from "next/navigation";

interface BookDetailPageProps {
  book: BookItem;
  type: "ebook" | "licensed";
}

// Define button styles based on platform name
const getPurchaseLinkStyle = (storeName: string) => {
  if (!storeName) {
    return "btn-outline"; // Default style for undefined/null names
  }

  const name = storeName.toLowerCase();

  if (name.includes("shopee")) {
    return "bg-[#EE4D2D] text-black"; // Shopee - nền cam, chữ đen
  } else if (name.includes("tiktok")) {
    return "bg-black text-white"; // Tiktok - nền đen, chữ trắng
  } else if (name.includes("tiki")) {
    return "bg-[#1A94FF] text-white"; // Tiki - nền xanh Tiki, chữ trắng
  } else if (name.includes("pdf")) {
    return "bg-[#F40F02] text-white"; // PDF - nền đỏ, chữ trắng
  } else if (name.includes("epub")) {
    return "bg-[#75B798] text-black"; // EPUB - nền xanh lá, chữ đen
  }

  // Các loại khác sử dụng theme của daisyUI
  return "btn-outline";
};

const BookDetailPage: React.FC<BookDetailPageProps> = ({ book, type }) => {
  const router = useRouter();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [relatedBooks, setRelatedBooks] = useState<BookItem[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(true);

  // Use useMemo to avoid recreating genres on every render
  const genres = useMemo(() => {
    return Array.isArray(book.genres)
      ? book.genres
      : typeof book.genres === "string"
      ? book.genres.split(",").map((g: string) => g.trim())
      : [];
  }, [book.genres]);

  // Process purchase links to handle both name and store properties
  const purchaseLinks = Array.isArray(book.purchaseLinks)
    ? book.purchaseLinks
    : [];

  // Fetch related books based on genres
  useEffect(() => {
    const fetchRelatedBooks = async () => {
      if (!genres.length) {
        setIsLoadingRelated(false);
        return;
      }

      try {
        setIsLoadingRelated(true);
        // Lấy random 1 genre để tìm sách tương tự
        const randomGenre = genres[Math.floor(Math.random() * genres.length)];

        // API endpoint khác nhau cho ebook và truyện xuất bản
        const endpoint =
          type === "ebook"
            ? `/api/ebooks?tag=${encodeURIComponent(randomGenre)}&limit=6`
            : `/api/licensed-stories?tag=${encodeURIComponent(
                randomGenre
              )}&limit=6`;

        const response = await fetch(endpoint);

        if (!response.ok) {
          throw new Error("Failed to fetch related books");
        }

        const data = await response.json();

        // Lọc ra những sách không trùng với sách hiện tại
        const filteredBooks = data.stories
          ? data.stories.filter(
              (relatedBook: BookItem) => relatedBook.id !== book.id
            )
          : [];

        setRelatedBooks(filteredBooks);
      } catch (error) {
        console.error("Error fetching related books:", error);
      } finally {
        setIsLoadingRelated(false);
      }
    };

    fetchRelatedBooks();
  }, [book.id, genres, type]);

  // Handle ebook download link click
  const handleEbookLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Only intercept for ebook type
    if (type === "ebook") {
      e.preventDefault();

      // Redirect to the waiting page
      router.push(`/ebook/${book.slug}/download`);
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 mb-6">
        <h1 className="text-2xl font-bold">
          {/* Chi tiết {type === "ebook" ? "Ebook" : "Truyện Xuất Bản"} */}
          Chi tiết {book.title}
        </h1>
        <div className="breadcrumbs text-sm">
          <ul>
            <li>
              <Link href="/">Trang chủ</Link>
            </li>
            <li>
              <Link href={`/${type === "ebook" ? "ebook" : "xuat-ban"}`}>
                {type === "ebook" ? "Ebook" : "Truyện Xuất Bản"}
              </Link>
            </li>
            <li>{book.title}</li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-1">
          <div className="card bg-base-100 shadow-lg">
            <figure className="px-6 pt-6">
              <div className="mx-auto">
                <div
                  className="book-cover relative w-full aspect-[3/4] h-[280px] 
                  bg-white
                  border-4 border-base-200
                  shadow-[0_0_15px_rgba(0,0,0,0.2)]
                  rounded-md overflow-hidden"
                >
                  {/* Inner frame/mat */}
                  <div className="absolute inset-[4px] border border-gray-300 rounded-sm z-10"></div>

                  <Image
                    src={book.coverImage || "/images/placeholder.jpg"}
                    alt={book.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 280px"
                  />

                  {/* Subtle overlay for better visual appearance */}
                  <div className="absolute inset-0 shadow-inner"></div>
                </div>
              </div>
            </figure>
            <div className="card-body">
              <h2 className="card-title">{book.title}</h2>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-base-content/70">Tác giả:</span>
                  <span className="font-medium">
                    {book.author || "Không có"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-content/70">Trạng thái:</span>
                  <span
                    className={`badge ${
                      book.status === "completed"
                        ? "badge-success"
                        : "badge-primary"
                    }`}
                  >
                    {book.status === "completed"
                      ? "Hoàn thành"
                      : "Đang cập nhật"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-base-content/70 mb-1">Thể loại:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {genres.length > 0 ? (
                      genres.map((genre: string) => (
                        <Link
                          key={genre}
                          href={`/${
                            type === "ebook" ? "ebook" : "xuat-ban"
                          }?tag=${encodeURIComponent(genre)}`}
                          className="badge badge-outline hover:badge-primary transition-colors"
                        >
                          {genre}
                        </Link>
                      ))
                    ) : (
                      <span className="text-base-content/50">
                        Chưa phân loại
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-content/70">Loại:</span>
                  <span className="badge badge-primary">
                    {type === "ebook" ? "Ebook" : "Xuất Bản"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="card bg-base-100 shadow-lg mb-6">
            <div className="card-body">
              <h2 className="card-title mb-2">Giới thiệu</h2>
              <div>
                <p
                  className={`whitespace-pre-line ${
                    !showFullDescription ? "line-clamp-3" : ""
                  }`}
                >
                  {book.description || "Không có giới thiệu."}
                </p>
                {book.description &&
                  (book.description.length > 150 ||
                    book.description.split("\n").length > 3) && (
                    <button
                      onClick={() =>
                        setShowFullDescription(!showFullDescription)
                      }
                      className="text-primary text-sm mt-1 hover:underline"
                    >
                      {showFullDescription ? "Ẩn bớt" : "Xem thêm"}
                    </button>
                  )}
              </div>
            </div>
          </div>
          {/* Purchase Links (thay thế các nút đọc từ đầu/đọc mới nhất) */}
          {purchaseLinks.length > 0 && (
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {purchaseLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`btn ${getPurchaseLinkStyle(
                      link.store || link.name || ""
                    )} flex-1 lg:flex-none`}
                    onClick={(e) =>
                      type === "ebook" ? handleEbookLinkClick(e) : null
                    }
                  >
                    <span className="text-xs sm:text-sm">
                      {link.store || link.name}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Có thể bạn quan tâm */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h2 className="text-xl font-bold mb-4">Có thể bạn quan tâm</h2>

          {isLoadingRelated ? (
            <div className="flex justify-center py-4">
              <div className="loading loading-spinner loading-md text-primary"></div>
            </div>
          ) : relatedBooks.length === 0 ? (
            <p className="opacity-70">Không tìm thấy sách tương tự.</p>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {relatedBooks.map((relatedBook) => (
                <Link
                  key={relatedBook.id}
                  href={`/${type === "ebook" ? "ebook" : "xuat-ban"}/${
                    relatedBook.slug
                  }`}
                  className="card bg-base-200 hover:bg-base-300 transition-colors h-full"
                >
                  <figure className="px-2 pt-2">
                    <div className="relative w-full aspect-[3/4] rounded-md overflow-hidden border border-base-300">
                      <Image
                        src={
                          relatedBook.coverImage || "/images/placeholder.jpg"
                        }
                        alt={relatedBook.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 33vw, 16vw"
                      />
                    </div>
                  </figure>
                  <div className="card-body p-2">
                    <h3 className="text-xs font-medium line-clamp-2">
                      {relatedBook.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookDetailPage;
