import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import Icon from '@/components/ui/icon'

interface CallRecord {
  id: number
  caller_id: number
  callee_id: number | null
  status: string
  started_at: string | null
  ended_at: string | null
  invite_token: string
  caller_name: string
  caller_number: number
}

interface Props {
  onActiveCall: (callId: number, inviteToken: string) => void
}

export default function CallsPage({ onActiveCall }: Props) {
  const { user } = useAuth()
  const [calls, setCalls] = useState<CallRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [invite, setInvite] = useState<{ token: string; call_id: number } | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    api.getCalls().then(data => {
      if (data.calls) setCalls(data.calls)
      setLoading(false)
    })
  }, [])

  const handleGenInvite = async () => {
    const data = await api.createInvite()
    if (data.invite_token) {
      setInvite({ token: data.invite_token, call_id: data.call_id })
    }
  }

  const inviteUrl = invite ? `${window.location.origin}/call?token=${invite.token}` : ''

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'Присоединиться к звонку', url: inviteUrl })
    } else {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatDuration = (start: string, end: string | null) => {
    const s = new Date(start)
    const e = end ? new Date(end) : new Date()
    const sec = Math.floor((e.getTime() - s.getTime()) / 1000)
    const m = Math.floor(sec / 60)
    const ss = sec % 60
    return `${m}:${ss.toString().padStart(2, '0')}`
  }

  const statusLabel: Record<string, { label: string; color: string }> = {
    active: { label: 'Активный', color: 'text-emerald-400' },
    ended: { label: 'Завершён', color: 'text-white/30' },
    rejected: { label: 'Отклонён', color: 'text-red-400' },
    pending: { label: 'Ожидание', color: 'text-amber-400' },
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h2 className="text-white font-semibold text-base">Звонки</h2>
        <button onClick={handleGenInvite}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 text-xs font-medium transition-colors">
          <Icon name="Link" size={13} />
          Создать ссылку
        </button>
      </div>

      {/* Invite panel */}
      <AnimatePresence>
        {invite && (
          <motion.div
            className="mx-4 mb-3 bg-[#1a1a26] border border-indigo-500/20 rounded-2xl p-4"
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <div className="flex items-center gap-2 mb-3">
              <Icon name="Link2" size={15} className="text-indigo-400" />
              <span className="text-white text-sm font-medium">Ссылка для звонка</span>
              <button onClick={() => setInvite(null)} className="ml-auto text-white/30 hover:text-white/60">
                <Icon name="X" size={14} />
              </button>
            </div>
            <div className="bg-black/30 rounded-xl px-3 py-2 mb-3 flex items-center gap-2">
              <span className="text-white/40 text-xs font-mono truncate flex-1">{inviteUrl}</span>
              <button onClick={handleCopy} className="text-indigo-400 hover:text-indigo-300 flex-shrink-0">
                <Icon name={copied ? 'Check' : 'Copy'} size={14} />
              </button>
            </div>
            <button onClick={handleShare}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2">
              <Icon name="Share2" size={15} />
              Поделиться
            </button>
            <p className="text-white/20 text-[11px] text-center mt-2">
              Когда собеседник перейдёт по ссылке, вам поступит звонок
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Call history */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center mt-12"><Icon name="Loader2" size={24} className="animate-spin text-white/20" /></div>
        ) : !calls.length ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-8 text-center">
            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center">
              <Icon name="Phone" size={24} className="text-white/20" />
            </div>
            <p className="text-white/30 text-sm">История звонков пуста</p>
          </div>
        ) : (
          calls.map((c, i) => {
            const isCaller = c.caller_id === user?.user_id
            const s = statusLabel[c.status] || { label: c.status, color: 'text-white/30' }
            return (
              <motion.div key={c.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                  ${c.status === 'ended' ? 'bg-white/5' : c.status === 'active' ? 'bg-emerald-500/15' : 'bg-amber-500/10'}`}>
                  <Icon name={isCaller ? 'PhoneOutgoing' : 'PhoneIncoming'} size={16}
                    className={c.status === 'ended' ? 'text-white/30' : c.status === 'active' ? 'text-emerald-400' : 'text-amber-400'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{isCaller ? 'Исходящий' : c.caller_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs ${s.color}`}>{s.label}</span>
                    {c.started_at && (
                      <span className="text-white/20 text-xs">· {formatDuration(c.started_at, c.ended_at)}</span>
                    )}
                  </div>
                </div>
                {c.status === 'active' && (
                  <button onClick={() => onActiveCall(c.id, c.invite_token)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/30 transition-colors">
                    Войти
                  </button>
                )}
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}
