import React from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { cs } from 'date-fns/locale'
import { Calendar, Building2, ExternalLink, FileText } from 'lucide-react'
import { Tender } from '@/types/tender'

interface TenderCardProps {
  tender: Tender
}

export function TenderCard({ tender }: TenderCardProps) {
  const formatPrice = (value?: number, currency?: string) => {
    if (!value) return null
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: currency || 'CZK',
    }).format(value)
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null
    try {
      return format(new Date(dateStr), 'dd.MM.yyyy', { locale: cs })
    } catch {
      return dateStr
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'neukoncena': return 'bg-green-100 text-green-800'
      case 'zadana': return 'bg-blue-100 text-blue-800'
      case 'zrusena': return 'bg-red-100 text-red-800'
      case 'plneni': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="card p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0">
          <Link 
            to={`/tenders/${tender.hash_id}`}
            className="text-lg font-semibold text-gray-900 hover:text-blue-600 block truncate"
          >
            {tender.title}
          </Link>
          <p className="text-sm text-gray-600 mt-1">
            {tender.external_id}
          </p>
        </div>
        
        {tender.status && (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tender.status)}`}>
            {tender.status}
          </span>
        )}
      </div>

      <div className="space-y-2 mb-4">
        {tender.buyer && (
          <div className="flex items-center text-sm text-gray-600">
            <Building2 className="h-4 w-4 mr-2" />
            <span className="truncate">{tender.buyer}</span>
          </div>
        )}
        
        {tender.deadline && (
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            <span>Uzávěrka: {formatDate(tender.deadline)}</span>
          </div>
        )}
      </div>

      {tender.budget_value && (
        <div className="mb-4">
          <div className="text-lg font-semibold text-green-600">
            {formatPrice(tender.budget_value, tender.currency)}
          </div>
        </div>
      )}

      {tender.cpv.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {tender.cpv.slice(0, 3).map((code) => (
              <span 
                key={code}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
              >
                {code}
              </span>
            ))}
            {tender.cpv.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                +{tender.cpv.length - 3} dalších
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center pt-4 border-t">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          {tender.attachments.length > 0 && (
            <div className="flex items-center">
              <FileText className="h-4 w-4 mr-1" />
              <span>{tender.attachments.length} příloh</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {tender.notice_url && (
            <a
              href={tender.notice_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Zdroj
            </a>
          )}
          
          <Link
            to={`/tenders/${tender.hash_id}`}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
          >
            Detail
          </Link>
        </div>
      </div>
    </div>
  )
}
