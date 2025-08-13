import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { fetchTenders, fetchTenderById } from '@/lib/supabase';
import { TenderFilters, TenderSort } from '@/types/tender';

export function useTendersQuery(filters: TenderFilters, sort: TenderSort) {
  return useInfiniteQuery({
    queryKey: ['tenders', filters, sort],
    queryFn: ({ pageParam }) => fetchTenders({ cursor: pageParam, filters, sort }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    staleTime: 1000 * 60 * 5, // 5 minut
  });
}

export function useTenderQuery(id: string) {
  return useQuery({
    queryKey: ['tender', id],
    queryFn: () => fetchTenderById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minut
  });
}
