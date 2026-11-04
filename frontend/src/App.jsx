import { CalendarDays } from 'lucide-react'
import { useEffect, useState } from 'react'
import { apiGet } from './lib/api.js'

export default function App() {
  const [backend, setBackend] = useState({ state: 'loading' })

  useEffect(() => {
    apiGet('/health')
      .then(() => setBackend({ state: 'ok' }))
      .catch((error) => setBackend({ state: 'error', message: error.message }))
  }, [])

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-8 text-slate-900">
      <div className="space-y-3 text-center">
        <h1 className="flex items-center justify-center gap-3 text-4xl font-bold">
          <CalendarDays className="size-9 text-indigo-600" aria-hidden="true" />
          Week Planner
        </h1>
        <p className="text-slate-600">Planer tygodnia studenta z asystentem AI</p>
        <BackendStatus backend={backend} />
      </div>
    </main>
  )
}

function BackendStatus({ backend }) {
  if (backend.state === 'ok') {
    return <p className="font-medium text-emerald-600">Backend: połączono ✓</p>
  }
  if (backend.state === 'error') {
    return (
      <p className="font-medium text-red-600">
        Backend: brak połączenia ({backend.message})
      </p>
    )
  }
  return <p className="text-slate-500">Łączenie z backendem…</p>
}
