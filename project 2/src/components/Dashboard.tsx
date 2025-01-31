import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { Button } from './ui/button'
import { ProductsList } from './ProductsList'
import { TestsList } from './TestsList'
import { TestersList } from './TestersList'
import { CompanyManagement } from './CompanyManagement'

export function Dashboard() {
  const [user, setUser] = useState<Session['user'] | null>(null)
  const [activeView, setActiveView] = useState<'oversikt' | 'selskaper' | 'produkter' | 'tester' | 'deltakere'>('oversikt')
  const [stats, setStats] = useState({
    products: 0,
    activeTests: 0,
    companies: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        try {
          // Get companies count
          const { data: companies } = await supabase
            .from('company_members')
            .select('company_id', { count: 'exact' })
            .eq('user_id', user.id)

          // Get products count from companies where user is a member
          const { data: products } = await supabase
            .from('products')
            .select('id', { count: 'exact' })
            .in('company_id', companies?.map(c => c.company_id) || [])

          // Get tests count from those products
          const { data: tests } = await supabase
            .from('tests')
            .select('id', { count: 'exact' })
            .in('product_id', products?.map(p => p.id) || [])
            .eq('is_private', false)

          setStats({
            companies: companies?.length || 0,
            products: products?.length || 0,
            activeTests: tests?.length || 0
          })
        } catch (error) {
          console.error('Error fetching stats:', error)
        }
      }
      setLoading(false)
    }
    getUser()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
          <p className="text-center text-slate-600">Laster...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-xl font-semibold text-slate-900">TestLab</h1>
        </div>

        <nav className="flex-grow p-4 space-y-2">
          <Button
            variant={activeView === 'oversikt' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveView('oversikt')}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Oversikt
          </Button>

          <Button
            variant={activeView === 'selskaper' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveView('selskaper')}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Selskaper
          </Button>
          
          <Button
            variant={activeView === 'produkter' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveView('produkter')}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Produkter
          </Button>

          <Button
            variant={activeView === 'tester' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveView('tester')}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Tester
          </Button>

          <Button
            variant={activeView === 'deltakere' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveView('deltakere')}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Deltakere
          </Button>
        </nav>

        <div className="border-t p-4">
          <div className="mb-4">
            <p className="text-sm text-slate-600">Innlogget som</p>
            <p className="text-sm font-medium truncate">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleSignOut}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logg ut
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {activeView === 'oversikt' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Oversikt</h2>
                <p className="text-slate-600">Administrer dine prosjekter og tester</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-white rounded-lg shadow-sm">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Selskaper</p>
                      <p className="text-2xl font-semibold text-slate-900">{stats.companies}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-white rounded-lg shadow-sm">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Produkter i testing</p>
                      <p className="text-2xl font-semibold text-slate-900">{stats.products}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-white rounded-lg shadow-sm">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Aktive tester</p>
                      <p className="text-2xl font-semibold text-slate-900">{stats.activeTests}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'selskaper' && <CompanyManagement />}
          {activeView === 'produkter' && <ProductsList />}
          {activeView === 'tester' && <TestsList />}
          {activeView === 'deltakere' && <TestersList />}
        </div>
      </div>
    </div>
  )
}