"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS, APP_CONFIG } from "@/lib/config";
import DarkModeToggle from "./DarkModeToggle";
import SearchInput from "./SearchInput";
import MenuIcon from "./icons/MenuIcon";
import XIcon from "./icons/XIcon";
import BookOpenIcon from "./icons/BookOpenIcon";

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/" && pathname !== "/") {
      return false;
    }
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <nav className="border-b border-base-300">
      <div className="navbar bg-base-100 shadow-sm">
        <div className="navbar-start">
          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="btn btn-ghost btn-circle"
            >
              {isMobileMenuOpen ? (
                <XIcon className="h-5 w-5" />
              ) : (
                <MenuIcon className="h-5 w-5" />
              )}
            </button>
          </div>

          <Link href="/" className="btn btn-ghost normal-case text-xl">
            <BookOpenIcon className="text-primary p-0 m-0" />
            {APP_CONFIG.APP_NAME}
          </Link>
        </div>

        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.path}
                  className={
                    isActive(link.path)
                      ? "active font-bold link "
                      : "font-medium link link-hover hover:font-bold"
                  }
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="navbar-end">
          <div className="hidden sm:block mr-2">
            <SearchInput size="sm" className="w-64" />
          </div>
          <DarkModeToggle />
        </div>
      </div>

      {/* Mobile Menu - Separate from dropdown for better control */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-base-100 border-t border-base-300">
          <ul className="menu menu-sm p-4">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.path}
                  className={isActive(link.path) ? "active" : ""}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="px-4 py-3 border-t border-base-300">
            <SearchInput
              size="sm"
              placeholder="Tìm truyện..."
              onSearch={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
