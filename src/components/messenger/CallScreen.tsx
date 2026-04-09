import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import Icon from '@/components/ui/icon'

interface Props {
  callId: number
  callerName: string
  onEnd: () => void
  isIncoming?: boolean
}

export default function CallScreen({ callId, callerName, onEnd, isIncoming }: Props) {
  const [seconds, setSeconds] = useState(0)
  const [speakerMode, setSpeakerMode] = useState(false)
  const [muted, setMuted] = useState(false)
  const [accepted, setAccepted] = useState(!isIncoming)

  useEffect(() => {
    if (!accepted) return
    const id = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [accepted])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const ss = (s % 60).toString().padStart(2, '0')
    return `${m}:${ss}`
  }

  const handleAccept = async () => {
    await api.updateCall(callId, 'active')
    setAccepted(true)
  }

  const handleEnd = async () => {
    await api.updateCall(callId, 'ended')
    onEnd()
  }

  const handleReject = async () => {
    await api.updateCall(callId, 'rejected')
    onEnd()
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-[#0f0f13] flex flex-col items-center justify-between py-16 px-8"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Glow */}
      <div className={`absolute inset-0 pointer-events-none transition-all duration-1000 ${accepted ? 'opacity-100' : 'opacity-50'}`}>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-indigo-600/15 blur-[100px]" />
      </div>

      {/* Top */}
      <div className="relative flex flex-col items-center gap-4">
        {/* Pulse avatar */}
        <div className="relative">
          {accepted && (
            <>
              <motion.div className="absolute inset-0 rounded-full border-2 border-indigo-500/30"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2.5, repeat: Infinity }} />
              <motion.div className="absolute inset-0 rounded-full border border-indigo-500/20"
                animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }} />
            </>
          )}
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg shadow-indigo-500/30">
            {callerName.charAt(0).toUpperCase()}
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-white text-2xl font-bold">{callerName}</h2>
          {accepted ? (
            <p className="text-emerald-400 text-base mt-1 font-mono">{formatTime(seconds)}</p>
          ) : (
            <motion.p className="text-white/50 text-sm mt-1"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}>
              {isIncoming ? 'Входящий звонок...' : 'Вызов...'}
            </motion.p>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="relative flex flex-col items-center gap-8 w-full">
        {accepted && (
          <div className="flex gap-6">
            <button onClick={() => setMuted(!muted)}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all
                ${muted ? 'bg-red-500/20 text-red-400' : 'bg-white/8 text-white/60 hover:text-white'}`}>
              <Icon name={muted ? 'MicOff' : 'Mic'} size={22} />
            </button>
            <button onClick={() => setSpeakerMode(!speakerMode)}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all
                ${speakerMode ? 'bg-indigo-600/30 text-indigo-400' : 'bg-white/8 text-white/60 hover:text-white'}`}>
              <Icon name={speakerMode ? 'Volume2' : 'PhoneCall'} size={22} />
            </button>
          </div>
        )}

        {/* Call / End buttons */}
        {isIncoming && !accepted ? (
          <div className="flex gap-8">
            <button onClick={handleReject}
              className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30">
              <Icon name="PhoneOff" size={26} className="text-white" />
            </button>
            <button onClick={handleAccept}
              className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Icon name="Phone" size={26} className="text-white" />
            </button>
          </div>
        ) : (
          <button onClick={handleEnd}
            className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30">
            <Icon name="PhoneOff" size={26} className="text-white" />
          </button>
        )}

        {accepted && (
          <p className="text-white/20 text-xs text-center">
            {speakerMode ? 'Громкий режим включён' : 'Режим наушников'}
          </p>
        )}
      </div>
    </motion.div>
  )
}
