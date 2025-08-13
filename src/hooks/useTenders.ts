// src/hooks/useTenders.ts
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase"; // uprav cestu pokud máš klient jinde
import type { Tender } from "@/types/tender";

export type TenderSort =
  | { field: "created_at"; direction: "asc" | "desc" }
  | { field: "deadline"; direction: "asc" | "desc" }
  | { field: "budget_value"; direction: "asc" | "desc" };

export type TenderFilters = {
  q?: string;
  statuses?: string[];
  regions?: string[];
  cpv?: string[];           // očekává text[] sloupec (nebo uprav níž)
  budgetMin?: number;
  budgetMax?: number;
  deadlineFrom?: string;    // "YYYY-MM-DD"
  deadlineTo?: string;      // "YYYY-MM-DD"
};

const PAGE_SIZE = 30;

function baseSelect() {
  // Vyber si sloupce; "*" je nejjednodušší.
  return supabase.from("tenders").select("*", { count: "exact" });
}

function applyFilters(query: ReturnType<typeof baseSelect>, f: TenderFilters) {
  let q = query;

  // fulltext jednoduchý přes ilike title/buyer (OR)
  if (f.q && f.q.trim()) {
    const s = f.q.trim();
    q = q.or(`title.ilike.%${s}%,buyer.ilike.%${s}%`);
  }

  if (f.statuses && f.statuses.length) {
    q = q.in("status", f.statuses.map((s) => s.toLowerCase()));
  }
  if (f.regions && f.regions.length) {
    q = q.in("region", f.regions.map((s) => s.toLowerCase()));
  }

  // CPV: pokud máš v DB sloupec cpv (text[]), overlaps je ideál.
  // Když máš string, přepni to na or(ilike) podle svých prefixů.
  if (f.cpv && f.cpv.length) {
    q = q.overlaps("cpv", f.cpv);
  }

  if (typeof f.budgetMin === "number") q = q.gte("budget_value", f.budgetMin);
  if (typeof f.budgetMax === "number") q = q.lte("budget_value", f.budgetMax);

  if (f.deadlineFrom) q = q.gte("deadline", f.deadlineFrom);
  if (f.deadlineTo) q = q.lte("deadline", f.deadlineTo);

  return q;
}

function applySort(query: ReturnType<typeof baseSelect>, sort: TenderSort) {
  if (sort.field === "created_at") {
    return query.order("created_at", { ascending: sort.direction === "asc", nullsFirst: false });
  }
  if (sort.field === "deadline") {
    return query.order("deadline", { ascending: sort.direction === "asc", nullsFirst: true });
  }
  if (sort.field === "budget_value") {
    return query.order("budget_value", { ascending: sort.direction === "asc", nullsFirst: true });
  }
  return query.order("created_at", { ascending: false });
}

export function useInfiniteTenders(filters: TenderFilters, sort: TenderSort) {
  return useInfiniteQuery({
    queryKey: ["tenders", filters, sort],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const offset = pageParam as number;

      let q = baseSelect();
      q = applyFilters(q, filters);
      q = applySort(q, sort);

      const { data, error, count } = await q.range(offset, offset + PAGE_SIZE - 1);
      if (error) throw error;

      return {
        data: (data ?? []) as Tender[],
        count: count ?? 0,
        nextOffset: offset + PAGE_SIZE,
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((acc, p) => acc + p.data.length, 0);
      return loaded < (lastPage.count ?? 0) ? lastPage.nextOffset : undefined;
    },
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });
}

export function useTenderDetail(externalId?: string) {
  return useQuery({
    queryKey: ["tenders", "detail", externalId],
    enabled: !!externalId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenders")
        .select("*")
        .eq("external_id", externalId!)
        .maybeSingle();

      if (error) throw error;
      return (data ?? null) as Tender | null;
    },
  });
}
