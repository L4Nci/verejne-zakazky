import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ExternalLink, FileText, Globe, Info, Loader2, LoaderCircle, MapPin, Timer } from "lucide-react";
import { Drawer } from "vaul";

import { TenderFilters, TenderSort } from "@/types/tender";
import { useInfiniteTenders, useTenderDetail, type Tender } from "@/hooks/useTenders";
import { useFilterStore, type Filters } from "@/lib/store";
import { cn, formatCZK, parseDeadline } from "@/lib/utils";

export function TendersPage() {
  const [filters, setFilters] = useState<TenderFilters>({});
  const [sort, setSort] = useState<TenderSort>({ field: "created_at", direction: "desc" });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteTenders(filters, sort);

  const allTenders = data?.pages.flatMap((page) => page.data) ?? [];
  const total = data?.pages[0]?.count ?? 0;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoaderCircle className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        Chyba při načítání zakázek: {(error as any)?.message ?? String(error)}
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Veřejné zakázky</h1>
        <p className="text-gray-600 mt-1">Nalezeno {total.toLocaleString("cs-CZ")} zakázek</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filtry – levý panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <TendersPage.TenderFiltersComponentInline
              filters={filters}
              onFiltersChange={setFilters}
              sort={sort}
              onSortChange={setSort}
            />
          </div>
        </div>

        {/* Seznam zakázek */}
        <div className="lg:col-span-3">
          {allTenders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Nenalezeny žádné zakázky</p>
            </div>
          ) : (
            <div className="space-y-4">
              {allTenders.map((tender) => (
                <TendersPage.ItemCard key={tender.hash_id} t={tender} onOpenDetail={() => {}} />
              ))}

              {hasNextPage && (
                <div className="flex justify-center pt-6">
                  <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isFetchingNextPage && <LoaderCircle className="h-4 w-4 animate-spin" />}
                    <span>Načíst další</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Namespace s podsložkami používanými v App.tsx: SearchBox, FiltersButton, List, atd.
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

  // --- Inline panel filtrů pro levou lištu v této stránce (nepoužívá App.tsx) ---
  export function TenderFiltersComponentInline({
    filters,
    onFiltersChange,
    sort,
    onSortChange,
  }: {
    filters: TenderFilters;
    onFiltersChange: (f: TenderFilters) => void;
    sort: TenderSort;
    onSortChange: (s: TenderSort) => void;
  }) {
    return (
      <Card>
        <div className="text-sm text-slate-600 dark:text-slate-400 mb-3">Filtry</div>
        {/* Zde můžeš doplnit skutečné ovládací prvky pro filters/sort */}
        <div className="text-xs text-slate-500">UI filtrů…</div>
      </Card>
    );
  }

  // --- Client-side filtrování pomocí store Filters ---
  function normalize(s: string) {
    return s.trim().toLowerCase();
  }
  function parseDateParam(s?: string) {
    if (!s) return undefined;
    const [d, m, y] = s.replaceAll(" ", "").split(/[.\-/]/).filter(Boolean).map(Number);
    if (!y) return undefined;
    return new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0);
  }
  function useClientFiltered(items: Tender[], f: Filters) {
    return useMemo(() => {
      let list = items.slice();

      if (f.statuses.length) {
        list = list.filter((t) => t.detail?.status && f.statuses.includes(normalize(t.detail.status)));
      }
      if (f.regions.length) {
        list = list.filter((t) => t.detail?.region && f.regions.includes(normalize(t.detail.region)));
      }
      if (f.cpv.length) {
        list = list.filter((t) => {
          const arr = t.detail?.cpv || [];
          return f.cpv.some((code) => arr.some((c) => c.startsWith(code)));
        });
      }
      if (f.budgetMin != null) {
        list = list.filter((t) => (t.detail?.budget_value ?? -Infinity) >= (f.budgetMin as number));
      }
      if (f.budgetMax != null) {
        list = list.filter((t) => (t.detail?.budget_value ?? Infinity) <= (f.budgetMax as number));
      }
      if (f.deadlineFrom) {
        const from = parseDateParam(f.deadlineFrom);
        if (from)
          list = list.filter((t) => {
            const d = parseDeadline(t.deadline);
            return d ? d >= from : true;
          });
      }
      if (f.deadlineTo) {
        const to = parseDateParam(f.deadlineTo);
        if (to)
          list = list.filter((t) => {
            const d = parseDeadline(t.deadline);
            return d ? d <= to : true;
          });
      }

      if (f.sort === "deadlineAsc" || f.sort === "deadlineDesc") {
        list.sort((a, b) => {
          const da = parseDeadline(a.deadline)?.getTime() ?? Number.POSITIVE_INFINITY;
          const db = parseDeadline(b.deadline)?.getTime() ?? Number.POSITIVE_INFINITY;
          return f.sort === "deadlineAsc" ? da - db : db - da;
        });
      } else if (f.sort === "budgetAsc" || f.sort === "budgetDesc") {
        list.sort((a, b) => {
          const aa = a.detail?.budget_value ?? -1;
          const bb = b.detail?.budget_value ?? -1;
          return f.sort === "budgetAsc" ? aa - bb : bb - aa;
        });
      }

      return list;
    }, [items, f]);
  }

  // --- Karta položky v seznamu (v této stránce) ---
  export function ItemCard({ t, onOpenDetail }: { t: Tender; onOpenDetail: () => void }) {
    return (
      <Card>
        <h3 className="font-semibold text-lg leading-tight mb-1">{t.title}</h3>
        <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">{t.buyer}</div>
        <div className="flex flex-wrap gap-2 mb-3">
          {t.detail?.status && (
            <Badge>
              <Info className="h-3 w-3 mr-1" /> {t.detail.status}
            </Badge>
          )}
          {t.detail?.region && (
            <Badge>
              <MapPin className="h-3 w-3 mr-1" /> {t.detail.region}
            </Badge>
          )}
          {t.country && (
            <Badge>
              <Globe className="h-3 w-3 mr-1" /> {t.country}
            </Badge>
          )}
        </div>
        <div className="text-sm grid grid-cols-2 gap-2 mb-3">
          <div>CPV: {(t.detail?.cpv || []).slice(0, 3).join(", ") || "—"}</div>
          <div>Rozpočet: {formatCZK(t.detail?.budget_value ?? null)}</div>
          <div className="col-span-2 flex items-center">
            <Timer className="h-4 w-4 mr-1" /> Deadline: {t.deadline || "—"}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onOpenDetail}
            className="inline-flex items-center justify-center rounded-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-3 py-2 text-sm"
          >
            Otevřít detail
          </button>
          {t.notice_url && (
            <a
              href={t.notice_url}
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

  // --- Hlavní seznam s nekonečným posunem a šuplíky (App.tsx -> <TendersPage.List />) ---
  export function List() {
    const location = useLocation();
    const navigate = useNavigate();
    const params = useParams<{ external_id: string }>();

    const { q, syncFromUrl, syncToUrl, sheetOpen, openSheet, sort, set } = useFilterStore();

    // načtení z URL jen 1×
    useEffect(() => {
      syncFromUrl(location.search);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // sync URL při změně vyhledávání/řazení
    useEffect(() => {
      syncToUrl();
    }, [q, sort, syncToUrl]);

    // data + nekonečné načítání
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } = useInfiniteTenders(q);
    const allItems = useMemo(() => (data?.pages || []).flat(), [data?.pages]);

    const filtered = useClientFiltered(allItems, useFilterStore.getState());

    const sentinelRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
      if (!sentinelRef.current) return;
      const el = sentinelRef.current;
      const io = new IntersectionObserver(
        (e) => {
          if (e[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        },
        { rootMargin: "800px 0px" }
      );
      io.observe(el);
      return () => io.disconnect();
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    // detail vpravo podle :external_id
    const detailId = params.external_id;
    const detail = useTenderDetail(detailId);

    useEffect(() => {
      openSheet(!!detailId);
    }, [detailId, openSheet]);

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
            {status === "success" && `${filtered.length} záznamů`}
          </div>

          <div className="flex-1" />

          <button
            onClick={() => openSheet(true)}
            className="inline-flex items-center justify-center rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Filtry
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {status === "pending" && Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
          {filtered.map((t) => (
            <ItemCard key={t.external_id} t={t} onOpenDetail={() => navigate(`/t/${t.external_id}${location.search}`)} />
          ))}
        </div>

        <div ref={sentinelRef} className="h-10" />
        {isFetchingNextPage && (
          <div className="flex justify-center py-6 text-slate-500">
            <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Načítání…
          </div>
        )}

        {/* Levý šuplík s filtry */}
        <FiltersSheet
          open={sheetOpen}
          onOpenChange={(o) => {
            useFilterStore.getState().openSheet(o);
            if (!o) useFilterStore.getState().syncToUrl();
          }}
        />

        {/* Pravý šuplík s detailem */}
        <DetailSheet
          open={!!detailId}
          onOpenChange={(o) => {
            if (!o) navigate(`/tenders${location.search}`, { replace: true });
          }}
          t={detail.data}
          isLoading={detail.isLoading}
        />
      </>
    );
  }

  // --- Šuplík filtrů (vaul) ---
  function FiltersSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
    const { statuses, regions, cpv, budgetMin, budgetMax, deadlineFrom, deadlineTo, set } = useFilterStore();

    const onApply = () => {
      useFilterStore.getState().syncToUrl();
      onOpenChange(false);
    };

    return (
      <Drawer.Root open={open} onOpenChange={onOpenChange} direction="left">
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
              <button className="inline-flex items-center justify-center rounded-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-3 py-2 text-sm" onClick={onApply}>
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

  // --- Šuplík detailu (vaul) ---
  function DetailSheet({ open, onOpenChange, t, isLoading }: { open: boolean; onOpenChange: (o: boolean) => void; t?: Tender; isLoading: boolean }) {
    return (
      <Drawer.Root open={open} onOpenChange={onOpenChange} direction="right">
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Drawer.Content className="fixed z-50 top-0 right-0 h-full w-[96%] md:w-[720px] bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 overflow-auto">
          <div className="p-5">
            {isLoading && (
              <div className="flex items-center text-slate-500">
                <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Načítám detail…
              </div>
            )}
            {!isLoading && t && (
              <>
                <h2 className="text-xl font-semibold leading-tight mb-1">{t.title}</h2>
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-4">{t.buyer}</div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mb-6">
                  <div>
                    <span className="text-slate-500">Status:</span> {t.detail?.status || "—"}
                  </div>
                  <div>
                    <span className="text-slate-500">Region:</span> {t.detail?.region || "—"}
                  </div>
                  <div>
                    <span className="text-slate-500">Země:</span> {t.country || "—"}
                  </div>
                  <div>
                    <span className="text-slate-500">CPV:</span> {(t.detail?.cpv || []).join(", ") || "—"}
                  </div>
                  <div>
                    <span className="text-slate-500">Rozpočet:</span> {formatCZK(t.detail?.budget_value ?? null)}
                  </div>
                  <div>
                    <span className="text-slate-500">Deadline:</span> {t.deadline || "—"}
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500">ID:</span> {t.external_id}
                  </div>
                </div>

                <div className="prose prose-sm dark:prose-invert mb-6 max-w-none">
                  <h3>Popis</h3>
                  <p>{t.detail?.description || "—"}</p>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Přílohy</h3>
                  <ul className="space-y-1">
                    {(t.detail?.attachments || []).length > 0 ? (
                      (t.detail!.attachments!).map((a, i) => (
                        <li key={i}>
                          <a className="inline-flex items-center text-blue-600 hover:underline" href={a.url} target="_blank" rel="noreferrer">
                            <FileText className="h-4 w-4 mr-2" /> {a.name}
                          </a>
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-slate-500">Žádné přílohy</li>
                    )}
                  </ul>
                </div>

                {t.notice_url && (
                  <a
                    href={t.notice_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-md border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" /> Otevřít zdroj
                  </a>
                )}
              </>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Root>
    );
  }
}

export default TendersPage;
