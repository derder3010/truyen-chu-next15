import React from "react";
import ChevronLeftIcon from "./icons/ChevronLeftIcon";
import ChevronRightIcon from "./icons/ChevronRightIcon";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
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

  return (
    <div className="flex justify-center my-8">
      <div className="join">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="join-item btn btn-sm"
          aria-label="Trang trước"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>

        {startPage > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="join-item btn btn-sm"
            >
              1
            </button>
            {startPage > 2 && (
              <span className="join-item btn btn-sm btn-disabled">...</span>
            )}
          </>
        )}

        {pageNumbers.map((number) => (
          <button
            key={number}
            onClick={() => onPageChange(number)}
            className={`join-item btn btn-sm ${
              currentPage === number ? "btn-active" : ""
            }`}
            aria-current={currentPage === number ? "page" : undefined}
          >
            {number}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <span className="join-item btn btn-sm btn-disabled">...</span>
            )}
            <button
              onClick={() => onPageChange(totalPages)}
              className="join-item btn btn-sm"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="join-item btn btn-sm"
          aria-label="Trang sau"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
