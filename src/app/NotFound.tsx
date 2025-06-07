import React from "react";
import Link from "next/link";
import BookOpenIcon from "@/components/icons/BookOpenIcon";

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 md:py-20">
      <BookOpenIcon className="w-24 h-24 text-primary-light dark:text-secondary-light mb-6 opacity-50" />
      <h1 className="text-5xl md:text-6xl font-bold text-gray-800 dark:text-gray-100 mb-4">
        404
      </h1>
      <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-8">
        Trang bạn tìm kiếm không tồn tại.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-primary-DEFAULT text-white rounded-md hover:bg-primary-dark dark:bg-secondary-DEFAULT dark:text-gray-900 dark:hover:bg-secondary-dark transition-colors text-lg font-medium"
      >
        Về Trang Chủ
      </Link>
    </div>
  );
};

export default NotFoundPage;
