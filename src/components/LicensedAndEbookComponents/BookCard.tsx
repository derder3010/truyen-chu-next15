import Link from "next/link";
import Image from "next/image";
import { BookItem } from "./CategoryPage";

interface BookCardProps {
  book: BookItem;
  type: "ebook" | "licensed"; // Loại sách (ebook hoặc truyện bản quyền)
}

const BookCard: React.FC<BookCardProps> = ({ book, type }) => {
  // Xác định đường dẫn chi tiết dựa trên loại sách
  const detailPath =
    type === "ebook" ? `/ebook/${book.slug}` : `/xuat-ban/${book.slug}`;

  // Đảm bảo genres luôn là mảng
  const genres: string[] = Array.isArray(book.genres)
    ? book.genres
    : typeof book.genres === "string"
    ? book.genres.split(",").map((g: string) => g.trim())
    : [];

  return (
    <div className="card card-compact bg-base-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden rounded-xl">
      <Link href={detailPath} className="group">
        <figure className="relative h-48 sm:h-56 md:h-64 w-full overflow-hidden rounded-t-xl">
          <Image
            src={book.coverImage || "/images/placeholder.jpg"}
            alt={book.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Tag Xuất Bản hoặc Ebook */}
          <div className="badge badge-primary badge-sm absolute top-2 right-2">
            {type === "ebook" ? "Ebook" : "Xuất Bản"}
          </div>
        </figure>

        <div className="card-body p-3 pt-2 rounded-b-xl">
          <h3 className="card-title text-base line-clamp-1 group-hover:text-primary group-hover:underline">
            {book.title}
          </h3>
          <p className="text-xs opacity-70">{book.author}</p>
        </div>
      </Link>
    </div>
  );
};

export default BookCard;
