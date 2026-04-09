import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/lib/api'
import Icon from '@/components/ui/icon'

interface Contact {
  id: number
  alias: string
  user_number: number
  name: string
  contact_user_id?: number
}

interface Props {
  onChat: (partner_id: number, name: string) => void
  onCall: (partner_id: number) => void
}

export default function ContactsPage({ onChat, onCall }: Props) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [number, setNumber] = useState('')
  const [alias, setAlias] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    const data = await api.getContacts()
    if (data.contacts) setContacts(data.contacts)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    if (!number || !alias.trim()) { setError('Заполните все поля'); return }
    setAdding(true); setError('')
    const data = await api.addContact(parseInt(number), alias.trim())
    setAdding(false)
    if (data.error) { setError(data.error); return }
    setContacts(prev => [...prev.filter(c => c.user_number !== parseInt(number)), data])
    setShowAdd(false); setNumber(''); setAlias('')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h2 className="text-white font-semibold text-base">Контакты</h2>
        <button onClick={() => setShowAdd(true)}
          className="w-8 h-8 rounded-full bg-indigo-600/20 hover:bg-indigo-600/40 flex items-center justify-center text-indigo-400 transition-colors">
          <Icon name="UserPlus" size={16} />
        </button>
      </div>

      {/* Add Contact Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
            <motion.div
              className="w-full max-w-md bg-[#1a1a26] rounded-t-3xl p-6 pb-10"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28 }}>
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />
              <h3 className="text-white font-semibold text-lg mb-5">Добавить контакт</h3>
              <div className="space-y-3">
                <input value={number} onChange={e => setNumber(e.target.value)}
                  type="number" placeholder="Номер пользователя (например: 1001)"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-indigo-500" />
                <input value={alias} onChange={e => setAlias(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  placeholder="Название контакта"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-indigo-500" />
                {error && <p className="text-red-400 text-xs">{error}</p>}
                <button onClick={handleAdd} disabled={adding}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {adding && <Icon name="Loader2" size={16} className="animate-spin" />}
                  Добавить
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center mt-12"><Icon name="Loader2" size={24} className="animate-spin text-white/20" /></div>
        ) : !contacts.length ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-8 text-center">
            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center">
              <Icon name="Users" size={24} className="text-white/20" />
            </div>
            <p className="text-white/30 text-sm">Нет контактов.<br />Нажмите + чтобы добавить.</p>
          </div>
        ) : (
          contacts.map((c, i) => (
            <motion.div key={c.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                {c.alias.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">{c.alias}</p>
                <p className="text-white/30 text-xs">#{c.user_number} · {c.name}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => onChat(c.contact_user_id ?? c.id, c.alias)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-indigo-600/20 flex items-center justify-center text-white/40 hover:text-indigo-400 transition-colors">
                  <Icon name="MessageCircle" size={15} />
                </button>
                <button onClick={() => onCall(c.contact_user_id ?? c.id)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-emerald-600/20 flex items-center justify-center text-white/40 hover:text-emerald-400 transition-colors">
                  <Icon name="Phone" size={15} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}