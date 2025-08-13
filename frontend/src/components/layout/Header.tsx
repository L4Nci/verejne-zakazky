import { Moon, Sun, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFilters } from '@/hooks/useFilters';

interface HeaderProps {
  onToggleTheme: () => void;
  isDark: boolean;
}

export function Header({ onToggleTheme, isDark }: HeaderProps) {
  const { setSidebarOpen, sidebarOpen } = useFilters();
  const appEnv = import.meta.env.VITE_APP_ENV || 'development';

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Filter className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Veřejné zakázky</h1>
          {appEnv !== 'production' && (
            <Badge variant="outline" className="text-xs">
              {appEnv}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onToggleTheme}>
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </header>
  );
}
