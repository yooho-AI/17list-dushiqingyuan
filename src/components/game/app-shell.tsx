/**
 * [INPUT]: store.ts (useGameStore), tab components, dashboard, bgm
 * [OUTPUT]: 唯一布局壳 — Header + TabContent + TabBar + 三向手势 + 抽屉
 * [POS]: components/game 的布局入口，零 isMobile 分叉
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useRef, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  useGameStore, PERIODS, STORY_INFO,
  getCurrentChapter, MAX_WEEKS,
} from '../../lib/store'
import { useBgm } from '../../lib/bgm'
import {
  MapTrifold, ChatCircleDots, Users,
  Notebook, Scroll, MusicNotes, SpeakerSimpleSlash,
  List, FloppyDisk, FolderOpen, ArrowClockwise, Play,
  Lightning, NoteBlank, CalendarCheck,
} from '@phosphor-icons/react'
import TabDialogue from './tab-dialogue'
import TabScene from './tab-scene'
import TabCharacter from './tab-character'
import DashboardDrawer from './dashboard-drawer'

const P = 'ds'

const TAB_ICONS: Record<string, React.ReactNode> = {
  notebook: <Notebook size={22} />,
  scene: <MapTrifold size={22} />,
  dialogue: <ChatCircleDots size={22} />,
  character: <Users size={22} />,
  records: <CalendarCheck size={22} />,
}

const TAB_CONFIG = [
  { key: 'notebook', label: '手册' },
  { key: 'scene', label: '场景' },
  { key: 'dialogue', label: '对话' },
  { key: 'character', label: '人物' },
  { key: 'records', label: '事件' },
] as const

export default function AppShell() {
  const {
    activeTab, setActiveTab,
    currentWeek, currentPeriodIndex, actionPoints,
    showDashboard, toggleDashboard,
    showRecords, toggleRecords,
    showMenu, toggleMenu,
    saveGame,
    storyRecords,
  } = useGameStore()

  const { isPlaying, toggle: toggleBgm } = useBgm()

  const chapter = getCurrentChapter(currentWeek)
  const period = PERIODS[currentPeriodIndex]

  // Toast
  const [toast, setToast] = useState('')
  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }, [])

  // Three-way gesture
  const touchRef = useRef({ x: 0, y: 0 })
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }, [])
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchRef.current.x
    const dy = Math.abs(e.changedTouches[0].clientY - touchRef.current.y)
    if (Math.abs(dx) > 60 && dy < Math.abs(dx) * 1.5) {
      if (dx > 0) toggleDashboard()
      else toggleRecords()
    }
  }, [toggleDashboard, toggleRecords])

  // Menu actions
  const handleSave = useCallback(() => {
    saveGame()
    showToast('✅ 已保存')
    toggleMenu()
  }, [saveGame, showToast, toggleMenu])

  const handleLoad = useCallback(() => {
    useGameStore.getState().loadGame()
    toggleMenu()
  }, [toggleMenu])

  const handleReset = useCallback(() => {
    useGameStore.getState().clearSave()
    useGameStore.getState().resetGame()
  }, [])

  return (
    <div className={`${P}-shell`}>
      {/* Header */}
      <header className={`${P}-header`}>
        <div className={`${P}-header-left`}>
          <span className={`${P}-ap-badge`}><Lightning size={13} weight="fill" /> {actionPoints}</span>
        </div>
        <div className={`${P}-header-center`}>
          <span className={`${P}-header-time`}>
            第{currentWeek}/{MAX_WEEKS}周 · {period?.icon} {period?.name}
          </span>
          <span className={`${P}-header-chapter`}>{chapter.name}</span>
        </div>
        <div className={`${P}-header-right`}>
          <button
            className={`${P}-header-btn`}
            onClick={toggleBgm}
            title={isPlaying ? '暂停音乐' : '播放音乐'}
          >
            {isPlaying ? <MusicNotes size={18} /> : <SpeakerSimpleSlash size={18} />}
          </button>
          <button className={`${P}-header-btn`} onClick={toggleMenu} title="菜单">
            <List size={18} />
          </button>
        </div>
      </header>

      {/* Tab Content */}
      <div
        style={{ flex: 1, overflow: 'hidden', position: 'relative' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait">
          {activeTab === 'dialogue' && (
            <motion.div
              key="dialogue"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ height: '100%' }}
            >
              <TabDialogue />
            </motion.div>
          )}
          {activeTab === 'scene' && (
            <motion.div
              key="scene"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ height: '100%' }}
            >
              <TabScene />
            </motion.div>
          )}
          {activeTab === 'character' && (
            <motion.div
              key="character"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ height: '100%' }}
            >
              <TabCharacter />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tab Bar */}
      <nav className={`${P}-tab-bar`}>
        {TAB_CONFIG.map((tab) => {
          const isDrawer = tab.key === 'notebook' || tab.key === 'records'
          const isActive = !isDrawer && activeTab === tab.key
          return (
            <button
              key={tab.key}
              className={`${P}-tab-item ${isActive ? `${P}-tab-active` : ''}`}
              onClick={() => {
                if (tab.key === 'notebook') toggleDashboard()
                else if (tab.key === 'records') toggleRecords()
                else setActiveTab(tab.key)
              }}
            >
              {TAB_ICONS[tab.key]}
              <span>{tab.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Dashboard Drawer (left) */}
      <AnimatePresence>
        {showDashboard && (
          <motion.div
            className={`${P}-dash-overlay`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleDashboard}
          >
            <motion.div
              className={`${P}-dash-drawer`}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <DashboardDrawer />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Record Sheet (right) */}
      <AnimatePresence>
        {showRecords && (
          <motion.div
            className={`${P}-record-overlay`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleRecords}
          >
            <motion.div
              className={`${P}-record-sheet`}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`${P}-record-title`}><Scroll size={16} /> 事件记录</div>
              <div className={`${P}-record-timeline`}>
                {[...storyRecords].reverse().map((rec) => (
                  <div key={rec.id} className={`${P}-record-item`}>
                    <div className={`${P}-record-dot`} />
                    <div className={`${P}-record-meta`}>
                      第{rec.day}周 · {rec.period}
                    </div>
                    <div className={`${P}-record-event-title`}>{rec.title}</div>
                    <div className={`${P}-record-event-content`}>
                      {rec.content.slice(0, 60)}
                    </div>
                  </div>
                ))}
                {storyRecords.length === 0 && (
                  <div className={`${P}-empty`}>
                    <div className={`${P}-empty-icon`}><NoteBlank size={32} /></div>
                    <div className={`${P}-empty-text`}>还没有事件记录</div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menu Overlay */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            className={`${P}-menu-overlay`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleMenu}
          >
            <motion.div
              className={`${P}-menu-panel`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ fontSize: 16, fontWeight: 700, letterSpacing: 2, marginBottom: 20, textAlign: 'center' }}>
                {STORY_INFO.title}
              </h3>
              <button className={`${P}-menu-btn`} onClick={handleSave}><FloppyDisk size={16} /> 保存进度</button>
              <button className={`${P}-menu-btn`} onClick={handleLoad}><FolderOpen size={16} /> 读取存档</button>
              <button className={`${P}-menu-btn danger`} onClick={handleReset}><ArrowClockwise size={16} /> 重新开始</button>
              <button className={`${P}-menu-btn`} onClick={toggleMenu}><Play size={16} weight="fill" /> 继续游戏</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className={`${P}-toast`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
