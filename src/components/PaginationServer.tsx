import React from "react";
import Link from "next/link";
import ChevronLeftIcon from "./icons/ChevronLeftIcon";
import ChevronRightIcon from "./icons/ChevronRightIcon";

interface PaginationServerProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

const PaginationServer: React.FC<PaginationServerProps> = ({
  currentPage,
  totalPages,
  basePath,
}) => {
  if (totalPages <= 1) return null;

  const pageNumbers = [];
  const maxPagesToShow = 5; // Show 2 before, current, 2 after. Or less if at edges.

  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  // Helper function to create URL for a specific page
  const getPageUrl = (page: number) => {
    return page === 1 ? basePath : `${basePath}?page=${page}`;
  };

  return (
    <div className="flex justify-center my-8">
      <div className="join">
        <Link
          href={currentPage > 1 ? getPageUrl(currentPage - 1) : "#"}
          className={`join-item btn btn-sm ${
            currentPage === 1 ? "btn-disabled" : ""
          }`}
          aria-label="Trang trước"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </Link>

        {startPage > 1 && (
          <>
            <Link href={getPageUrl(1)} className="join-item btn btn-sm">
              1
            </Link>
            {startPage > 2 && (
              <span className="join-item btn btn-sm btn-disabled">...</span>
            )}
          </>
        )}

        {pageNumbers.map((number) => (
          <Link
            key={number}
            href={getPageUrl(number)}
            className={`join-item btn btn-sm ${
              currentPage === number ? "btn-active" : ""
            }`}
            aria-current={currentPage === number ? "page" : undefined}
          >
            {number}
          </Link>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <span className="join-item btn btn-sm btn-disabled">...</span>
            )}
            <Link
              href={getPageUrl(totalPages)}
              className="join-item btn btn-sm"
            >
              {totalPages}
            </Link>
          </>
        )}

        <Link
          href={currentPage < totalPages ? getPageUrl(currentPage + 1) : "#"}
          className={`join-item btn btn-sm ${
            currentPage === totalPages ? "btn-disabled" : ""
          }`}
          aria-label="Trang sau"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
};

export default PaginationServer;
