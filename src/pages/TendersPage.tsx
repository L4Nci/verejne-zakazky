// src/pages/TendersPage.tsx
import React, { useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ExternalLink, Globe, Info, Loader2, LoaderCircle, MapPin, Timer } from "lucide-react";
import { Drawer } from "vaul";

import type { Tender } from "@/types/tender";
import { useInfiniteTenders, type TenderFilters, type TenderSort } from "@/hooks/useTenders";
import { useFilterStore, type Filters } from "@/lib/store";
import { cn, formatCZK, parseDeadline } from "@/lib/utils";

export default function TendersPage() {
  // Obal a hlavička (vlastní výpis je v <TendersPage.List />)
  return (
    <div className="px-4 sm:px-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Veřejné zakázky</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Levý panel – můžeš sem dát statické UI nebo něco jiného */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <TendersPage.TenderFiltersComponentInline />
          </div>
        </div>

        <div className="lg:col-span-3">
          <TendersPage.List />
        </div>
      </div>
    </div>
  );
}

/**
 * Namespace s podsložkami používanými v App.tsx: SearchBox, FiltersButton, List
 */
namespace TendersPage {
  // --- UI pomocníci ---
  export function Badge(props: { children: React.ReactNode; className?: string }) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-md border px-2 py-0.5 text-xs",
          "border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200",
          props.className
        )}
      >
        {props.children}
      </span>
    );
  }

  export function Card(props: { children: React.ReactNode; className?: string }) {
    return <div className={cn("rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4", props.className)}>{props.children}</div>;
  }

  export function Skeleton({ className }: { className?: string }) {
    return <div className={cn("animate-pulse rounded-md bg-slate-200/70 dark:bg-slate-800", className)} />;
  }

  export function SkeletonCard() {
    return (
      <Card>
        <Skeleton className="h-5 w-2/3 mb-3" />
        <Skeleton className="h-4 w-1/3 mb-2" />
        <div className="flex gap-2 mb-3">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      </Card>
    );
  }

  // --- Vyhledávání nahoře (App.tsx -> <TendersPage.SearchBox />) ---
  export function SearchBox() {
    const { q, set, syncToUrl } = useFilterStore();
    const onSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      syncToUrl();
    };
    return (
      <form onSubmit={onSubmit} className="flex-1">
        <div className="flex rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
          <input
            className="flex-1 px-3 py-2 text-sm bg-transparent outline-none"
            placeholder="Hledat podle názvu zakázky nebo zadavatele…"
            value={q}
            onChange={(e) => set({ q: e.target.value })}
          />
          <button className="px-4 py-2 text-sm font-medium bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">Hledat</button>
        </div>
      </form>
    );
  }

  // --- Tlačítko pro otevření filtrů (App.tsx -> <TendersPage.FiltersButton />) ---
  export function FiltersButton(props: { children: React.ReactNode }) {
    const { openSheet } = useFilterStore();
    return (
      <button
        type="button"
        onClick={() => openSheet(true)}
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
      >
        {props.children}
      </button>
    );
  }

  // --- Levý inline panel (placeholder) ---
  export function TenderFiltersComponentInline() {
    return (
      <Card>
        <div className="text-sm text-slate-600 dark:text-slate-400 mb-3">Filtry</div>
        <div className="text-xs text-slate-500">Použij tlačítko „Filtry“ nahoře v Listu.</div>
      </Card>
    );
  }

  // --- Karta položky v seznamu (s fallbacky na top-level) ---
  export function ItemCard({ t, onOpenDetail }: { t: Tender; onOpenDetail: () => void }) {
    const status   = (t as any).status ?? (t as any).detail?.status;
    const region   = (t as any).region ?? (t as any).detail?.region;
    const cpvArr   = ((t as any).cpv ?? (t as any).detail?.cpv ?? []) as string[];
    const budget   = (t as any).budget_value ?? (t as any).detail?.budget_value ?? null;
    const deadline = (t as any).deadline ?? (t as any).detail?.deadline ?? null;

    return (
      <Card>
        <h3 className="font-semibold text-lg leading-tight mb-1">{t.title}</h3>
        <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">{t.buyer}</div>

        <div className="flex flex-wrap gap-2 mb-3">
          {status && (
            <Badge>
              <Info className="h-3 w-3 mr-1" /> {status}
            </Badge>
          )}
          {region && (
            <Badge>
              <MapPin className="h-3 w-3 mr-1" /> {region}
            </Badge>
          )}
          {(t as any).country && (
            <Badge>
              <Globe className="h-3 w-3 mr-1" /> {(t as any).country}
            </Badge>
          )}
        </div>

        <div className="text-sm grid grid-cols-2 gap-2 mb-3">
          <div>CPV: {cpvArr.slice(0, 3).join(", ") || "—"}</div>
          <div>Rozpočet: {formatCZK(budget)}</div>
          <div className="col-span-2 flex items-center">
            <Timer className="h-4 w-4 mr-1" /> Deadline: {deadline || "—"}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onOpenDetail}
            className="inline-flex items-center justify-center rounded-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-3 py-2 text-sm"
          >
            Otevřít detail
          </button>
          {(t as any).notice_url && (
            <a
              href={(t as any).notice_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-md border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <ExternalLink className="h-4 w-4 mr-2" /> Zdroj
            </a>
          )}
        </div>
      </Card>
    );
  }

  // --- Hlavní seznam (App.tsx -> <TendersPage.List />) ---
  export function List() {
    const location = useLocation();
    const navigate = useNavigate();

    // reaktivní hodnoty store
    const {
      q,
      statuses, regions, cpv, budgetMin, budgetMax, deadlineFrom, deadlineTo,
      sort, set, syncFromUrl, syncToUrl, sheetOpen, openSheet
    } = useFilterStore();

    // načtení z URL jen 1×
    useEffect(() => {
      syncFromUrl(location.search);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // sync URL při změně hodnot
    useEffect(() => {
      syncToUrl();
    }, [q, sort, statuses, regions, cpv, budgetMin, budgetMax, deadlineFrom, deadlineTo, syncToUrl]);

    // mapování UI sort -> server sort
    const serverSort: TenderSort =
      sort === "deadlineAsc"   ? { field: "deadline",      direction: "asc"  } :
      sort === "deadlineDesc"  ? { field: "deadline",      direction: "desc" } :
      sort === "budgetAsc"     ? { field: "budget_value",  direction: "asc"  } :
      sort === "budgetDesc"    ? { field: "budget_value",  direction: "desc" } :
                                 { field: "created_at",    direction: "desc" }; // newest

    // filtry pro server
    const serverFilters: TenderFilters = {
      q,
      statuses, regions, cpv,
      budgetMin, budgetMax,
      deadlineFrom, deadlineTo,
    };

    // server-side dotaz + stránkování
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
      useInfiniteTenders(serverFilters, serverSort);

    const allItems = useMemo(() => (data?.pages || []).flatMap((p) => p.data), [data?.pages]);
    const total = data?.pages?.[0]?.count ?? 0;

    // ⚠️ Když řadíme podle rozpočtu, vyřadíme záznamy s NULL rozpočtem (nechceme je v tomto režimu)
    const itemsToRender = useMemo(() => {
      if (sort === "budgetAsc" || sort === "budgetDesc") {
        return allItems.filter((t) => {
          const budget = (t as any).budget_value ?? (t as any).detail?.budget_value ?? null;
          return budget != null && !isNaN(budget);
        });
      }
      return allItems;
    }, [allItems, sort]);

    const sentinelRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
      if (!sentinelRef.current) return;
      const el = sentinelRef.current;
      const io = new IntersectionObserver(
        (e) => {
          if (e[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
        },
        { rootMargin: "800px 0px" }
      );
      io.observe(el);
      return () => io.disconnect();
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    return (
      <>
        <div className="flex items-center gap-2 mb-4">
          <select
            value={sort as any}
            onChange={(e) => set({ sort: e.target.value as any })}
            className="h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-2 text-sm"
          >
            <option value="newest">Nejnovější</option>
            <option value="deadlineAsc">Nejdřívější deadline</option>
            <option value="deadlineDesc">Nejpozdější deadline</option>
            <option value="budgetAsc">Nejnižší rozpočet</option>
            <option value="budgetDesc">Nejvyšší rozpočet</option>
          </select>

          <div className="text-sm text-slate-500">
            {status === "pending" && "Načítám…"}
            {status === "success" && `${total.toLocaleString("cs-CZ")} záznamů`}
          </div>

          <div className="flex-1" />

          <button
            onClick={() => openSheet(true)}
            className="inline-flex items-center justify-center rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Filtry
          </button>
        </div>

        {/* Výpis karet */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {status === "pending" && Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
          {itemsToRender.map((t) => (
            <ItemCard
              key={t.external_id}
              t={t}
              onOpenDetail={() => {
                const id = encodeURIComponent(t.external_id); // kvůli lomítkům v ID
                navigate(`/t/${id}${location.search}`);
              }}
            />
          ))}
        </div>

        <div ref={sentinelRef} className="h-10" />
        {isFetchingNextPage && (
          <div className="flex justify-center py-6 text-slate-500">
            <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Načítání…
          </div>
        )}

        {/* Levý šuplík s filtry */}
        <FiltersSheet />
      </>
    );
  }

  // --- Šuplík filtrů (vaul) ---
  function FiltersSheet() {
    const { sheetOpen, openSheet, statuses, regions, cpv, budgetMin, budgetMax, deadlineFrom, deadlineTo, set, syncToUrl } = useFilterStore();

    const onApply = () => {
      syncToUrl();
      openSheet(false);
    };

    return (
      <Drawer.Root open={sheetOpen} onOpenChange={(o) => openSheet(o)} direction="left">
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Drawer.Content className="fixed z-50 top-0 left-0 h-full w-[92%] sm:w-[420px] bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 p-4 overflow-auto">
          <div className="max-w-full space-y-4">
            <h2 className="text-lg font-semibold">Filtry</h2>

            <div className="grid gap-2">
              <label className="text-sm">Status (čárkou oddělené)</label>
              <input
                className="h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-2 text-sm"
                value={statuses.join(",")}
                onChange={(e) =>
                  set({
                    statuses: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map((s) => s.toLowerCase()),
                  })
                }
                placeholder="Neukončen,Zadán,Zrušen…"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm">Region (čárkou oddělené)</label>
              <input
                className="h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-2 text-sm"
                value={regions.join(",")}
                onChange={(e) =>
                  set({
                    regions: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map((s) => s.toLowerCase()),
                  })
                }
                placeholder="Praha, Jihomoravský kraj…"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm">CPV (prefixy, čárkou oddělené)</label>
              <input
                className="h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-2 text-sm"
                value={cpv.join(",")}
                onChange={(e) =>
                  set({
                    cpv: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="4523, 3021…"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <label className="text-sm">Rozpočet min (CZK)</label>
                <input
                  type="number"
                  className="h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-2 text-sm"
                  value={budgetMin ?? ""}
                  onChange={(e) => set({ budgetMin: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm">Rozpočet max (CZK)</label>
                <input
                  type="number"
                  className="h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-2 text-sm"
                  value={budgetMax ?? ""}
                  onChange={(e) => set({ budgetMax: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <label className="text-sm">Deadline od</label>
                <input
                  type="date"
                  className="h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-2 text-sm"
                  value={deadlineFrom ?? ""}
                  onChange={(e) => set({ deadlineFrom: e.target.value || undefined })}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm">Deadline do</label>
                <input
                  type="date"
                  className="h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-2 text-sm"
                  value={deadlineTo ?? ""}
                  onChange={(e) => set({ deadlineTo: e.target.value || undefined })}
                />
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                className="inline-flex items-center justify-center rounded-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-3 py-2 text-sm"
                onClick={onApply}
              >
                Aplikovat
              </button>
              <button
                className="inline-flex items-center justify-center rounded-md border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                onClick={() => useFilterStore.getState().reset()}
              >
                Vymazat vše
              </button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Root>
    );
  }
}
