"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  // Starts null (same on server and first client render) and is corrected
  // right after mount, since the real value depends on `document`, which
  // ThemeScript already set before hydration but React can't see yet.
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    // One-time hydration->client sync for a browser-only value (dark class).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // ignore (e.g. private browsing)
    }
    setIsDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Changer de thème"
      title={isDark ? "Passer en clair" : "Passer en sombre"}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:bg-surface-muted"
    >
      {isDark === null ? (
        <span className="h-[18px] w-[18px]" />
      ) : isDark ? (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-[18px] w-[18px]"
        >
          <circle cx="12" cy="12" r="4.2" />
          <path
            strokeLinecap="round"
            d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6"
          />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-[18px] w-[18px]"
        >
          <path d="M20.7 14.3A8.5 8.5 0 0 1 9.7 3.3a.6.6 0 0 0-.7-.9A9.5 9.5 0 1 0 21.6 15a.6.6 0 0 0-.9-.7Z" />
        </svg>
      )}
    </button>
  );
}
