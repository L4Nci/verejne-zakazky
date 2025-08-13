import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tender } from '@/types/tender'

const pageSize = 30

export function useInfiniteTenders(q: string) {
  return useInfiniteQuery({
    queryKey: ['tenders', q || ''],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }): Promise<Tender[]> => {
      let qry = supabase
        .from('tenders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(pageSize)

      if (q) {
        const s = q.trim()
        if (s) qry = qry.or(`title.ilike.%${s}%,buyer.ilike.%${s}%`)
      }
      if (pageParam) {
        qry = qry.lt('created_at', pageParam)
      }
      const { data, error } = await qry
      if (error) throw error
      return (data || []) as Tender[]
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length < pageSize) return undefined
      const last = lastPage[lastPage.length - 1]
      return last?.created_at
    },
  })
}

export function useTenderDetail(external_id?: string) {
  return useQuery({
    enabled: !!external_id,
    queryKey: ['tender', external_id],
    queryFn: async (): Promise<Tender> => {
      const { data, error } = await supabase
        .from('tenders')
        .select('*')
        .eq('external_id', external_id)
        .single()
      if (error) throw error
      return data as Tender
    },
  })
}
