import { useState } from 'react'
import { motion } from 'framer-motion'
import Icon from '@/components/ui/icon'

interface KeyScreenProps {
  onSubmit: (key: string) => void
}

export default function KeyScreen({ onSubmit }: KeyScreenProps) {
  const [key, setKey] = useState('')
  const [focused, setFocused] = useState(false)
  const [error, setError] = useState(false)

  const handleSubmit = () => {
    if (key.trim().length < 6) {
      setError(true)
      setTimeout(() => setError(false), 800)
      return
    }
    onSubmit(key.trim())
  }

  return (
    <motion.div
      className="absolute inset-0 bg-[#080810] flex flex-col items-center justify-center px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
    >
      {/* Logo */}
      <motion.div
        className="mb-12 flex flex-col items-center"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className="w-20 h-20 rounded-3xl mb-5 flex items-center justify-center relative"
          style={{ background: 'linear-gradient(135deg, #6C3BFF 0%, #3B82F6 100%)', boxShadow: '0 0 40px rgba(108,59,255,0.5)' }}>
          <Icon name="Shield" size={38} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">ПроЛаб</h1>
        <p className="text-white/40 text-sm mt-1 tracking-widest uppercase">VPN</p>
      </motion.div>

      {/* Input block */}
      <motion.div
        className="w-full"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.25 }}
      >
        <p className="text-white/60 text-sm mb-3 ml-1">Введите ключ доступа</p>
        <motion.div
          className="relative"
          animate={error ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          <div className={`relative flex items-center rounded-2xl border transition-all duration-300 overflow-hidden
            ${focused ? 'border-[#6C3BFF] shadow-[0_0_20px_rgba(108,59,255,0.3)]' : 'border-white/10'}
            ${error ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : ''}
            bg-white/5`}>
            <Icon name="Key" size={18} className={`absolute left-4 transition-colors ${focused ? 'text-[#6C3BFF]' : 'text-white/30'}`} />
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="vless://xxxxxxxx-xxxx..."
              className="w-full bg-transparent text-white placeholder-white/20 text-sm py-4 pl-11 pr-4 outline-none font-mono"
            />
          </div>
        </motion.div>

        {error && (
          <motion.p
            className="text-red-400 text-xs mt-2 ml-1"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Введите корректный ключ подключения
          </motion.p>
        )}

        <motion.button
          onClick={handleSubmit}
          className="w-full mt-4 py-4 rounded-2xl text-white font-semibold text-base relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #6C3BFF 0%, #3B82F6 100%)' }}
          whileTap={{ scale: 0.97 }}
          whileHover={{ boxShadow: '0 0 30px rgba(108,59,255,0.5)' }}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            Подключить
            <Icon name="ArrowRight" size={18} />
          </span>
        </motion.button>
      </motion.div>

      {/* Bottom hint */}
      <motion.p
        className="text-white/20 text-xs text-center mt-10 leading-relaxed"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        Ключ предоставляется администратором.{'\n'}Обратитесь в поддержку для получения доступа.
      </motion.p>
    </motion.div>
  )
}
