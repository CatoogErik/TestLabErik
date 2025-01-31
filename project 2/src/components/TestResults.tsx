import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface TestResult {
  id: string
  feedback: string | null
  rating: number
  created_at: string
  tester: {
    name: string
    email: string
  }
}

interface TestResultsProps {
  testId: string
}

export function TestResults({ testId }: TestResultsProps) {
  const [results, setResults] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    averageRating: 0,
    totalResponses: 0
  })

  useEffect(() => {
    fetchResults()
  }, [testId])

  async function fetchResults() {
    try {
      const { data, error } = await supabase
        .from('test_results')
        .select(`
          *,
          tester:testers(name, email)
        `)
        .eq('test_id', testId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setResults(data || [])

      // Calculate statistics
      if (data && data.length > 0) {
        const totalRating = data.reduce((sum, result) => sum + result.rating, 0)
        setStats({
          averageRating: Number((totalRating / data.length).toFixed(1)),
          totalResponses: data.length
        })
      }
    } catch (error) {
      console.error('Error fetching test results:', error)
      setError(error instanceof Error ? error.message : 'Error fetching results')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-4">Laster resultater...</div>
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-800 p-4 rounded-md">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Statistikk</h3>
          <div className="space-y-2">
            <p className="text-slate-600">
              Gjennomsnittlig vurdering: <span className="font-semibold text-slate-900">{stats.averageRating}/5</span>
            </p>
            <p className="text-slate-600">
              Antall svar: <span className="font-semibold text-slate-900">{stats.totalResponses}</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Rating fordeling</h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(rating => {
              const count = results.filter(r => r.rating === rating).length
              const percentage = stats.totalResponses > 0
                ? Math.round((count / stats.totalResponses) * 100)
                : 0

              return (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-sm text-slate-600 w-8">{rating}★</span>
                  <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-slate-600 w-12">{percentage}%</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Tilbakemeldinger</h3>
        {results.length === 0 ? (
          <p className="text-slate-600">Ingen resultater ennå</p>
        ) : (
          results.map((result) => (
            <div key={result.id} className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium text-slate-900">{result.tester.name}</p>
                  <p className="text-sm text-slate-500">{result.tester.email}</p>
                </div>
                <div className="flex items-center">
                  <span className="text-lg font-semibold text-slate-900 mr-1">{result.rating}</span>
                  <span className="text-yellow-400">★</span>
                </div>
              </div>
              {result.feedback && (
                <p className="text-slate-600 mt-2">{result.feedback}</p>
              )}
              <p className="text-sm text-slate-500 mt-2">
                {new Date(result.created_at).toLocaleDateString('nb-NO', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}