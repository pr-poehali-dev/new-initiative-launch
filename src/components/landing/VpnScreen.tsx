import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Icon from '@/components/ui/icon'

interface VpnScreenProps {
  vpnKey: string
}

type Status = 'disconnected' | 'connecting' | 'connected'

export default function VpnScreen({ vpnKey }: VpnScreenProps) {
  const [status, setStatus] = useState<Status>('disconnected')
  const [seconds, setSeconds] = useState(0)

  const displayKey = vpnKey.length > 28 ? vpnKey.slice(0, 28) + '…' : vpnKey

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (status === 'connected') {
      interval = setInterval(() => setSeconds(s => s + 1), 1000)
    } else {
      setSeconds(0)
    }
    return () => clearInterval(interval)
  }, [status])

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, '0')
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${h}:${m}:${sec}`
  }

  const handleToggle = () => {
    if (status === 'disconnected') {
      setStatus('connecting')
      setTimeout(() => setStatus('connected'), 2200)
    } else if (status === 'connected') {
      setStatus('disconnected')
    }
  }

  const isConnected = status === 'connected'
  const isConnecting = status === 'connecting'

  return (
    <motion.div
      className="absolute inset-0 bg-[#080810] flex flex-col"
      initial={{ opacity: 0, scale: 1.04 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Top glow */}
      <div className={`absolute inset-0 pointer-events-none transition-all duration-1000 ${isConnected ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] rounded-full bg-[#6C3BFF]/15 blur-[80px]" />
      </div>

      {/* Header */}
      <div className="pt-16 pb-4 px-6 flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-bold tracking-tight">ПроЛаб</h1>
          <p className="text-white/30 text-xs tracking-widest uppercase">VPN</p>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all duration-500
          ${isConnected ? 'bg-emerald-500/15 text-emerald-400' : isConnecting ? 'bg-amber-500/15 text-amber-400' : 'bg-white/5 text-white/30'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : isConnecting ? 'bg-amber-400 animate-pulse' : 'bg-white/30'}`} />
          {isConnected ? 'Подключено' : isConnecting ? 'Подключение...' : 'Отключено'}
        </div>
      </div>

      {/* Key display */}
      <div className="mx-6 mb-6">
        <div className="bg-white/5 border border-white/8 rounded-2xl px-4 py-3 flex items-center gap-3">
          <Icon name="Key" size={14} className="text-[#6C3BFF] flex-shrink-0" />
          <span className="text-white/40 text-xs font-mono truncate">{displayKey}</span>
        </div>
      </div>

      {/* Main button area */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Timer */}
        <AnimatePresence>
          {isConnected && (
            <motion.div
              className="mb-8 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <p className="text-white/30 text-xs mb-1 uppercase tracking-widest">Время сессии</p>
              <p className="text-white text-3xl font-mono font-light">{formatTime(seconds)}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Power button */}
        <div className="relative flex items-center justify-center">
          {/* Outer pulse rings */}
          {isConnected && (
            <>
              <motion.div
                className="absolute w-56 h-56 rounded-full border border-[#6C3BFF]/20"
                animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute w-44 h-44 rounded-full border border-[#6C3BFF]/30"
                animate={{ scale: [1, 1.06, 1], opacity: [0.6, 0.1, 0.6] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              />
            </>
          )}

          {isConnecting && (
            <motion.div
              className="absolute w-44 h-44 rounded-full border-2 border-[#6C3BFF]/40"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              style={{ borderTopColor: '#6C3BFF' }}
            />
          )}

          {/* Button */}
          <motion.button
            onClick={handleToggle}
            className="relative w-36 h-36 rounded-full flex items-center justify-center cursor-pointer"
            whileTap={{ scale: 0.94 }}
            style={{
              background: isConnected
                ? 'linear-gradient(135deg, #6C3BFF 0%, #3B82F6 100%)'
                : 'rgba(255,255,255,0.05)',
              boxShadow: isConnected
                ? '0 0 60px rgba(108,59,255,0.5), 0 0 30px rgba(108,59,255,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
                : '0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
              transition: 'all 0.6s ease'
            }}
          >
            <motion.div
              animate={{ rotate: isConnected ? 0 : 0 }}
            >
              <Icon
                name="Power"
                size={52}
                className={`transition-colors duration-500 ${isConnected ? 'text-white' : 'text-white/30'}`}
              />
            </motion.div>
          </motion.button>
        </div>

        <motion.p
          className="mt-8 text-white/30 text-sm"
          animate={{ opacity: isConnecting ? [0.3, 1, 0.3] : 1 }}
          transition={{ duration: 1.2, repeat: isConnecting ? Infinity : 0 }}
        >
          {isConnected ? 'Нажмите для отключения' : isConnecting ? 'Установка соединения...' : 'Нажмите для подключения'}
        </motion.p>
      </div>

      {/* Stats bar */}
      <AnimatePresence>
        {isConnected && (
          <motion.div
            className="mx-6 mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4 }}
          >
            <div className="bg-white/5 border border-white/8 rounded-2xl px-6 py-4 grid grid-cols-3 divide-x divide-white/10">
              {[
                { label: 'Пинг', value: '24 мс', icon: 'Activity' },
                { label: 'Скорость', value: '↑ 12 ↓ 48', icon: 'Zap' },
                { label: 'Трафик', value: '2.4 ГБ', icon: 'Database' },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center px-2">
                  <Icon name={item.icon as never} size={14} className="text-[#6C3BFF] mb-1" fallback="Activity" />
                  <p className="text-white text-xs font-medium">{item.value}</p>
                  <p className="text-white/30 text-[10px] mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isConnected && !isConnecting && (
        <div className="mx-6 mb-10">
          <div className="bg-white/5 border border-white/8 rounded-2xl px-6 py-4 flex items-center justify-center gap-2">
            <Icon name="WifiOff" size={16} className="text-white/20" />
            <span className="text-white/20 text-sm">Соединение не установлено</span>
          </div>
        </div>
      )}
    </motion.div>
  )
}
