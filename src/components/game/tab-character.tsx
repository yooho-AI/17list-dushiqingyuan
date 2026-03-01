/**
 * [INPUT]: store.ts (useGameStore, PLAYER_STAT_METAS)
 * [OUTPUT]: 人物Tab — 立绘 + 属性 + 关系图 + 角色列表 + 全屏档案
 * [POS]: 三Tab之一，AppShell 路由渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  useGameStore, PLAYER_STAT_METAS,
} from '../../lib/store'

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

// ── Character Dossier (full-screen overlay) ──

function CharacterDossier({ charId, onClose }: { charId: string; onClose: () => void }) {
  const { characters, characterStats } = useGameStore()
  const [expanded, setExpanded] = useState(false)
  const char = characters[charId]
  const stats = characterStats[charId] ?? {}

  if (!char) return null

  return (
    <motion.div
      className={`${P}-dossier-overlay`}
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
  )
}

// ── Tab Character ──

export default function TabCharacter() {
  const {
    currentCharacter, characters, characterStats, playerStats,
    selectCharacter, setActiveTab,
  } = useGameStore()

  const [dossierCharId, setDossierCharId] = useState<string | null>(null)

  const char = currentCharacter ? characters[currentCharacter] : null
  const stats = currentCharacter ? (characterStats[currentCharacter] ?? {}) : {}

  return (
    <div className={`${P}-scrollbar`} style={{ height: '100%', overflowY: 'auto' }}>
      {/* Current Character Portrait */}
      {char ? (
        <div
          className={`${P}-portrait-hero`}
          onClick={() => setDossierCharId(char.id)}
        >
          <img
            src={char.portrait}
            alt={char.name}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <div className={`${P}-portrait-hero-overlay`}>
            <div style={{ fontSize: 20, fontWeight: 700, color: char.themeColor, letterSpacing: 2 }}>
              {char.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
              {char.title}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>👤</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>选择一位嘉宾查看详情</div>
        </div>
      )}

      {/* Current Char Stats */}
      {char && (
        <div style={{ padding: '0 12px' }}>
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
      )}

      {/* Player Stats */}
      <div style={{ padding: '12px 12px 0' }}>
        <div className={`${P}-neon-divider`} />
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 2, marginBottom: 8 }}>
          ✨ 我的属性
        </div>
        {PLAYER_STAT_METAS.map((meta, i) => (
          <StatBar
            key={meta.key}
            icon={meta.icon}
            label={meta.label}
            value={playerStats[meta.key as keyof typeof playerStats] ?? 0}
            color={meta.color}
            delay={i * 0.05}
          />
        ))}
      </div>

      {/* Relation Graph */}
      <div style={{ padding: '12px 12px 0' }}>
        <div className={`${P}-neon-divider`} />
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 2, marginBottom: 8 }}>
          💕 缘分关系
        </div>
        <RelationGraph />
      </div>

      {/* Relation List */}
      <div style={{ padding: '12px 12px 0' }}>
        <div className={`${P}-neon-divider`} />
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 2, marginBottom: 8 }}>
          👥 全部嘉宾
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Object.values(characters).map((c) => {
            const cStats = characterStats[c.id] ?? {}
            const aff = cStats.affection ?? 0
            const isActive = c.id === currentCharacter

            return (
              <div
                key={c.id}
                className={`${P}-relation-card ${isActive ? 'active' : ''}`}
                onClick={() => {
                  selectCharacter(c.id)
                  setActiveTab('dialogue')
                }}
              >
                <img
                  className={`${P}-relation-avatar`}
                  src={c.portrait}
                  alt={c.name}
                  style={{ borderColor: c.themeColor }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                <div className={`${P}-relation-info`}>
                  <div className={`${P}-relation-name`} style={{ color: c.themeColor }}>{c.name}</div>
                  <div className={`${P}-relation-label`}>{c.title}</div>
                </div>
                <div className={`${P}-relation-value`} style={{ color: c.themeColor }}>
                  💕 {aff}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ height: 24 }} />

      {/* Character Dossier */}
      <AnimatePresence>
        {dossierCharId && (
          <CharacterDossier
            charId={dossierCharId}
            onClose={() => setDossierCharId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
