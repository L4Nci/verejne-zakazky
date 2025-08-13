import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Building, ExternalLink, MapPin, X } from 'lucide-react';
import { Tender } from '@/types/tender';
import { formatPrice, formatDate, getSourceBadgeColor, getStatusBadgeColor } from '@/lib/utils';

interface TenderDetailProps {
  tender: Tender;
  onClose: () => void;
}

export function TenderDetail({ tender, onClose }: TenderDetailProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Detail zakázky</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Základní info */}
        <div>
          <div className="flex gap-2 mb-3">
            <Badge className={getSourceBadgeColor(tender.source)}>
              {tender.source}
            </Badge>
            <Badge className={getStatusBadgeColor(tender.status)}>
              {tender.status}
            </Badge>
          </div>
          
          <h1 className="text-xl font-bold mb-4 leading-tight">
            {tender.title}
          </h1>

          <div className="grid gap-3">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-medium">Zadavatel:</span> {tender.buyer_name}
              </span>
            </div>

            {tender.region && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="font-medium">Region:</span> {tender.region}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-medium">Zveřejněno:</span> {formatDate(tender.publication_date)}
              </span>
            </div>

            {tender.deadline_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="font-medium">Uzávěrka:</span> {formatDate(tender.deadline_date)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Cena */}
        {tender.estimated_price && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Odhadovaná hodnota</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatPrice(tender.estimated_price, tender.currency)}
              </div>
            </CardContent>
          </Card>
        )}

        {/* CPV kódy */}
        {tender.cpv_codes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">CPV kódy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tender.cpv_codes.map((cpv) => (
                  <Badge key={cpv} variant="outline">
                    {cpv}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Externí odkaz */}
        {tender.url && (
          <Button asChild className="w-full">
            <a href={tender.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Zobrazit na {tender.source}
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
