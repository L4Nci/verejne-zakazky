import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Building, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tender } from '@/types/tender';
import { formatPrice, formatDateShort, getSourceBadgeColor, getStatusBadgeColor } from '@/lib/utils';

interface TenderCardProps {
  tender: Tender;
}

export function TenderCard({ tender }: TenderCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/t/${tender.id}`);
  };

  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/20"
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header s badges */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex gap-2 flex-wrap">
              <Badge className={getSourceBadgeColor(tender.source)}>
                {tender.source}
              </Badge>
              <Badge className={getStatusBadgeColor(tender.status)}>
                {tender.status}
              </Badge>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </div>

          {/* Název zakázky */}
          <h3 className="font-semibold text-sm leading-tight line-clamp-2">
            {tender.title}
          </h3>

          {/* Zadavatel */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{tender.buyer_name}</span>
          </div>

          {/* Dolní řádek - cena a datum */}
          <div className="flex items-center justify-between text-sm">
            <div className="font-medium text-foreground">
              {formatPrice(tender.estimated_price, tender.currency)}
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDateShort(tender.publication_date)}</span>
            </div>
          </div>

          {/* CPV kódy */}
          {tender.cpv_codes.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {tender.cpv_codes.slice(0, 3).map((cpv) => (
                <Badge key={cpv} variant="outline" className="text-xs">
                  {cpv}
                </Badge>
              ))}
              {tender.cpv_codes.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{tender.cpv_codes.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
