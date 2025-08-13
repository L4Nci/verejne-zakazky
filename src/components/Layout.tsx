import React, { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Search, BarChart3, FileText } from 'lucide-react'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation()

  const navigation = [
    { name: 'Zakázky', href: '/', icon: Search },
    { name: 'Statistiky', href: '/stats', icon: BarChart3 },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-gray-900">
                  Veřejné zakázky
                </h1>
              </Link>
            </div>
            <nav className="flex space-x-4">
              <Link
                to="/tenders"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Zakázky
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
