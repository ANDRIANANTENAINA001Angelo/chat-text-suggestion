import { SuggestPanel } from "./components/SuggestPanel";
import { ImportPanel } from "./components/ImportPanel";
import { RulesPanel } from "./components/RulesPanel";
import { LibraryPanel } from "./components/LibraryPanel";
import { ThemeToggle } from "./components/ThemeToggle";
import { Tabs } from "./components/Tabs";

const icon = {
  suggest: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2m9-9h-2M5 12H3m14.5-6.5-1.4 1.4M7.4 16.6 6 18M18.6 18l-1.4-1.4M6 6l1.4 1.4" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  ),
  import: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v11m0 0 4-4m-4 4-4-4M5 19h14" />
    </svg>
  ),
  rules: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
    </svg>
  ),
  library: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5.5A2.5 2.5 0 0 1 6.5 3H18a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6.5A2.5 2.5 0 0 1 4 17.5v-12Z" />
      <path strokeLinecap="round" d="M8 3v17" />
    </svg>
  ),
};

export default function Home() {
  return (
    <div className="flex flex-1 justify-center bg-background">
      <main className="flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Suggestion de phrases — chat
            </h1>
            <p className="text-sm text-muted-foreground">
              Une suggestion adaptée au contexte, sans redondance avec ce qui
              a déjà été envoyé.
            </p>
          </div>
          <ThemeToggle />
        </header>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-6">
          <Tabs
            tabs={[
              {
                id: "suggest",
                label: "Suggestion",
                icon: icon.suggest,
                content: <SuggestPanel />,
              },
              {
                id: "import",
                label: "Enrichir",
                icon: icon.import,
                content: <ImportPanel />,
              },
              {
                id: "rules",
                label: "Règles",
                icon: icon.rules,
                content: <RulesPanel />,
              },
              {
                id: "library",
                label: "Bibliothèque",
                icon: icon.library,
                content: <LibraryPanel />,
              },
            ]}
          />
        </div>
      </main>
    </div>
  );
}
