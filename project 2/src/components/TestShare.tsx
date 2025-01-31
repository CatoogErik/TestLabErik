import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'

interface TestShareProps {
  testId: string
  onClose: () => void
}

export function TestShare({ testId, onClose }: TestShareProps) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleShare(e: React.FormEvent) {
    e.preventDefault()
    try {
      setError(null)
      setSuccess(false)

      // First, get the user ID from the profiles table
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()

      if (profileError) throw new Error('Bruker ikke funnet')
      if (!profiles) throw new Error('Bruker ikke funnet')

      // Then create the test share
      const { error: shareError } = await supabase
        .from('test_shares')
        .insert([{
          test_id: testId,
          shared_with_user_id: profiles.id
        }])

      if (shareError) {
        if (shareError.code === '23505') { // Unique violation
          throw new Error('Testen er allerede delt med denne brukeren')
        }
        throw shareError
      }

      setSuccess(true)
      setEmail('')
    } catch (error) {
      console.error('Error sharing test:', error)
      setError(error instanceof Error ? error.message : 'Error sharing test')
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Del test</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ✕
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-800 rounded-md">
          Testen er delt!
        </div>
      )}

      <form onSubmit={handleShare} className="space-y-4">
        <div>
          <Label htmlFor="email">E-post til bruker</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ola.nordmann@example.com"
            required
          />
        </div>
        <div className="flex space-x-2">
          <Button type="submit">Del test</Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Avbryt
          </Button>
        </div>
      </form>
    </div>
  )
}