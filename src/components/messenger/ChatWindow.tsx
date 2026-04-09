import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import Icon from '@/components/ui/icon'

interface Message {
  id: number
  sender_id: number
  content: string
  is_read: boolean
  created_at: string
}

interface Props {
  partnerId: number
  partnerName: string
  onBack: () => void
  onCallStart?: (callId: number, inviteToken: string) => void
}

export default function ChatWindow({ partnerId, partnerName, onBack, onCallStart }: Props) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    const data = await api.getMessages(partnerId)
    if (data.messages) setMessages(data.messages)
  }, [partnerId])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const id = setInterval(load, 3000)
    return () => clearInterval(id)
  }, [load])
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!text.trim() || sending) return
    const content = text.trim()
    setText('')
    setSending(true)
    await api.sendMessage(partnerId, content)
    await load()
    setSending(false)
  }

  const handleCall = async () => {
    const data = await api.startCall(partnerId)
    if (data.call_id && onCallStart) onCallStart(data.call_id, data.invite_token)
  }

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })

  const groupMessages = () => {
    const groups: { date: string; msgs: Message[] }[] = []
    messages.forEach(m => {
      const date = new Date(m.created_at).toLocaleDateString('ru', { day: 'numeric', month: 'long' })
      const last = groups[groups.length - 1]
      if (last && last.date === date) last.msgs.push(m)
      else groups.push({ date, msgs: [m] })
    })
    return groups
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 bg-[#12121a]">
        <button onClick={onBack} className="md:hidden text-white/50 hover:text-white mr-1">
          <Icon name="ChevronLeft" size={22} />
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
          {partnerName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="text-white text-sm font-semibold">{partnerName}</p>
          <p className="text-white/30 text-xs">В сети</p>
        </div>
        <button onClick={handleCall}
          className="w-9 h-9 rounded-full bg-white/5 hover:bg-indigo-600/20 flex items-center justify-center text-white/50 hover:text-indigo-400 transition-colors">
          <Icon name="Phone" size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {groupMessages().map(group => (
          <div key={group.date}>
            <div className="flex justify-center my-3">
              <span className="text-white/20 text-xs bg-white/5 px-3 py-1 rounded-full">{group.date}</span>
            </div>
            {group.msgs.map((msg, i) => {
              const isMine = msg.sender_id === user?.user_id
              const prev = group.msgs[i - 1]
              const showAvatar = !isMine && (!prev || prev.sender_id !== msg.sender_id)
              return (
                <motion.div key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'} mb-0.5`}>
                  {!isMine && <div className={`w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex-shrink-0 ${showAvatar ? 'opacity-100' : 'opacity-0'}`} />}
                  <div className={`max-w-[72%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed
                    ${isMine ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white/8 text-white/90 rounded-bl-sm'}`}>
                    {msg.content}
                    <span className={`text-[10px] ml-2 ${isMine ? 'text-indigo-200/60' : 'text-white/20'}`}>
                      {formatTime(msg.created_at)}
                      {isMine && <Icon name={msg.is_read ? 'CheckCheck' : 'Check'} size={10} className="inline ml-1" />}
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-white/8 flex items-end gap-2">
        <div className="flex-1 bg-white/6 border border-white/10 rounded-2xl px-4 py-2.5 min-h-[44px] flex items-center">
          <textarea value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Сообщение..."
            rows={1}
            className="flex-1 bg-transparent text-white placeholder-white/30 text-sm outline-none resize-none max-h-28" />
        </div>
        <button onClick={send} disabled={!text.trim() || sending}
          className="w-11 h-11 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 flex items-center justify-center transition-colors flex-shrink-0">
          <Icon name="Send" size={18} className="text-white" />
        </button>
      </div>
    </div>
  )
}
