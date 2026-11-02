import { ImportPanel } from "./components/ImportPanel";
import { SuggestPanel } from "./components/SuggestPanel";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-2xl flex-col gap-8 px-6 py-12">
        <header>
          <h1 className="text-2xl font-semibold">
            Suggestion de phrases — chat
          </h1>
          <p className="text-sm text-zinc-500">
            Enrichis la base de phrases, puis demande une suggestion adaptée
            au contexte, sans redondance avec ce qui a déjà été envoyé.
          </p>
        </header>
        <SuggestPanel />
        <ImportPanel />
      </main>
    </div>
  );
}
