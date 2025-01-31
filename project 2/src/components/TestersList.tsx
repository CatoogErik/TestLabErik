import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'

interface Tester {
  id: string
  name: string
  email: string
  phone: string | null
  created_at: string
}

export function TestersList() {
  const [testers, setTesters] = useState<Tester[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newTester, setNewTester] = useState({
    name: '',
    email: '',
    phone: ''
  })

  useEffect(() => {
    fetchTesters()
  }, [])

  async function fetchTesters() {
    try {
      const { data, error } = await supabase
        .from('testers')
        .select('*')
        .order('name')

      if (error) throw error
      setTesters(data || [])
    } catch (error) {
      console.error('Error fetching testers:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateTester(e: React.FormEvent) {
    e.preventDefault()
    try {
      const { error } = await supabase
        .from('testers')
        .insert([{
          name: newTester.name,
          email: newTester.email,
          phone: newTester.phone || null
        }])

      if (error) throw error

      setNewTester({ name: '', email: '', phone: '' })
      setShowNewForm(false)
      fetchTesters()
    } catch (error) {
      console.error('Error creating tester:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-4">Laster...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Deltakere</h2>
          <p className="text-slate-600">Administrer testdeltakere</p>
        </div>
        <Button onClick={() => setShowNewForm(true)}>
          Legg til deltaker
        </Button>
      </div>

      {showNewForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <form onSubmit={handleCreateTester} className="space-y-4">
            <div>
              <Label htmlFor="name">Navn</Label>
              <Input
                id="name"
                value={newTester.name}
                onChange={(e) => setNewTester(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">E-post</Label>
              <Input
                id="email"
                type="email"
                value={newTester.email}
                onChange={(e) => setNewTester(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                type="tel"
                value={newTester.phone}
                onChange={(e) => setNewTester(prev => ({ ...prev, phone: e.target.value }))}
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
        {testers.map((tester) => (
          <div key={tester.id} className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">{tester.name}</h3>
            <div className="mt-1 space-y-1">
              <p className="text-slate-600">
                <span className="font-medium">E-post:</span> {tester.email}
              </p>
              {tester.phone && (
                <p className="text-slate-600">
                  <span className="font-medium">Telefon:</span> {tester.phone}
                </p>
              )}
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