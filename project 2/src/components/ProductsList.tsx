import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'

interface Product {
  id: string
  name: string
  description: string | null
  created_at: string
  company: {
    id: string
    name: string
  }
}

export function ProductsList() {
  const [products, setProducts] = useState<Product[]>([])
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([])
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newProduct, setNewProduct] = useState({ name: '', description: '' })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function initialize() {
      try {
        await fetchCompanies()
        setLoading(false)
      } catch (error) {
        console.error('Error initializing:', error)
        setError(error instanceof Error ? error.message : 'Error initializing')
        setLoading(false)
      }
    }
    initialize()
  }, [])

  useEffect(() => {
    if (selectedCompany) {
      fetchProducts()
    } else {
      setProducts([])
    }
  }, [selectedCompany])

  async function fetchCompanies() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name')

      if (error) throw error
      setCompanies(data || [])
      if (data && data.length > 0 && !selectedCompany) {
        setSelectedCompany(data[0].id)
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
      setError(error instanceof Error ? error.message : 'Error fetching companies')
      throw error // Re-throw to be caught by initialize()
    }
  }

  async function fetchProducts() {
    if (!selectedCompany) return
    
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          company:companies(id, name)
        `)
        .eq('company_id', selectedCompany)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
      setError(error instanceof Error ? error.message : 'Error fetching products')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCompany) return

    try {
      setError(null)
      const { error } = await supabase
        .from('products')
        .insert([{
          name: newProduct.name,
          description: newProduct.description || null,
          company_id: selectedCompany
        }])

      if (error) throw error

      setNewProduct({ name: '', description: '' })
      setShowNewForm(false)
      fetchProducts()
    } catch (error) {
      console.error('Error creating product:', error)
      setError(error instanceof Error ? error.message : 'Error creating product')
    }
  }

  if (loading) {
    return <div className="text-center py-4">Laster...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Produkter</h2>
          <p className="text-slate-600">Administrer produkter for testing</p>
        </div>
        <Button onClick={() => setShowNewForm(true)}>
          Opprett nytt produkt
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-800 p-4 rounded-md">
          {error}
        </div>
      )}

      <div className="flex gap-4 items-center">
        <Label htmlFor="company" className="whitespace-nowrap">Velg selskap:</Label>
        <select
          id="company"
          className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          value={selectedCompany || ''}
          onChange={(e) => setSelectedCompany(e.target.value)}
        >
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </div>

      {showNewForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <form onSubmit={handleCreateProduct} className="space-y-4">
            <div>
              <Label htmlFor="name">Produktnavn</Label>
              <Input
                id="name"
                value={newProduct.name}
                onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Beskrivelse</Label>
              <Input
                id="description"
                value={newProduct.description}
                onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="flex space-x-2">
              <Button type="submit">Lagre</Button>
              <Button type="button" variant="outline" onClick={() => setShowNewForm(false)}>
                Avbryt
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {products.map((product) => (
          <div key={product.id} className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{product.name}</h3>
                <p className="text-sm text-slate-500">Produkt: {product.company.name}</p>
                {product.description && (
                  <p className="text-slate-600 mt-1">{product.description}</p>
                )}
              </div>
            </div>
            <div className="mt-4 flex space-x-2">
              <Button variant="outline" size="sm">
                Rediger
              </Button>
              <Button variant="outline" size="sm">
                Se tester
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}