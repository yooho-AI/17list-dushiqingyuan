/**
 * [INPUT]: store.ts (useGameStore, PLAYER_STAT_METAS, getAvailableCharacters, getStatLevel)
 * [OUTPUT]: 人物Tab -- 2x2角色网格(聊天按钮+mini好感条) + SVG关系图 + CharacterDossier overlay+sheet + CharacterChat
 * [POS]: 三Tab之一，AppShell 路由渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChatCircleDots } from '@phosphor-icons/react'
import {
  useGameStore, getAvailableCharacters, getStatLevel,
} from '../../lib/store'
import CharacterChat from './character-chat'

const P = 'ds'

// ── Stat Bar ──

function StatBar({ icon, label, value, color, delay = 0 }: {
  icon: string; label: string; value: number; color: string; delay?: number
}) {
  return (
    <div className={`${P}-stat-bar`}>
      <div className={`${P}-stat-bar-label`}>
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <div className={`${P}-stat-bar-track`}>
        <motion.div
          className={`${P}-stat-bar-fill`}
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(value, 100)}%` }}
          transition={{ duration: 0.6, ease: 'easeOut', delay }}
        />
      </div>
      <div className={`${P}-stat-bar-value`} style={{ color }}>{value}</div>
    </div>
  )
}

// ── SVG Relation Graph ──

function RelationGraph() {
  const { characters, characterStats, selectCharacter, setActiveTab } = useGameStore()
  const entries = Object.entries(characters)

  const W = 380, H = 300
  const CX = W / 2, CY = H / 2
  const R = 105
  const NODE_R = 22

  const getLevel = (aff: number) => {
    if (aff >= 80) return { label: '心动', color: '#ff6b8a' }
    if (aff >= 60) return { label: '亲密', color: '#f472b6' }
    if (aff >= 40) return { label: '好感', color: '#a78bfa' }
    if (aff >= 20) return { label: '认识', color: '#64748b' }
    return { label: '陌生', color: '#475569' }
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={`${P}-relation-graph`}>
      {/* Center node */}
      <circle cx={CX} cy={CY} r={28} fill="rgba(255,107,138,0.15)" stroke="#ff6b8a" strokeWidth={2} />
      <text x={CX} y={CY + 5} textAnchor="middle" fill="#ff6b8a" fontSize={14} fontWeight={700}>我</text>

      {entries.map(([id, char], i) => {
        const angle = (2 * Math.PI * i / entries.length) - Math.PI / 2
        const x = CX + R * Math.cos(angle)
        const y = CY + R * Math.sin(angle)
        const aff = characterStats[id]?.affection ?? 0
        const level = getLevel(aff)

        return (
          <g
            key={id}
            onClick={() => { selectCharacter(id); setActiveTab('character') }}
            style={{ cursor: 'pointer' }}
          >
            {/* Connection line */}
            <line
              x1={CX} y1={CY} x2={x} y2={y}
              stroke={level.color} strokeWidth={1.5} strokeOpacity={0.4}
            />
            {/* Relation label on line */}
            <text
              x={(CX + x) / 2} y={(CY + y) / 2 - 6}
              textAnchor="middle" fill={level.color}
              fontSize={8} fontWeight={500}
            >
              {level.label}
            </text>

            {/* NPC node */}
            <circle cx={x} cy={y} r={NODE_R} fill="rgba(0,0,0,0.4)" stroke={char.themeColor} strokeWidth={2} />
            <clipPath id={`clip-${id}`}>
              <circle cx={x} cy={y} r={NODE_R - 2} />
            </clipPath>
            <image
              href={char.portrait}
              x={x - NODE_R + 2} y={y - NODE_R + 2}
              width={(NODE_R - 2) * 2} height={(NODE_R - 2) * 2}
              clipPath={`url(#clip-${id})`}
              preserveAspectRatio="xMidYMid slice"
            />

            {/* Name */}
            <text
              x={x} y={y + NODE_R + 12}
              textAnchor="middle" fill="var(--text-primary)"
              fontSize={10} fontWeight={500}
            >
              {char.name}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ── Character Dossier (overlay + sheet) ──

function CharacterDossier({ charId, onClose }: { charId: string; onClose: () => void }) {
  const { characters, characterStats } = useGameStore()
  const [expanded, setExpanded] = useState(false)
  const char = characters[charId]
  const stats = characterStats[charId] ?? {}

  if (!char) return null

  const aff = stats.affection ?? 0
  const level = getStatLevel(aff)

  return (
    <>
      <motion.div
        className={`${P}-dossier-overlay`}
        style={{ background: 'rgba(0,0,0,0.5)', overflow: 'visible' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className={`${P}-record-sheet`}
        style={{ zIndex: 52, overflowY: 'auto' }}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      >
        {/* Portrait */}
        <div className={`${P}-dossier-portrait`}>
          <motion.img
            src={char.portrait}
            alt={char.name}
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <div className={`${P}-dossier-portrait-fade`} />
          <button className={`${P}-dossier-close`} onClick={onClose}>✕</button>
        </div>

        {/* Content */}
        <div className={`${P}-dossier-content`}>
          <div className={`${P}-dossier-name`} style={{ color: char.themeColor }}>
            {char.name}
          </div>
          <div className={`${P}-dossier-title-text`}>{char.title}</div>
          <div className={`${P}-dossier-desc`}>{char.description}</div>

          {/* Affection stage */}
          <div style={{
            display: 'inline-block', padding: '2px 10px', borderRadius: 12,
            background: `${char.themeColor}20`, color: char.themeColor,
            fontSize: 12, fontWeight: 600, marginBottom: 12,
          }}>
            {level.name} · 好感 {aff}/100
          </div>

          {/* Tags */}
          <div className={`${P}-dossier-tags`}>
            <span className={`${P}-dossier-tag`}>{char.gender === 'male' ? '♂' : '♀'} {char.age}岁</span>
            <span className={`${P}-dossier-tag`}>{char.title}</span>
          </div>

          {/* Stat bars */}
          <div className={`${P}-dossier-section`}>
            <div className={`${P}-dossier-section-title`}>💕 好感数据</div>
            {char.statMetas.map((meta, i) => (
              <StatBar
                key={meta.key}
                icon={meta.icon}
                label={meta.label}
                value={stats[meta.key] ?? 0}
                color={meta.color}
                delay={i * 0.1}
              />
            ))}
          </div>

          {/* Personality (expandable) */}
          <div className={`${P}-dossier-section`}>
            <div
              className={`${P}-dossier-expandable`}
              onClick={() => setExpanded(!expanded)}
            >
              <div className={`${P}-dossier-section-title`}>
                🎭 性格特质 {expanded ? '▲' : '▼'}
              </div>
            </div>
            <AnimatePresence>
              {expanded && (
                <motion.div
                  className={`${P}-dossier-expandable-content`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    {char.personality}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                    说话风格：{char.speakingStyle}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Trigger hints */}
          <div className={`${P}-dossier-section`}>
            <div className={`${P}-dossier-section-title`}>💡 接近提示</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.8 }}>
              {char.triggerPoints.slice(0, 3).map((tp, i) => (
                <div key={i}>• {tp}</div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}

// ── Tab Character ──

export default function TabCharacter() {
  const {
    currentCharacter, characters, characterStats,
    selectCharacter, currentWeek,
  } = useGameStore()

  const [dossierCharId, setDossierCharId] = useState<string | null>(null)
  const [chatChar, setChatChar] = useState<string | null>(null)
  const available = getAvailableCharacters(currentWeek, characters)

  const handleCharClick = (id: string) => {
    selectCharacter(id)
    setDossierCharId(id)
  }

  return (
    <div className={`${P}-scrollbar`} style={{ height: '100%', overflowY: 'auto', padding: 12 }}>
      {/* ── 角色网格 (2x2) ── */}
      <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, paddingLeft: 4 }}>
        👥 全部嘉宾
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
        {Object.entries(available).map(([id, char]) => {
          const stats = characterStats[id] ?? {}
          const aff = stats.affection ?? 0
          const level = getStatLevel(aff)
          return (
            <button
              key={id}
              onClick={() => handleCharClick(id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: 10, borderRadius: 12,
                background: currentCharacter === id ? `${char.themeColor}15` : 'var(--bg-card)',
                border: `1px solid ${currentCharacter === id ? char.themeColor + '44' : 'rgba(255,107,138,0.1)'}`,
                cursor: 'pointer', transition: 'all 0.2s',
                position: 'relative',
              }}
            >
              {/* 聊天按钮 */}
              <div
                onClick={(e) => { e.stopPropagation(); setChatChar(id) }}
                style={{
                  position: 'absolute', top: 6, left: 6,
                  width: 28, height: 28, borderRadius: '50%',
                  background: `${char.themeColor}18`,
                  border: `1px solid ${char.themeColor}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', zIndex: 1,
                }}
              >
                <ChatCircleDots size={16} weight="fill" color={char.themeColor} />
              </div>
              <img
                src={char.portrait}
                alt={char.name}
                style={{
                  width: 56, height: 56, borderRadius: '50%',
                  objectFit: 'cover', objectPosition: 'center top',
                  border: `2px solid ${char.themeColor}44`,
                  marginBottom: 6,
                }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
              <span style={{ fontSize: 12, fontWeight: 500, color: char.themeColor }}>
                {char.name}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                {char.title}
              </span>
              {/* Mini affection bar */}
              <div style={{ width: '80%', height: 3, borderRadius: 2, background: 'rgba(255,107,138,0.1)' }}>
                <div style={{
                  height: '100%', borderRadius: 2, background: char.themeColor,
                  width: `${Math.min(aff, 100)}%`, transition: 'width 0.5s ease',
                }} />
              </div>
              <span style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
                {level.name} {aff}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── 关系图 ── */}
      <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, paddingLeft: 4 }}>
        💕 缘分关系
      </h4>
      <div style={{
        padding: 12, borderRadius: 16, background: 'var(--bg-card)',
        border: '1px solid rgba(255,107,138,0.1)', marginBottom: 20,
      }}>
        <RelationGraph />
      </div>

      <div style={{ height: 16 }} />

      {/* Character Dossier */}
      <AnimatePresence>
        {dossierCharId && (
          <CharacterDossier
            charId={dossierCharId}
            onClose={() => setDossierCharId(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Character Chat ── */}
      <AnimatePresence>
        {chatChar && characters[chatChar] && (
          <CharacterChat charId={chatChar} onClose={() => setChatChar(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
