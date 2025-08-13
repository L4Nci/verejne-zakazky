import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, RotateCcw } from 'lucide-react';
import { useFilters } from '@/hooks/useFilters';
import { useState } from 'react';

const SOURCE_OPTIONS = [
  { value: 'NEN', label: 'NEN' },
  { value: 'VVZ', label: 'VVZ' },
  { value: 'TED', label: 'TED' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Aktivní' },
  { value: 'finished', label: 'Ukončené' },
  { value: 'cancelled', label: 'Zrušené' },
];

export function FilterBar() {
  const { filters, setFilters, resetFilters } = useFilters();
  const [localQ, setLocalQ] = useState(filters.q || '');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ q: localQ });
  };

  const toggleSource = (source: string) => {
    const current = filters.source || [];
    const updated = current.includes(source)
      ? current.filter(s => s !== source)
      : [...current, source];
    setFilters({ source: updated });
  };

  const toggleStatus = (status: string) => {
    const current = filters.status || [];
    const updated = current.includes(status)
      ? current.filter(s => s !== status)
      : [...current, status];
    setFilters({ status: updated });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Filtry</CardTitle>
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Vyhledávání */}
        <form onSubmit={handleSearchSubmit}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Hledat v názvu a zadavateli..."
              className="pl-10"
              value={localQ}
              onChange={(e) => setLocalQ(e.target.value)}
            />
          </div>
        </form>

        {/* Zdroje */}
        <div>
          <label className="text-sm font-medium mb-2 block">Zdroj</label>
          <div className="flex flex-wrap gap-2">
            {SOURCE_OPTIONS.map((option) => (
              <Badge
                key={option.value}
                variant={filters.source?.includes(option.value) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleSource(option.value)}
              >
                {option.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Stavy */}
        <div>
          <label className="text-sm font-medium mb-2 block">Stav</label>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((option) => (
              <Badge
                key={option.value}
                variant={filters.status?.includes(option.value) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleStatus(option.value)}
              >
                {option.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Cena */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-sm font-medium mb-1 block">Min. cena</label>
            <Input
              type="number"
              placeholder="0"
              value={filters.price_min || ''}
              onChange={(e) => setFilters({ price_min: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Max. cena</label>
            <Input
              type="number"
              placeholder="∞"
              value={filters.price_max || ''}
              onChange={(e) => setFilters({ price_max: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>
        </div>

        {/* Datum */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-sm font-medium mb-1 block">Od</label>
            <Input
              type="date"
              value={filters.date_from || ''}
              onChange={(e) => setFilters({ date_from: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Do</label>
            <Input
              type="date"
              value={filters.date_to || ''}
              onChange={(e) => setFilters({ date_to: e.target.value })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
