"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { NAV_LINKS } from "@/lib/constants";
import DarkModeToggle from "./DarkModeToggle";
import SearchIcon from "./icons/SearchIcon";
import MenuIcon from "./icons/MenuIcon";
import XIcon from "./icons/XIcon";
import BookOpenIcon from "./icons/BookOpenIcon";

const Navbar: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/tim-kiem?q=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm("");
      setIsMobileMenuOpen(false);
    }
  };

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
            <BookOpenIcon className="h-6 w-6 text-primary mr-2" />
            TruyệnCV
          </Link>
        </div>

        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.path}
                  className={isActive(link.path) ? "active font-medium" : ""}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="navbar-end">
          <form
            onSubmit={handleSearch}
            className="hidden sm:flex items-center mr-2"
          >
            <div className="join">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm truyện..."
                className="input input-bordered input-sm join-item w-64"
              />
              <button
                type="submit"
                className="btn btn-primary btn-sm join-item"
              >
                <SearchIcon className="h-4 w-4" />
              </button>
            </div>
          </form>
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
            <form onSubmit={handleSearch} className="flex items-center">
              <div className="join w-full">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm truyện..."
                  className="input input-bordered input-sm join-item w-full"
                />
                <button
                  type="submit"
                  className="btn btn-primary btn-sm join-item"
                >
                  <SearchIcon className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
