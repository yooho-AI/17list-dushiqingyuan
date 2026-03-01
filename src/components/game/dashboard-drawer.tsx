/**
 * [INPUT]: store.ts (useGameStore)
 * [OUTPUT]: 恋爱手帐抽屉 — 扉页 + 缘分速览 + 场景网格 + 目标 + 属性 + 道具
 * [POS]: 左侧滑入抽屉，Reorder 拖拽排序
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useEffect } from 'react'
import { Reorder, useDragControls } from 'framer-motion'
import {
  useGameStore, PERIODS, SCENES, ITEMS, PLAYER_STAT_METAS,
  getCurrentChapter, MAX_WEEKS,
} from '../../lib/store'

const P = 'ds'
const STORAGE_KEY = 'ds-dash-order'

const DEFAULT_SECTIONS = ['affection', 'scenes', 'objectives', 'stats', 'items']

// ── Draggable Section Wrapper ──

function DraggableSection({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  const controls = useDragControls()

  return (
    <Reorder.Item value={id} dragListener={false} dragControls={controls}>
      <div className={`${P}-dash-section`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className={`${P}-dash-section-title`}>{title}</div>
          <div
            className={`${P}-dash-drag-handle`}
            onPointerDown={(e) => controls.start(e)}
          >
            ⋮⋮
          </div>
        </div>
        {children}
      </div>
    </Reorder.Item>
  )
}

// ── Dashboard Drawer ──

export default function DashboardDrawer() {
  const {
    playerName, currentWeek, currentPeriodIndex, actionPoints,
    characters, characterStats, playerStats,
    unlockedScenes, inventory,
    selectScene,
  } = useGameStore()

  const chapter = getCurrentChapter(currentWeek)
  const period = PERIODS[currentPeriodIndex]

  // Section order persistence
  const [sectionOrder, setSectionOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : DEFAULT_SECTIONS
    } catch {
      return DEFAULT_SECTIONS
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sectionOrder))
  }, [sectionOrder])

  // Sort characters by affection (descending)
  const sortedChars = Object.entries(characters)
    .map(([id, char]) => ({
      id,
      char,
      stats: characterStats[id] ?? {},
    }))
    .sort((a, b) => (b.stats.affection ?? 0) - (a.stats.affection ?? 0))

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'affection':
        return (
          <DraggableSection key={sectionId} id={sectionId} title="💕 缘分速览">
            {sortedChars.map(({ id, char, stats }) => (
              <div key={id} className={`${P}-dash-affection-item`}>
                <img
                  className={`${P}-dash-affection-avatar`}
                  src={char.portrait}
                  alt={char.name}
                  style={{ borderColor: char.themeColor }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                <div className={`${P}-dash-affection-info`}>
                  <div className={`${P}-dash-affection-name`} style={{ color: char.themeColor }}>
                    {char.name}
                  </div>
                  <div className={`${P}-dash-affection-bar`}>
                    <div
                      className={`${P}-dash-affection-fill`}
                      style={{
                        width: `${stats.affection ?? 0}%`,
                        background: char.themeColor,
                      }}
                    />
                  </div>
                </div>
                <div className={`${P}-dash-affection-value`}>{stats.affection ?? 0}</div>
              </div>
            ))}
          </DraggableSection>
        )

      case 'scenes':
        return (
          <DraggableSection key={sectionId} id={sectionId} title="🗺️ 约会场景">
            <div className={`${P}-dash-scene-grid`}>
              {Object.values(SCENES).map((scene) => {
                const unlocked = unlockedScenes.includes(scene.id)
                return (
                  <div
                    key={scene.id}
                    className={`${P}-dash-scene-thumb ${unlocked ? '' : 'locked'}`}
                    onClick={() => unlocked && selectScene(scene.id)}
                  >
                    <img
                      src={scene.background}
                      alt={scene.name}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                    <div className={`${P}-dash-scene-name`}>
                      {unlocked ? scene.icon + ' ' + scene.name : '🔒'}
                    </div>
                  </div>
                )
              })}
            </div>
          </DraggableSection>
        )

      case 'objectives':
        return (
          <DraggableSection key={sectionId} id={sectionId} title="🎯 恋爱目标">
            {chapter.objectives.map((obj, i) => (
              <div key={i} className={`${P}-dash-objective`}>
                <div className={`${P}-dash-objective-check`} />
                <span>{obj}</span>
              </div>
            ))}
          </DraggableSection>
        )

      case 'stats':
        return (
          <DraggableSection key={sectionId} id={sectionId} title="✨ 个人属性">
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {PLAYER_STAT_METAS.map((meta) => (
                <div key={meta.key} className={`${P}-dash-stat-pill`}>
                  <span>{meta.icon}</span>
                  <span>{meta.label}</span>
                  <span className={`${P}-dash-stat-pill-value`} style={{ color: meta.color }}>
                    {playerStats[meta.key as keyof typeof playerStats] ?? 0}
                  </span>
                </div>
              ))}
            </div>
          </DraggableSection>
        )

      case 'items':
        return (
          <DraggableSection key={sectionId} id={sectionId} title="🎁 背包">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {Object.entries(ITEMS).map(([itemId, item]) => {
                const count = inventory[itemId] ?? 0
                return (
                  <div
                    key={itemId}
                    className={`${P}-dash-stat-pill`}
                    style={{ opacity: count > 0 ? 1 : 0.3 }}
                  >
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                    <span className={`${P}-dash-stat-pill-value`}>×{count}</span>
                  </div>
                )
              })}
            </div>
          </DraggableSection>
        )

      default:
        return null
    }
  }

  return (
    <>
      {/* Fixed Front Page */}
      <div className={`${P}-dash-header`}>
        <div className={`${P}-dash-title`}>💕 恋爱手帐</div>
        <div className={`${P}-dash-meta`}>
          {playerName} · 第{currentWeek}/{MAX_WEEKS}周 · {period?.icon} {period?.name}
        </div>
        <div className={`${P}-dash-meta`} style={{ marginTop: 4 }}>
          第{chapter.id}章「{chapter.name}」 · ⚡ {actionPoints} AP
        </div>
      </div>

      {/* Scrollable Reorderable Sections */}
      <div className={`${P}-dash-scroll ${P}-scrollbar`}>
        <Reorder.Group
          axis="y"
          values={sectionOrder}
          onReorder={setSectionOrder}
          style={{ listStyle: 'none', padding: 0 }}
        >
          {sectionOrder.map(renderSection)}
        </Reorder.Group>
      </div>
    </>
  )
}
