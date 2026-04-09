import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import ChatList from '@/components/messenger/ChatList'
import ChatWindow from '@/components/messenger/ChatWindow'
import ContactsPage from '@/components/messenger/ContactsPage'
import CallsPage from '@/components/messenger/CallsPage'
import CallScreen from '@/components/messenger/CallScreen'
import Icon from '@/components/ui/icon'

type Tab = 'messages' | 'calls' | 'contacts'

interface ActiveCall {
  callId: number
  inviteToken: string
  partnerName: string
  isIncoming?: boolean
}

export default function Messenger() {
  const { user, logout } = useAuth()
  const [tab, setTab] = useState<Tab>('messages')
  const [chat, setChat] = useState<{ id: number; name: string } | null>(null)
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null)
  const [chatRefresh, setChatRefresh] = useState(0)

  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: 'messages', icon: 'MessageCircle', label: 'Чаты' },
    { id: 'calls', icon: 'Phone', label: 'Звонки' },
    { id: 'contacts', icon: 'Users', label: 'Контакты' },
  ]

  const handleOpenChat = (id: number, name: string) => {
    setChat({ id, name })
    setTab('messages')
  }

  const handleCallStart = (callId: number, inviteToken: string, name = 'Собеседник') => {
    setActiveCall({ callId, inviteToken, partnerName: name, isIncoming: false })
  }

  const handleCallEnd = () => {
    setActiveCall(null)
    setChatRefresh(k => k + 1)
  }

  return (
    <div className="h-screen bg-[#0f0f13] flex flex-col overflow-hidden">
      {/* Active call overlay */}
      <AnimatePresence>
        {activeCall && (
          <CallScreen
            callId={activeCall.callId}
            callerName={activeCall.partnerName}
            isIncoming={activeCall.isIncoming}
            onEnd={handleCallEnd}
          />
        )}
      </AnimatePresence>

      {/* Main layout */}
      <div className="flex flex-col h-full">
        {/* Top bar */}
        <div className="px-4 pt-4 pb-2 flex items-center gap-3 border-b border-white/6">
          {chat ? (
            <div className="flex-1" /> // handled inside ChatWindow
          ) : (
            <>
              <div className="flex-1">
                <h1 className="text-white font-bold text-lg leading-none">Мессенджер</h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-indigo-400 text-xs font-mono font-bold">#{user?.user_number}</span>
                  <span className="text-white/30 text-xs">· {user?.name}</span>
                </div>
              </div>
              <button onClick={logout}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-red-500/10 flex items-center justify-center text-white/30 hover:text-red-400 transition-colors">
                <Icon name="LogOut" size={15} />
              </button>
            </>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {chat && tab === 'messages' ? (
              <motion.div key="chat" className="h-full"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <ChatWindow
                  partnerId={chat.id}
                  partnerName={chat.name}
                  onBack={() => setChat(null)}
                  onCallStart={(callId, token) => handleCallStart(callId, token, chat.name)}
                />
              </motion.div>
            ) : tab === 'messages' ? (
              <motion.div key="chatlist" className="h-full flex flex-col"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ChatList onSelect={(id, name) => setChat({ id, name })} selectedId={chat?.id} refreshKey={chatRefresh} />
              </motion.div>
            ) : tab === 'calls' ? (
              <motion.div key="calls" className="h-full flex flex-col"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <CallsPage onActiveCall={(callId, token) => handleCallStart(callId, token)} />
              </motion.div>
            ) : (
              <motion.div key="contacts" className="h-full flex flex-col"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ContactsPage
                  onChat={handleOpenChat}
                  onCall={async (partnerId) => {
                    const data = await import('@/lib/api').then(m => m.api.startCall(partnerId))
                    handleCallStart(data.call_id, data.invite_token)
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom nav */}
        <div className="border-t border-white/6 px-2 py-2 flex">
          {tabs.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setChat(null) }}
              className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all
                ${tab === t.id ? 'text-indigo-400' : 'text-white/25 hover:text-white/50'}`}>
              <Icon name={t.icon as never} size={20} fallback="Circle" />
              <span className="text-[10px] font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
