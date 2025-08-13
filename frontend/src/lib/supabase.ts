import { createClient } from '@supabase/supabase-js';
import { TenderFilters, TenderSort, TendersResponse, Tender } from '@/types/tender';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface FetchTendersParams {
  cursor?: string;
  filters: TenderFilters;
  sort: TenderSort;
  limit?: number;
}

export async function fetchTenders({
  cursor,
  filters,
  sort,
  limit = 20
}: FetchTendersParams): Promise<TendersResponse> {
  let query = supabase
    .from('tenders')
    .select('*', { count: 'exact' });

  // Aplikuj filtry
  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,buyer.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }
  
  if (filters.buyer) {
    query = query.ilike('buyer', `%${filters.buyer}%`);
  }
  
  if (filters.cpv && filters.cpv.length > 0) {
    query = query.overlaps('cpv', filters.cpv);
  }
  
  if (filters.region) {
    query = query.eq('region', filters.region);
  }
  
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  
  if (filters.budgetMin !== undefined) {
    query = query.gte('budget_value', filters.budgetMin);
  }
  
  if (filters.budgetMax !== undefined) {
    query = query.lte('budget_value', filters.budgetMax);
  }
  
  if (filters.deadlineFrom) {
    query = query.gte('deadline', filters.deadlineFrom);
  }
  
  if (filters.deadlineTo) {
    query = query.lte('deadline', filters.deadlineTo);
  }

  // Cursor-based pagination
  if (cursor) {
    if (sort.direction === 'asc') {
      query = query.gt(sort.field, cursor);
    } else {
      query = query.lt(sort.field, cursor);
    }
  }

  // Řazení
  query = query.order(sort.field, { ascending: sort.direction === 'asc' });
  query = query.limit(limit);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch tenders: ${error.message}`);
  }

  const hasMore = (data?.length || 0) === limit;
  const nextCursor = hasMore && data && data.length > 0 
    ? String(data[data.length - 1][sort.field]) 
    : undefined;

  return {
    data: data || [],
    nextCursor,
    hasMore,
    total: count || 0,
  };
}

export async function fetchTenderById(id: string): Promise<Tender> {
  const { data, error } = await supabase
    .from('tenders')
    .select('*')
    .eq('hash_id', id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch tender: ${error.message}`);
  }

  return data;
}
    url: raw.url || '',
    created_at: raw.created_at,
    updated_at: raw.updated_at
  };
}
