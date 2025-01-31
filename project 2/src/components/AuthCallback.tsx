import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from './ui/button'

export function AuthCallback() {
  const [message, setMessage] = useState('Bekrefter e-posten din...')

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        const hash = window.location.hash
        if (hash && hash.includes('access_token')) {
          const { data: { session }, error } = await supabase.auth.getSession()
          
          if (error) throw error
          
          if (session) {
            setMessage('E-post bekreftet! Du kan nå lukke dette vinduet og logge inn.')
          } else {
            setMessage('Kunne ikke bekrefte e-post. Vennligst prøv å logge inn.')
          }
        } else {
          setMessage('Ugyldig bekreftelseslenke.')
        }
      } catch (error) {
        setMessage('En feil oppstod under bekreftelsen.')
        console.error('Error:', error)
      }
    }

    handleEmailConfirmation()
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h1 className="mb-4 text-xl font-semibold">E-post bekreftelse</h1>
        <p className="mb-6 text-slate-600">{message}</p>
        <Button
          className="w-full"
          onClick={() => window.location.href = '/'}
        >
          Tilbake til innlogging
        </Button>
      </div>
    </div>
  )
}