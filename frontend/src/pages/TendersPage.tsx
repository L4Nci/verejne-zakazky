import { useState, useEffect, useCallback, useRef } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { useFilters } from '@/hooks/useFilters';
import { useTendersQuery } from '@/hooks/useTendersQuery';
import { FilterBar } from '@/components/filters/FilterBar';
import { TenderCard } from '@/components/tenders/TenderCard';
import { TenderDetail } from '@/components/tenders/TenderDetail';
import { useTenderQuery } from '@/hooks/useTendersQuery';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export function TendersPage() {
  const { filters, sort, sidebarOpen } = useFilters();
  const { id } = useParams();
  const navigate = useNavigate();
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch
  } = useTendersQuery(filters, sort);

  const { data: selectedTender, isLoading: isLoadingTender } = useTenderQuery(id || '');

  const observerRef = useRef<IntersectionObserver>();
  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (isFetchingNextPage) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    });
    if (node) observerRef.current.observe(node);
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  const allTenders = data?.pages.flatMap(page => page.data) || [];

  const handleCloseDetail = () => {
    navigate('/tenders');
  };

  if (isError) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)]">
        <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-200 border-r overflow-hidden`}>
          <div className="p-4">
            <FilterBar />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <ErrorState
            title="Chyba při načítání zakázek"
            description={error?.message || 'Zkuste to prosím znovu'}
            onRetry={() => refetch()}
          />
        </div>
      </div>
    );
  }

  const total = data?.pages[0]?.total || 0;

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Sidebar s filtry */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-200 border-r overflow-hidden`}>
        <div className="p-4">
          <FilterBar />
        </div>
      </div>

      {/* Hlavní obsah */}
      <div className="flex-1 flex">
        {/* Seznam zakázek */}
        <div className="flex-1 overflow-auto">
          <div className="p-4">
            {isLoading ? (
              <div className="grid gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <LoadingSkeleton key={i} />
                ))}
              </div>
            ) : allTenders.length === 0 ? (
              <EmptyState
                title="Žádné zakázky nenalezeny"
                description="Zkuste změnit filtry nebo hledaný výraz"
              />
            ) : (
              <div className="grid gap-4">
                {allTenders.map((tender, index) => (
                  <div
                    key={tender.id}
                    ref={index === allTenders.length - 1 ? lastElementRef : undefined}
                  >
                    <TenderCard tender={tender} />
                  </div>
                ))}
                
                {isFetchingNextPage && (
                  <div className="grid gap-4 mt-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <LoadingSkeleton key={i} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Detail panel */}
        {id && (
          <div className="w-96 border-l bg-background">
            {isLoadingTender ? (
              <div className="p-4">
                <LoadingSkeleton />
              </div>
            ) : selectedTender ? (
              <TenderDetail tender={selectedTender} onClose={handleCloseDetail} />
            ) : (
              <div className="p-4">
                <ErrorState
                  title="Zakázka nenalezena"
                  description="Požadovaná zakázka neexistuje"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
