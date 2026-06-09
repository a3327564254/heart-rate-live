"use client";

import { Sun, Moon } from "@phosphor-icons/react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="p-1.5 rounded-md bg-zinc-200/50 dark:bg-zinc-800/50
                 text-zinc-600 dark:text-zinc-400
                 active:scale-95 transition-all duration-100"
      aria-label={theme === "dark" ? "切换到浅色模式" : "切换到深色模式"}
    >
      {theme === "dark" ? (
        <Sun size={14} weight="bold" />
      ) : (
        <Moon size={14} weight="bold" />
      )}
    </button>
  );
}
