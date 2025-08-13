import { createClient } from "@supabase/supabase-js";
import type { Tender, TenderFilters, TenderSort, TendersPageResult } from "@/types/tender";

// Supabase client
const url = import.meta.env.VITE_SUPABASE_URL as string;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, anon, {
  auth: { persistSession: false }
});

export const PAGE_SIZE = 30;

// Build one page (server-side: q + created_at cursor; other filters client-side in V1)
export async function fetchTendersPage(params: {
  filters: TenderFilters;
  sort: TenderSort;
  cursor?: string | null;
  includeCount?: boolean;
}): Promise<TendersPageResult> {
  const { filters, sort, cursor, includeCount } = params;
  const sortField = "created_at"; // V1 server sort by created_at; others can be client-side
  const ascending = sort?.direction === "asc";

  let query = supabase
    .from("tenders")
    .select("*", { count: includeCount ? "exact" : undefined })
    .order(sortField, { ascending })
    .limit(PAGE_SIZE);

  // fulltext q over title + buyer
  if (filters?.q && filters.q.trim()) {
    const q = filters.q.trim();
    query = query.or(`title.ilike.%${q}%,buyer.ilike.%${q}%`);
  }

  // cursor pagination by created_at
  if (cursor) {
    query = ascending ? query.gt("created_at", cursor) : query.lt("created_at", cursor);
  }

  const { data, count, error } = await query;
  if (error) throw error;

  return {
    data: (data || []) as Tender[],
    count: includeCount ? count ?? undefined : undefined,
    cursor: (data && data.length) ? (data[data.length - 1] as any).created_at : null
  };
}
