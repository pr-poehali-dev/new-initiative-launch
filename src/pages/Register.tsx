import { useState } from 'react'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import Icon from '@/components/ui/icon'

export default function Register() {
  const { login } = useAuth()
  const [tab, setTab] = useState<'register' | 'login'>('register')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [userNumber, setUserNumber] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      let data
      if (tab === 'register') {
        if (!name.trim() || password.length < 4) {
          setError('Введите имя и пароль (минимум 4 символа)')
          return
        }
        data = await api.register(name.trim(), password)
      } else {
        data = await api.login(parseInt(userNumber), password)
      }
      if (data.error) { setError(data.error); return }
      login({ user_id: data.user_id, user_number: data.user_number, name: data.name }, data.session_token)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-indigo-600/10 blur-[120px]" />
      </div>
      <motion.div
        className="relative w-full max-w-sm"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30">
            <Icon name="MessageCircle" size={30} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Мессенджер</h1>
          <p className="text-white/40 text-sm mt-1">Безопасное общение</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-white/5 rounded-2xl p-1 mb-6">
          {(['register', 'login'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === t ? 'bg-indigo-600 text-white shadow-sm' : 'text-white/40 hover:text-white/60'}`}>
              {t === 'register' ? 'Регистрация' : 'Вход'}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="space-y-3">
          {tab === 'register' ? (
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="Ваше имя"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 text-sm outline-none focus:border-indigo-500 transition-colors" />
          ) : (
            <input value={userNumber} onChange={e => setUserNumber(e.target.value)}
              placeholder="Ваш номер (например: 1000)"
              type="number"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 text-sm outline-none focus:border-indigo-500 transition-colors" />
          )}

          <div className="relative">
            <input value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              type={showPass ? 'text' : 'password'}
              placeholder="Пароль (минимум 4 символа)"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 pr-12 text-white placeholder-white/30 text-sm outline-none focus:border-indigo-500 transition-colors" />
            <button onClick={() => setShowPass(!showPass)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
              <Icon name={showPass ? 'EyeOff' : 'Eye'} size={16} />
            </button>
          </div>

          {error && (
            <motion.p className="text-red-400 text-xs px-1"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {error}
            </motion.p>
          )}

          <button onClick={handleSubmit} disabled={loading}
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Icon name="Loader2" size={18} className="animate-spin" /> : null}
            {tab === 'register' ? 'Создать аккаунт' : 'Войти'}
          </button>
        </div>

        <p className="text-white/20 text-xs text-center mt-6">
          {tab === 'register' ? 'Вам будет присвоен уникальный номер для общения' : 'Используйте номер и пароль, указанные при регистрации'}
        </p>
      </motion.div>
    </div>
  )
}
