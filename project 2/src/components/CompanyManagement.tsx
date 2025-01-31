import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'

interface Company {
  id: string
  name: string
  created_at: string
}

interface CompanyMember {
  id: string
  user_id: string
  role: 'admin' | 'member'
  profiles: {
    email: string
  }
}

interface SupabaseMemberResponse {
  id: string
  user_id: string
  role: string
  profiles: {
    email: string
  }
}

export function CompanyManagement() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [members, setMembers] = useState<CompanyMember[]>([])
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newCompany, setNewCompany] = useState({ name: '' })
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCompanies()
  }, [])

  useEffect(() => {
    if (selectedCompany) {
      fetchCompanyMembers(selectedCompany.id)
    }
  }, [selectedCompany])

  async function fetchCompanies() {
    try {
      setError(null)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      // First get the user's company memberships
      const { data: memberships, error: membershipError } = await supabase
        .from('company_members')
        .select('company_id')

      if (membershipError) {
        console.error('Membership error:', membershipError)
        throw new Error(`Error fetching memberships: ${membershipError.message}`)
      }

      if (!memberships || memberships.length === 0) {
        setCompanies([])
        return
      }

      // Then fetch the companies using the membership IDs
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .in('id', memberships.map(m => m.company_id))
        .order('name')

      if (companiesError) {
        console.error('Companies error:', companiesError)
        throw new Error(`Error fetching companies: ${companiesError.message}`)
      }

      const userCompanies = companiesData || []
      setCompanies(userCompanies)
      
      if (userCompanies.length > 0 && !selectedCompany) {
        setSelectedCompany(userCompanies[0])
      }
    } catch (error) {
      console.error('Error in fetchCompanies:', error)
      setError(error instanceof Error ? error.message : 'Error fetching companies')
    } finally {
      setLoading(false)
    }
  }

  async function fetchCompanyMembers(companyId: string) {
    try {
      setError(null)
      const { data, error } = await supabase
        .from('company_members')
        .select(`
          id,
          user_id,
          role,
          profiles!inner (
            email
          )
        `)
        .eq('company_id', companyId)

      if (error) {
        console.error('Members error:', error)
        throw error
      }

      // Transform the data to match the CompanyMember interface
      const transformedData: CompanyMember[] = (data as unknown as SupabaseMemberResponse[]).map(member => ({
        id: member.id,
        user_id: member.user_id,
        role: member.role as 'admin' | 'member',
        profiles: {
          email: member.profiles.email
        }
      }))

      setMembers(transformedData)
    } catch (error) {
      console.error('Error in fetchCompanyMembers:', error)
      setError(error instanceof Error ? error.message : 'Error fetching members')
    }
  }

  async function handleCreateCompany(e: React.FormEvent) {
    e.preventDefault()
    try {
      setError(null)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      const { data: company, error: companyError } = await supabase.rpc(
        'create_company_with_admin',
        {
          company_name: newCompany.name,
          admin_id: user.id
        }
      )

      if (companyError) {
        console.error('Create company error:', companyError)
        throw companyError
      }

      if (!company) throw new Error('No company created')

      setNewCompany({ name: '' })
      setShowNewForm(false)
      await fetchCompanies()
    } catch (error) {
      console.error('Error in handleCreateCompany:', error)
      setError(error instanceof Error ? error.message : 'Error creating company')
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCompany) return

    try {
      setError(null)
      // First, get the user ID from the profiles table
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', newMemberEmail)
        .single()

      if (profileError) throw new Error('User not found')
      if (!profiles) throw new Error('User not found')

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('company_members')
        .select('id')
        .eq('company_id', selectedCompany.id)
        .eq('user_id', profiles.id)
        .single()

      if (existingMember) {
        throw new Error('User is already a member of this company')
      }

      const { error: memberError } = await supabase
        .from('company_members')
        .insert([{
          company_id: selectedCompany.id,
          user_id: profiles.id,
          role: 'member'
        }])

      if (memberError) throw memberError

      setNewMemberEmail('')
      fetchCompanyMembers(selectedCompany.id)
    } catch (error) {
      console.error('Error in handleAddMember:', error)
      setError(error instanceof Error ? error.message : 'Error adding member')
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!selectedCompany) return

    try {
      setError(null)
      const { error } = await supabase
        .from('company_members')
        .delete()
        .eq('id', memberId)

      if (error) throw error

      fetchCompanyMembers(selectedCompany.id)
    } catch (error) {
      console.error('Error in handleRemoveMember:', error)
      setError(error instanceof Error ? error.message : 'Error removing member')
    }
  }

  if (loading) {
    return <div className="text-center py-4">Laster...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Selskaper</h2>
          <p className="text-slate-600">Administrer selskaper og medlemmer</p>
        </div>
        <Button onClick={() => setShowNewForm(true)}>
          Opprett nytt selskap
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-800 p-4 rounded-md">
          {error}
        </div>
      )}

      {showNewForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <form onSubmit={handleCreateCompany} className="space-y-4">
            <div>
              <Label htmlFor="name">Selskapsnavn</Label>
              <Input
                id="name"
                value={newCompany.name}
                onChange={(e) => setNewCompany({ name: e.target.value })}
                required
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Companies List */}
        <div className="space-y-4">
          <h3 className="font-medium text-slate-900">Dine selskaper</h3>
          <div className="space-y-2">
            {companies.map((company) => (
              <button
                key={company.id}
                onClick={() => setSelectedCompany(company)}
                className={`w-full text-left px-4 py-2 rounded-md ${
                  selectedCompany?.id === company.id
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {company.name}
              </button>
            ))}
          </div>
        </div>

        {/* Company Members */}
        {selectedCompany && (
          <div className="md:col-span-2 space-y-6">
            <div>
              <h3 className="font-medium text-slate-900">Medlemmer i {selectedCompany.name}</h3>
              <form onSubmit={handleAddMember} className="mt-4 space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="email"
                      placeholder="E-post til nytt medlem"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit">Legg til</Button>
                </div>
              </form>
            </div>

            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm"
                >
                  <div>
                    <p className="font-medium text-slate-900">{member.profiles.email}</p>
                    <p className="text-sm text-slate-500">
                      {member.role === 'admin' ? 'Administrator' : 'Medlem'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveMember(member.id)}
                  >
                    Fjern
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}