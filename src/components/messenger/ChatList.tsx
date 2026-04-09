import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import Icon from '@/components/ui/icon'

interface Chat {
  partner_id: number
  last_message: string
  last_at: string
  is_mine: boolean
  name: string
  user_number: number
  unread: number
}

interface Props {
  onSelect: (partner_id: number, name: string) => void
  selectedId?: number
  refreshKey?: number
}

export default function ChatList({ onSelect, selectedId, refreshKey }: Props) {
  const { user } = useAuth()
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const data = await api.getChats()
    if (data.chats) setChats(data.chats)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load, refreshKey])
  useEffect(() => {
    const id = setInterval(load, 4000)
    return () => clearInterval(id)
  }, [load])

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString('ru', { day: 'numeric', month: 'short' })
  }

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <Icon name="Loader2" size={24} className="animate-spin text-white/30" />
    </div>
  )

  if (!chats.length) return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-8 gap-3">
      <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center">
        <Icon name="MessageCircle" size={24} className="text-white/20" />
      </div>
      <p className="text-white/30 text-sm">Пока нет сообщений.<br />Начните переписку из контактов.</p>
    </div>
  )

  return (
    <div className="flex-1 overflow-y-auto">
      {chats.map((chat, i) => (
        <motion.button key={chat.partner_id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.04 }}
          onClick={() => onSelect(chat.partner_id, chat.name)}
          className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors text-left
            ${selectedId === chat.partner_id ? 'bg-indigo-600/10 border-r-2 border-indigo-500' : ''}`}>
          <div className="relative flex-shrink-0">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-base">
              {chat.name.charAt(0).toUpperCase()}
            </div>
            {chat.unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-indigo-500 text-white text-[9px] flex items-center justify-center font-bold">
                {chat.unread > 9 ? '9+' : chat.unread}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline">
              <span className="text-white text-sm font-medium truncate">{chat.name}</span>
              <span className="text-white/30 text-[11px] flex-shrink-0 ml-2">{formatTime(chat.last_at)}</span>
            </div>
            <p className={`text-xs truncate mt-0.5 ${chat.unread > 0 ? 'text-white/70' : 'text-white/30'}`}>
              {chat.is_mine && <span className="text-indigo-400">Вы: </span>}{chat.last_message}
            </p>
          </div>
        </motion.button>
      ))}
    </div>
  )
}
