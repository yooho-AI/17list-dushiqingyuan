/**
 * [INPUT]: opening-data.ts (PROLOGUE), store.ts (buildCharacters)
 * [OUTPUT]: 序幕组件: 缘起APP聊天 → 嘉宾速览 → 个人资料
 * [POS]: 封面与正片之间的世界观建立 + 玩家名字采集
 * [PROTOCOL]: ★ 种子文件，变更时更新此头部
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PROLOGUE } from '@/lib/opening-data'
import { buildCharacters } from '@/lib/store'

interface PrologueProps {
  onComplete: (playerName: string) => void
}

export default function ProloguePage({ onComplete }: PrologueProps) {
  const [phase, setPhase] = useState<'chat' | 'profiles' | 'setup'>('chat')
  const [msgIndex, setMsgIndex] = useState(0)
  const [chatDone, setChatDone] = useState(false)
  const [profileIndex, setProfileIndex] = useState(0)
  const [name, setName] = useState('')

  const allChars = useMemo(() => Object.values(buildCharacters()), [])

  // Chat auto-advance
  useEffect(() => {
    if (phase !== 'chat' || chatDone) return
    if (msgIndex >= PROLOGUE.chatMessages.length) {
      setChatDone(true)
      return
    }
    const delay = msgIndex === 0 ? 800 : 1200
    const timer = setTimeout(() => setMsgIndex((i) => i + 1), delay)
    return () => clearTimeout(timer)
  }, [phase, msgIndex, chatDone])

  // Profiles auto-advance
  useEffect(() => {
    if (phase !== 'profiles') return
    if (profileIndex >= allChars.length) {
      setPhase('setup')
      return
    }
    const timer = setTimeout(() => setProfileIndex((i) => i + 1), 1500)
    return () => clearTimeout(timer)
  }, [phase, profileIndex, allChars.length])

  const handleSubmit = useCallback(() => {
    const finalName =
      name.trim() ||
      PROLOGUE.randomNames[Math.floor(Math.random() * PROLOGUE.randomNames.length)]
    onComplete(finalName)
  }, [name, onComplete])

  // ── Phase 1: 缘起APP 聊天 ──

  if (phase === 'chat') {
    return (
      <div className="ds-chat">
        <button className="ds-skip-pro" onClick={() => setPhase('setup')}>
          跳过 ›
        </button>

        {/* App header */}
        <div className="ds-chat-header">
          <div className="ds-chat-avatar">💕</div>
          <div className="ds-chat-header-info">
            <div className="ds-chat-header-name">缘起小助手</div>
            <div className="ds-chat-header-status">在线</div>
          </div>
        </div>

        {/* Messages */}
        <div className="ds-chat-body">
          <AnimatePresence>
            {PROLOGUE.chatMessages.slice(0, msgIndex).map((msg, i) => (
              <motion.div
                key={i}
                className={`ds-chat-bubble ${msg.highlight ? 'highlight' : ''}`}
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 380, damping: 25 }}
              >
                {msg.text}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {!chatDone && msgIndex < PROLOGUE.chatMessages.length && (
            <div className="ds-chat-typing">
              <span />
              <span />
              <span />
            </div>
          )}
        </div>

        {/* CTA */}
        <AnimatePresence>
          {chatDone && (
            <motion.div
              className="ds-chat-cta-area"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <button className="ds-chat-cta" onClick={() => setPhase('profiles')}>
                查看推荐嘉宾
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // ── Phase 2: 嘉宾速览 ──

  if (phase === 'profiles') {
    return (
      <div className="ds-profiles">
        <button className="ds-skip-pro" onClick={() => setPhase('setup')}>
          跳过 ›
        </button>

        <div className="ds-profiles-title">今日推荐</div>

        <AnimatePresence mode="wait">
          {profileIndex < allChars.length && (
            <motion.div
              key={allChars[profileIndex].id}
              className="ds-profiles-card"
              initial={{ opacity: 0, x: profileIndex % 2 === 0 ? -60 : 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: profileIndex % 2 === 0 ? 60 : -60 }}
              transition={{ duration: 0.4 }}
            >
              <img
                className="ds-profiles-card-img"
                src={allChars[profileIndex].portrait}
                alt={allChars[profileIndex].name}
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = 'none'
                }}
              />
              <div className="ds-profiles-card-overlay">
                <div
                  className="ds-profiles-card-name"
                  style={{ color: allChars[profileIndex].themeColor }}
                >
                  {allChars[profileIndex].name}
                </div>
                <div className="ds-profiles-card-title">{allChars[profileIndex].title}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress dots */}
        <div className="ds-profiles-dots">
          {allChars.map((_, i) => (
            <span
              key={i}
              className={`ds-profiles-dot ${i <= profileIndex ? 'active' : ''}`}
            />
          ))}
        </div>
      </div>
    )
  }

  // ── Phase 3: 个人资料 ──

  return (
    <div className="ds-setup">
      <motion.div
        className="ds-setup-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="ds-setup-icon">💕</div>
        <div className="ds-setup-title">完善个人资料</div>
        <div className="ds-setup-desc">
          你是一位生活在繁华都市的独立女性
          <br />
          准备在缘起APP开启一段新的旅程
        </div>
        <div className="ds-setup-label">{PROLOGUE.nameInput.label}</div>
        <input
          className="ds-setup-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={PROLOGUE.nameInput.placeholder}
          maxLength={PROLOGUE.nameInput.maxLength}
          autoFocus
        />
        <button
          className="ds-setup-random"
          onClick={() => {
            setName(
              PROLOGUE.randomNames[Math.floor(Math.random() * PROLOGUE.randomNames.length)]
            )
          }}
        >
          🎲 随机名字
        </button>
        <button className="ds-setup-cta" onClick={handleSubmit}>
          {PROLOGUE.nameInput.ctaText}
        </button>
      </motion.div>
    </div>
  )
}
