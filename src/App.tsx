import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Moon, Sun, SlidersHorizontal } from "lucide-react";
import TendersPage from "@/pages/TendersPage";
import { useEffect } from "react";
import { useThemeStore } from "@/lib/store";
import TenderDetailPage from "@/pages/TenderDetailPage";


export default function App() {
  const { theme, toggleTheme, applyThemeClass } = useThemeStore();
  const loc = useLocation();

  useEffect(() => {
    applyThemeClass();
  }, [theme, applyThemeClass]);

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto flex items-center gap-2 py-3 px-4">
          <Link to="/tenders" className="font-semibold tracking-tight">
            Veřejné zakázky
          </Link>
          <span className="ml-1 text-xs text-slate-500">V1</span>
          <div className="ml-auto flex items-center gap-2">
            <Link
              to={{ pathname: "/tenders", search: loc.search }}
              className="hidden md:inline-flex text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              Seznam
            </Link>
            <button
              aria-label="Přepnout režim"
              className="inline-flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-800 p-2 hover:bg-slate-50 dark:hover:bg-slate-900"
              onClick={toggleTheme}
              title="Přepnout světlý/tmavý režim"
            >
              <Sun className="h-4 w-4 dark:hidden" />
              <Moon className="h-4 w-4 hidden dark:inline-block" />
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-slate-200 dark:border-slate-800 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-950">
          <div className="container mx-auto py-8 md:py-12 px-4">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
              Najděte veřejné zakázky
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Hledejte podle názvu nebo zadavatele. Použijte rozšířené filtrování
              pro upřesnění.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <TendersPage.SearchBox />
              <TendersPage.FiltersButton>
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Rozšířené filtrování
              </TendersPage.FiltersButton>
            </div>
          </div>
        </section>

        <div className="container mx-auto py-6 md:py-8 px-4">
          <Routes>
            <Route path="/" element={<Navigate to="/tenders" replace />} />
            <Route path="/tenders" element={<TendersPage.List />} />
            <Route path="/t/:external_id" element={<TenderDetailPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
