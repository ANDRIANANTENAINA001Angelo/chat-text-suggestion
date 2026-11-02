"use client";

import { useState, type ReactNode } from "react";

export type TabDef = {
  id: string;
  label: string;
  icon: ReactNode;
  content: ReactNode;
};

export function Tabs({ tabs }: { tabs: TabDef[] }) {
  const [active, setActive] = useState(tabs[0]?.id);

  return (
    <div className="flex flex-col gap-5">
      <div
        role="tablist"
        aria-label="Sections"
        className="flex gap-1 rounded-xl bg-surface-muted p-1"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(tab.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-surface text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {tabs.find((tab) => tab.id === active)?.content}
    </div>
  );
}
