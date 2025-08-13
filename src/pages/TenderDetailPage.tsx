import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { format } from 'date-fns'
import { cs } from 'date-fns/locale'
import { 
  ArrowLeft, 
  Building2, 
  Calendar, 
  ExternalLink, 
  FileText, 
  MapPin,
  Tag,
  DollarSign
} from 'lucide-react'
import { useTenderQuery } from '@/hooks/useTenders'

export function TenderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: tender, isLoading, error } = useTenderQuery(id!)

  if (isLoading) {
    return <div className="flex justify-center py-12">Načítám...</div>
  }

  if (error || !tender) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Zakázka nenalezena</p>
        <Link to="/" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          ← Zpět na seznam
        </Link>
      </div>
    )
  }

  const formatCurrency = (value?: number, currency?: string) => {
    if (!value) return 'Neuvedeno'
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: currency || 'CZK',
    }).format(value)
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Neuvedeno'
    try {
      return format(new Date(dateStr), 'dd.MM.yyyy HH:mm', { locale: cs })
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link 
          to="/tenders" 
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zpět na seznam zakázek
        </Link>
      </div>

      {/* Header */}
      <div className="card p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {tender.title}
            </h1>
            <p className="text-gray-600">{tender.external_id}</p>
          </div>
          
          {tender.status && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(tender.status)}`}>
              {tender.status}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tender.buyer && (
            <div className="flex items-start space-x-3">
              <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <dt className="text-sm font-medium text-gray-900">Zadavatel</dt>
                <dd className="text-sm text-gray-600">{tender.buyer}</dd>
              </div>
            </div>
          )}

          {tender.deadline && (
            <div className="flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <dt className="text-sm font-medium text-gray-900">Uzávěrka</dt>
                <dd className="text-sm text-gray-600">{formatDate(tender.deadline)}</dd>
              </div>
            </div>
          )}

          {tender.budget_value && (
            <div className="flex items-start space-x-3">
              <DollarSign className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <dt className="text-sm font-medium text-gray-900">Odhadovaná hodnota</dt>
                <dd className="text-lg font-semibold text-green-600">
                  {formatCurrency(tender.budget_value, tender.currency)}
                </dd>
              </div>
            </div>
          )}

          {(tender.region || tender.country) && (
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <dt className="text-sm font-medium text-gray-900">Místo plnění</dt>
                <dd className="text-sm text-gray-600">
                  {[tender.region, tender.country].filter(Boolean).join(', ')}
                </dd>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Popis */}
      {tender.description && (
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Popis</h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{tender.description}</p>
          </div>
        </div>
      )}

      {/* CPV kódy */}
      {tender.cpv.length > 0 && (
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Tag className="h-5 w-5 mr-2" />
            CPV kódy
          </h2>
          <div className="flex flex-wrap gap-2">
            {tender.cpv.map((code) => (
              <span 
                key={code}
                className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
              >
                {code}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Přílohy */}
      {tender.attachments.length > 0 && (
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Přílohy ({tender.attachments.length})
          </h2>
          <div className="space-y-2">
            {tender.attachments.map((attachment, index) => (
              <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                <div className="flex items-center space-x-3">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">{attachment.name}</span>
                  {attachment.size && (
                    <span className="text-xs text-gray-500">
                      ({(attachment.size / 1024).toFixed(1)} KB)
                    </span>
                  )}
                </div>
                {attachment.url && (
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Stáhnout
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-900">Zdroj</dt>
            <dd className="text-sm text-gray-600">{tender.source_id}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-900">Externí ID</dt>
            <dd className="text-sm text-gray-600">{tender.external_id}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-900">Vytvořeno</dt>
            <dd className="text-sm text-gray-600">{formatDate(tender.created_at)}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-900">Aktualizováno</dt>
            <dd className="text-sm text-gray-600">{formatDate(tender.updated_at)}</dd>
          </div>
          {tender.procedure_type && (
            <div>
              <dt className="text-sm font-medium text-gray-900">Typ postupu</dt>
              <dd className="text-sm text-gray-600">{tender.procedure_type}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Externí odkaz */}
      {tender.notice_url && (
        <div className="text-center">
          <a
            href={tender.notice_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <ExternalLink className="h-5 w-5 mr-2" />
            Zobrazit na původním zdroji
          </a>
        </div>
      )}
    </div>
  )
}
