import { Card, CardContent } from '@/components/ui/card';

export function LoadingSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="h-5 w-12 bg-muted rounded animate-pulse"></div>
            <div className="h-5 w-16 bg-muted rounded animate-pulse"></div>
          </div>
          <div className="h-5 w-3/4 bg-muted rounded animate-pulse"></div>
          <div className="h-4 w-1/2 bg-muted rounded animate-pulse"></div>
          <div className="flex justify-between">
            <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
            <div className="h-4 w-16 bg-muted rounded animate-pulse"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
