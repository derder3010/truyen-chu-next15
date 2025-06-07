"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import SunIcon from "./icons/SunIcon";
import MoonIcon from "./icons/MoonIcon";

const DarkModeToggle: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Render nothing until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <button
        className="btn btn-ghost btn-circle"
        aria-label="Loading theme toggle"
      >
        <div className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "halloween" ? "retro" : "halloween")}
      className="btn btn-ghost btn-circle"
      aria-label={
        theme === "halloween" ? "Switch to light mode" : "Switch to dark mode"
      }
    >
      {theme === "halloween" ? (
        <SunIcon className="w-5 h-5" />
      ) : (
        <MoonIcon className="w-5 h-5" />
      )}
    </button>
  );
};

export default DarkModeToggle;
