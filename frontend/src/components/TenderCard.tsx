import { Tender } from '@/types/tender';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { Calendar, Building, Euro, FileText } from 'lucide-react';

interface TenderCardProps {
  tender: Tender;
  onClick: () => void;
}

export function TenderCard({ tender, onClick }: TenderCardProps) {
  return (
    <div 
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
          {tender.title}
        </h3>
        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {tender.external_id}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        {tender.buyer && (
          <div className="flex items-center text-sm text-gray-600">
            <Building className="w-4 h-4 mr-2" />
            {tender.buyer}
          </div>
        )}
        
        {tender.deadline && (
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            Termín: {format(new Date(tender.deadline), 'dd.MM.yyyy', { locale: cs })}
          </div>
        )}
        
        {tender.budget_value && (
          <div className="flex items-center text-sm text-gray-600">
            <Euro className="w-4 h-4 mr-2" />
            {new Intl.NumberFormat('cs-CZ', { 
              style: 'currency', 
              currency: tender.currency || 'CZK' 
            }).format(tender.budget_value)}
          </div>
        )}
      </div>

      {tender.description && (
        <p className="text-sm text-gray-600 line-clamp-3 mb-4">
          {tender.description}
        </p>
      )}

      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          {tender.cpv.length > 0 && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              CPV: {tender.cpv[0]}
            </span>
          )}
          {tender.status && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
              {tender.status}
            </span>
          )}
        </div>
        
        {tender.attachments.length > 0 && (
          <div className="flex items-center text-sm text-gray-500">
            <FileText className="w-4 h-4 mr-1" />
            {tender.attachments.length}
          </div>
        )}
      </div>
    </div>
  );
}
