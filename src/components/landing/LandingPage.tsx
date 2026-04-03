import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import KeyScreen from './KeyScreen'
import VpnScreen from './VpnScreen'

export default function LandingPage() {
  const [screen, setScreen] = useState<'key' | 'vpn'>('key')
  const [vpnKey, setVpnKey] = useState('')

  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#080810] overflow-hidden">
      {/* Ambient glow background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[#6C3BFF]/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] rounded-full bg-[#3B82F6]/8 blur-[100px]" />
      </div>

      {/* Mobile frame */}
      <div className="relative w-[390px] h-[844px] rounded-[50px] overflow-hidden shadow-2xl border border-white/10"
        style={{ boxShadow: '0 0 80px rgba(108,59,255,0.25), 0 40px 80px rgba(0,0,0,0.8)' }}>
        {/* Status bar */}
        <div className="absolute top-0 left-0 right-0 z-50 px-8 pt-4 pb-2 flex justify-between items-center">
          <span className="text-white/60 text-xs font-medium">9:41</span>
          <div className="w-24 h-6 bg-black rounded-full mx-auto" />
          <div className="flex items-center gap-1">
            <span className="text-white/60 text-xs">●●●</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {screen === 'key' ? (
            <KeyScreen
              key="key"
              onSubmit={(k) => { setVpnKey(k); setScreen('vpn') }}
            />
          ) : (
            <VpnScreen
              key="vpn"
              vpnKey={vpnKey}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
