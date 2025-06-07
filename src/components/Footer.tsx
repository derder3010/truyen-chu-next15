import React from "react";
import Link from "next/link";
import { NAV_LINKS } from "@/lib/constants";
import BookOpenIcon from "./icons/BookOpenIcon";

const Footer: React.FC = () => {
  return (
    <footer className="footer footer-center p-8 bg-base-200 text-base-content border-t border-base-300">
      <div>
        <div className="flex items-center justify-center">
          <BookOpenIcon className="h-6 w-6 text-primary mr-2" />
          <p className="font-bold text-lg">TruyệnCV</p>
        </div>
        <p className="text-sm">Đọc truyện chữ online</p>
        <div className="divider max-w-xs mx-auto my-2"></div>
        <nav className="grid grid-flow-col gap-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.path}
              className="link link-hover text-sm"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="divider max-w-xs mx-auto my-2"></div>
        <p>&copy; {new Date().getFullYear()} TruyệnCV</p>
        <div className="text-xs opacity-75 mt-2">
          <p>Website này được tạo cho mục đích minh họa.</p>
          <p>Tất cả truyện và nội dung đều là giả tưởng.</p>
          <p className="mt-1">Lấy cảm hứng từ mottruyen.com.vn.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
