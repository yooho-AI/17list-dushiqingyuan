/**
 * [INPUT]: store.ts (useGameStore), analytics, bgm
 * [OUTPUT]: 根组件: 开场三阶段(Splash→嘉宾闪切→角色创建) + GameScreen + EndingModal + MenuOverlay
 * [POS]: 应用入口，无 isMobile 分叉
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore, ENDINGS, STORY_INFO, buildCharacters } from './lib/store'
import { trackGameStart, trackGameContinue, trackPlayerCreate } from './lib/analytics'
import { useBgm } from './lib/bgm'
import AppShell from './components/game/app-shell'
import './styles/globals.css'
import './styles/opening.css'
import './styles/rich-cards.css'

const P = 'ds'

const RANDOM_NAMES = ['苏婉', '夏晴', '林悦', '陈思雨', '沈暮雪', '叶知秋', '温若初', '江念瑶']

const ENDING_TYPE_MAP: Record<string, { label: string; color: string; icon: string }> = {
  TE: { label: '挚爱圆满', color: '#ff6b8a', icon: '💕' },
  HE: { label: '自我成长', color: '#a78bfa', icon: '🌟' },
  BE: { label: '遗憾错过', color: '#64748b', icon: '💔' },
  NE: { label: '都市情缘', color: '#94a3b8', icon: '🌙' },
}

// ── Particles ──

function Particles() {
  const items = useMemo(() =>
    Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`,
      duration: `${4 + Math.random() * 4}s`,
      emoji: ['💕', '✨', '💗', '💖', '🌸'][Math.floor(Math.random() * 5)],
    })),
  [])

  return (
    <>
      {items.map((p) => (
        <span
          key={p.id}
          className={`${P}-particle`}
          style={{ left: p.left, animationDelay: p.delay, animationDuration: p.duration }}
        >
          {p.emoji}
        </span>
      ))}
    </>
  )
}

// ── Start Screen ──

function StartScreen() {
  const { setPlayerInfo, initGame, loadGame, hasSave } = useGameStore()
  const saved = hasSave()
  const { isPlaying, toggle: toggleBgm } = useBgm()
  const [phase, setPhase] = useState<'splash' | 'montage' | 'create'>('splash')
  const [name, setName] = useState('')
  const [montageIndex, setMontageIndex] = useState(0)

  const allChars = useMemo(() => Object.values(buildCharacters()), [])

  // Montage auto-advance
  useEffect(() => {
    if (phase !== 'montage') return
    if (montageIndex >= allChars.length) {
      setPhase('create')
      return
    }
    const timer = setTimeout(() => setMontageIndex((i) => i + 1), 1800)
    return () => clearTimeout(timer)
  }, [phase, montageIndex, allChars.length])

  const handleStart = useCallback(() => {
    trackGameStart()
    setPhase('montage')
  }, [])

  const handleContinue = useCallback(() => {
    trackGameContinue()
    loadGame()
  }, [loadGame])

  const handleCreate = useCallback(() => {
    const finalName = name.trim() || RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)]
    setPlayerInfo(finalName)
    trackPlayerCreate(finalName)
    initGame()
  }, [name, setPlayerInfo, initGame])

  const randomName = useCallback(() => {
    setName(RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)])
  }, [])

  return (
    <div className={`${P}-start`}>
      {/* Phase 1: Splash */}
      <AnimatePresence>
        {phase === 'splash' && (
          <motion.div
            className={`${P}-splash`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Particles />
            <div className={`${P}-splash-logo`}>
              <div className={`${P}-splash-icon`}>💕</div>
            </div>
            <div className={`${P}-splash-title`}>{STORY_INFO.title}</div>
            <div className={`${P}-splash-subtitle`}>{STORY_INFO.subtitle}</div>
            <div className={`${P}-splash-tagline`}>
              化身都市独立女性<br />在心动与合适之间寻找答案
            </div>
            <button className={`${P}-start-cta`} onClick={handleStart}>
              开启缘分
            </button>
            {saved && (
              <button className={`${P}-continue-btn`} onClick={handleContinue}>
                继续旅程
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase 2: Montage */}
      <AnimatePresence>
        {phase === 'montage' && montageIndex < allChars.length && (
          <motion.div className={`${P}-montage`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={allChars[montageIndex].id}
                className={`${P}-montage-card`}
                initial={{ opacity: 0, x: montageIndex % 2 === 0 ? -80 : 80 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: montageIndex % 2 === 0 ? 80 : -80 }}
                transition={{ duration: 0.5 }}
              >
                <img
                  src={allChars[montageIndex].portrait}
                  alt={allChars[montageIndex].name}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                <div className={`${P}-montage-card-overlay`}>
                  <div
                    className={`${P}-montage-card-name`}
                    style={{ color: allChars[montageIndex].themeColor }}
                  >
                    {allChars[montageIndex].name}
                  </div>
                  <div className={`${P}-montage-card-title`}>
                    {allChars[montageIndex].title}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
            <button className={`${P}-skip-btn`} onClick={() => setPhase('create')}>
              跳过
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase 3: Create */}
      <AnimatePresence>
        {phase === 'create' && (
          <motion.div
            className={`${P}-create`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className={`${P}-create-title`}>创建角色</div>
            <div className={`${P}-create-desc`}>
              你是一位生活在繁华都市的独立女性<br />
              准备在缘起APP开启一段新的旅程
            </div>
            <div className={`${P}-create-label`}>你的名字</div>
            <input
              className={`${P}-create-input`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入你的名字"
              maxLength={8}
              autoFocus
            />
            <button className={`${P}-create-random`} onClick={randomName}>
              🎲 随机名字
            </button>
            <button
              className={`${P}-create-start`}
              onClick={handleCreate}
            >
              进入都市
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Music bar */}
      <div
        className={`${P}-music-bar ${isPlaying ? '' : 'paused'}`}
        onClick={toggleBgm}
      >
        <span /><span /><span /><span />
      </div>
    </div>
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
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 24 }}>
            {ending.description}
          </p>
          <button
            className={`${P}-start-cta`}
            style={{ animationName: 'none' }}
            onClick={() => { clearSave(); resetGame() }}
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

  if (!gameStarted) return <StartScreen />

  return (
    <>
      <AppShell />
      <EndingModal />
    </>
  )
}
