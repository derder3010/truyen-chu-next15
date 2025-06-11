import React from "react";
import { APP_CONFIG } from "@/lib/config";
import BookOpenIcon from "./icons/BookOpenIcon";

const Footer: React.FC = () => {
  return (
    <footer className="footer footer-center p-8 bg-base-200 text-base-content border-t border-base-300">
      <div>
        <div className="flex items-center justify-center">
          <BookOpenIcon className="h-6 w-6 text-primary mr-2" />
          <p className="font-bold text-lg">{APP_CONFIG.APP_NAME}</p>
        </div>
        <p className="text-sm">Đọc truyện chữ online</p>
        <p className="text-sm">Liên hệ email: contact@stationd.blog</p>
      </div>
    </footer>
  );
};

export default Footer;
