import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SortKey = "newest" | "deadlineAsc" | "deadlineDesc" | "budgetAsc" | "budgetDesc";

export interface Filters {
  q: string;
  statuses: string[];
  regions: string[];
  cpv: string[];
  budgetMin?: number;
  budgetMax?: number;
  deadlineFrom?: string;
  deadlineTo?: string;
  sort: SortKey;
  sheetOpen: boolean;
}

function parseArray(v: string | null): string[] {
  if (!v) return [];
  return v.split(",").map(s => s.trim()).filter(Boolean);
}

function toCsv(arr: string[] | undefined) {
  return (arr && arr.length) ? arr.join(",") : undefined;
}

export const useFilterStore = create<Filters & {
  set: (v: Partial<Filters>) => void;
  reset: () => void;
  openSheet: (o: boolean) => void;
  syncFromUrl: (search: string) => void;
  syncToUrl: () => void;
}>()(
  persist(
    (set, get) => ({
      q: "",
      statuses: [],
      regions: [],
      cpv: [],
      budgetMin: undefined,
      budgetMax: undefined,
      deadlineFrom: undefined,
      deadlineTo: undefined,
      sort: "newest",
      sheetOpen: false,
      set: (v) => set({ ...v }),
      reset: () => set({
        q: "",
        statuses: [],
        regions: [],
        cpv: [],
        budgetMin: undefined,
        budgetMax: undefined,
        deadlineFrom: undefined,
        deadlineTo: undefined,
        sort: "newest"
      }),
      openSheet: (o) => set({ sheetOpen: o }),
      syncFromUrl: (search) => {
        const sp = new URLSearchParams(search);
        set({
          q: sp.get("q") ?? "",
          statuses: parseArray(sp.get("status")),
          regions: parseArray(sp.get("region")),
          cpv: parseArray(sp.get("cpv")),
          budgetMin: sp.get("bmin") ? Number(sp.get("bmin")) : undefined,
          budgetMax: sp.get("bmax") ? Number(sp.get("bmax")) : undefined,
          deadlineFrom: sp.get("dfrom") || undefined,
          deadlineTo: sp.get("dto") || undefined,
          sort: (sp.get("sort") as any) || "newest"
        });
      },
      syncToUrl: () => {
        const v = get();
        const sp = new URLSearchParams(window.location.search);
        v.q ? sp.set("q", v.q) : sp.delete("q");
        toCsv(v.statuses) ? sp.set("status", toCsv(v.statuses)!) : sp.delete("status");
        toCsv(v.regions) ? sp.set("region", toCsv(v.regions)!) : sp.delete("region");
        toCsv(v.cpv) ? sp.set("cpv", toCsv(v.cpv)!) : sp.delete("cpv");
        v.budgetMin != null ? sp.set("bmin", String(v.budgetMin)) : sp.delete("bmin");
        v.budgetMax != null ? sp.set("bmax", String(v.budgetMax)) : sp.delete("bmax");
        v.deadlineFrom ? sp.set("dfrom", v.deadlineFrom) : sp.delete("dfrom");
        v.deadlineTo ? sp.set("dto", v.deadlineTo) : sp.delete("dto");
        sp.set("sort", v.sort);
        const url = `${location.pathname}?${sp.toString()}`;
        history.replaceState(null, "", url);
      }
    }),
    { name: "tender-filters" }
  )
);

export const useThemeStore = create<{ theme: "light" | "dark"; toggleTheme: () => void; applyThemeClass: () => void }>()(
  persist(
    (set, get) => ({
      theme: "light",
      toggleTheme: () => {
        set({ theme: get().theme === "dark" ? "light" : "dark" });
      },
      applyThemeClass: () => {
        const isDark = get().theme === "dark";
        document.documentElement.classList.toggle("dark", isDark);
      }
    }),
    { name: "tender-theme" }
  )
);
