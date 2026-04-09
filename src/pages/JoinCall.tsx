import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { api } from '@/lib/api'
import CallScreen from '@/components/messenger/CallScreen'
import Icon from '@/components/ui/icon'

export default function JoinCall() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [info, setInfo] = useState<{ call_id: number; caller_name: string } | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [ended, setEnded] = useState(false)

  useEffect(() => {
    if (!token) { setError('Неверная ссылка'); setLoading(false); return }
    api.joinCall(token).then(data => {
      if (data.error) setError(data.error)
      else setInfo({ call_id: data.call_id, caller_name: data.caller_name })
      setLoading(false)
    })
  }, [token])

  if (loading) return (
    <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center">
      <Icon name="Loader2" size={32} className="animate-spin text-indigo-400" />
    </div>
  )

  if (error || ended) return (
    <div className="min-h-screen bg-[#0f0f13] flex flex-col items-center justify-center gap-4 text-center px-8">
      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
        <Icon name={ended ? 'PhoneOff' : 'AlertCircle'} size={28} className="text-white/30" />
      </div>
      <p className="text-white/50 text-base">{ended ? 'Звонок завершён' : error}</p>
    </div>
  )

  return (
    <AnimatePresence>
      {info && (
        <CallScreen
          callId={info.call_id}
          callerName={info.caller_name}
          isIncoming={true}
          onEnd={() => setEnded(true)}
        />
      )}
    </AnimatePresence>
  )
}
