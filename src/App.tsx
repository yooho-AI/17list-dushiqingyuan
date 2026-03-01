/**
 * [INPUT]: store.ts (useGameStore), analytics, CoverPage, ProloguePage
 * [OUTPUT]: 根组件: 封面(Cover) → 序幕(Prologue) → GameScreen + EndingModal
 * [POS]: 应用入口，无 isMobile 分叉
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore, ENDINGS } from './lib/store'
import { trackGameStart, trackGameContinue, trackPlayerCreate } from './lib/analytics'
import CoverPage from '@/components/opening/CoverPage'
import ProloguePage from '@/components/opening/ProloguePage'
import AppShell from './components/game/app-shell'
import './styles/cover.css'
import './styles/prologue.css'
import './styles/globals.css'
import './styles/rich-cards.css'

const P = 'ds'

const ENDING_TYPE_MAP: Record<string, { label: string; color: string; icon: string }> = {
  TE: { label: '挚爱圆满', color: '#ff6b8a', icon: '💕' },
  HE: { label: '自我成长', color: '#a78bfa', icon: '🌟' },
  BE: { label: '遗憾错过', color: '#64748b', icon: '💔' },
  NE: { label: '都市情缘', color: '#94a3b8', icon: '🌙' },
}

// ── Opening Screen ──

function OpeningScreen() {
  const { setPlayerInfo, initGame, loadGame, hasSave } = useGameStore()
  const saved = hasSave()
  const [phase, setPhase] = useState<'cover' | 'prologue'>('cover')

  const handleContinue = useCallback(() => {
    trackGameContinue()
    loadGame()
  }, [loadGame])

  if (phase === 'cover') {
    return (
      <CoverPage
        hasSave={saved}
        onNewGame={() => setPhase('prologue')}
        onContinue={handleContinue}
      />
    )
  }

  return (
    <ProloguePage
      onComplete={(name) => {
        trackGameStart()
        trackPlayerCreate(name)
        setPlayerInfo(name)
        initGame()
      }}
    />
  )
}

// ── Ending Modal ──

function EndingModal() {
  const { endingType, resetGame, clearSave } = useGameStore()
  if (!endingType) return null

  const ending = ENDINGS.find((e) => e.id === endingType)
  if (!ending) return null
  const meta = ENDING_TYPE_MAP[ending.type] ?? ENDING_TYPE_MAP.NE

  return (
    <AnimatePresence>
      <motion.div
        className={`${P}-ending-overlay`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className={`${P}-ending-modal`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>{meta.icon}</div>
          <div
            style={{
              display: 'inline-block',
              padding: '4px 16px',
              background: `${meta.color}20`,
              color: meta.color,
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: 2,
              marginBottom: 16,
            }}
          >
            {meta.label}
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, letterSpacing: 2 }}>
            {ending.name}
          </h2>
          <p
            style={{
              fontSize: 14,
              color: 'var(--text-secondary)',
              lineHeight: 1.8,
              marginBottom: 24,
            }}
          >
            {ending.description}
          </p>
          <button
            className={`${P}-ending-restart`}
            onClick={() => {
              clearSave()
              resetGame()
            }}
          >
            重新开始
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── App Root ──

export default function App() {
  const { gameStarted } = useGameStore()

  if (!gameStarted) return <OpeningScreen />

  return (
    <>
      <AppShell />
      <EndingModal />
    </>
  )
}
