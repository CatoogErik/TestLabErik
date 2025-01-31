import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'

interface Test {
  id: string
  title: string
  description: string | null
  is_private: boolean
  created_at: string
  product: {
    name: string
  }
}

export function TestsList() {
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newTest, setNewTest] = useState({
    title: '',
    description: '',
    is_private: false,
    product_id: ''
  })
  const [products, setProducts] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    fetchTests()
    fetchProducts()
  }, [])

  async function fetchTests() {
    try {
      const { data, error } = await supabase
        .from('tests')
        .select(`
          *,
          product:products(name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTests(data || [])
    } catch (error) {
      console.error('Error fetching tests:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .order('name')

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  async function handleCreateTest(e: React.FormEvent) {
    e.preventDefault()
    try {
      const { error } = await supabase
        .from('tests')
        .insert([{
          title: newTest.title,
          description: newTest.description || null,
          is_private: newTest.is_private,
          product_id: newTest.product_id
        }])

      if (error) throw error

      setNewTest({
        title: '',
        description: '',
        is_private: false,
        product_id: ''
      })
      setShowNewForm(false)
      fetchTests()
    } catch (error) {
      console.error('Error creating test:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-4">Laster...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Tester</h2>
          <p className="text-slate-600">Administrer produkttester</p>
        </div>
        <Button onClick={() => setShowNewForm(true)}>
          Opprett ny test
        </Button>
      </div>

      {showNewForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <form onSubmit={handleCreateTest} className="space-y-4">
            <div>
              <Label htmlFor="title">Testnavn</Label>
              <Input
                id="title"
                value={newTest.title}
                onChange={(e) => setNewTest(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Beskrivelse</Label>
              <Input
                id="description"
                value={newTest.description}
                onChange={(e) => setNewTest(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="product">Produkt</Label>
              <select
                id="product"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                value={newTest.product_id}
                onChange={(e) => setNewTest(prev => ({ ...prev, product_id: e.target.value }))}
                required
              >
                <option value="">Velg produkt</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_private"
                checked={newTest.is_private}
                onChange={(e) => setNewTest(prev => ({ ...prev, is_private: e.target.checked }))}
                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
              <Label htmlFor="is_private">Privat test</Label>
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
        {tests.map((test) => (
          <div key={test.id} className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{test.title}</h3>
                <p className="text-sm text-slate-500">Produkt: {test.product.name}</p>
                {test.description && (
                  <p className="text-slate-600 mt-1">{test.description}</p>
                )}
              </div>
              {test.is_private && (
                <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                  Privat
                </span>
              )}
            </div>
            <div className="mt-4 flex space-x-2">
              <Button variant="outline" size="sm">
                Rediger
              </Button>
              <Button variant="outline" size="sm">
                Del test
              </Button>
              <Button variant="outline" size="sm">
                Se resultater
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}