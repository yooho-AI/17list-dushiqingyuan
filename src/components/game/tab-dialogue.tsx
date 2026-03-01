/**
 * [INPUT]: store.ts (useGameStore, ITEMS, QUICK_ACTIONS, SCENES)
 * [OUTPUT]: 对话Tab — 富消息路由 + 快捷操作 + 输入区 + 背包底栏
 * [POS]: 三Tab之一，AppShell 路由渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  useGameStore, ITEMS, QUICK_ACTIONS, SCENES, STORY_INFO,
} from '../../lib/store'
import { parseStoryParagraph } from '../../lib/parser'
import { Backpack, PaperPlaneRight, Gift } from '@phosphor-icons/react'

const P = 'ds'

// ── Scene Transition Card ──

function SceneTransitionCard({ sceneId }: { sceneId?: string }) {
  const scene = sceneId ? SCENES[sceneId] : null
  if (!scene) return null

  return (
    <motion.div
      className={`${P}-scene-card`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.img
        className={`${P}-scene-card-bg`}
        src={scene.background}
        alt={scene.name}
        animate={{ scale: [1, 1.05] }}
        transition={{ duration: 8, ease: 'linear' }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
      <div className={`${P}-scene-card-mask`} />
      <div className={`${P}-scene-card-content`}>
        <div className={`${P}-scene-card-badge`}>{scene.icon} 场景切换</div>
        <div className={`${P}-scene-card-name`}>{scene.name}</div>
        <div className={`${P}-scene-card-desc`}>{scene.atmosphere}</div>
      </div>
    </motion.div>
  )
}

// ── Week Change Card ──

function WeekCard({ week, chapter }: { week: number; chapter: string }) {
  const chars = chapter.split('')

  return (
    <motion.div
      className={`${P}-week-card`}
      initial={{ opacity: 0, y: -40, rotate: -5 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ type: 'spring', damping: 18, stiffness: 200 }}
    >
      <div className={`${P}-week-card-top`} />
      <div className={`${P}-week-card-number`}>第{week}周</div>
      <div className={`${P}-week-card-label`}>WEEK {week}</div>
      <div className={`${P}-week-card-chapter`}>
        {chars.map((ch, i) => (
          <span key={i} className="dsTypeIn" style={{ animationDelay: `${i * 0.08}s` }}>
            {ch}
          </span>
        ))}
      </div>
    </motion.div>
  )
}

// ── Message Bubble ──

function MessageBubble({ msg }: { msg: { id: string; role: string; content: string; character?: string; type?: string; sceneId?: string; dayInfo?: { week: number; chapter: string } } }) {
  const { characters } = useGameStore()

  // Rich message routing (type-first)
  if (msg.type === 'scene-transition') {
    return <SceneTransitionCard sceneId={msg.sceneId} />
  }

  if (msg.type === 'week-change' && msg.dayInfo) {
    return <WeekCard week={msg.dayInfo.week} chapter={msg.dayInfo.chapter} />
  }

  // System message
  if (msg.role === 'system') {
    return (
      <div className={`${P}-bubble-system`}>
        {msg.content}
      </div>
    )
  }

  // Player message
  if (msg.role === 'user') {
    return (
      <div className={`${P}-bubble-player`}>
        {msg.content}
      </div>
    )
  }

  // NPC (assistant) message
  const { narrative, statHtml, charColor } = parseStoryParagraph(msg.content)
  const char = msg.character ? characters[msg.character] : null

  return (
    <div className={`${P}-avatar-row`}>
      {char && (
        <img
          className={`${P}-npc-avatar`}
          src={char.portrait}
          alt={char.name}
          style={{ borderColor: char.themeColor }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      )}
      <div style={{ flex: 1 }}>
        {char && (
          <div className={`${P}-npc-name`} style={{ color: char.themeColor }}>
            {char.name}
          </div>
        )}
        <div
          className={`${P}-bubble-npc`}
          style={charColor ? { borderLeftColor: charColor } : undefined}
        >
          <div dangerouslySetInnerHTML={{ __html: narrative }} />
          {statHtml && <div dangerouslySetInnerHTML={{ __html: statHtml }} />}
        </div>
      </div>
    </div>
  )
}

// ── Inventory Sheet ──

function InventorySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { inventory, useItem } = useGameStore()

  const handleUse = useCallback((itemId: string) => {
    useItem(itemId)
    onClose()
  }, [useItem, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={`${P}-inventory-overlay`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={`${P}-inventory-sheet`}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`${P}-inventory-handle`} />
            <div className={`${P}-inventory-title`}><Gift size={16} weight="fill" /> 我的背包</div>
            <div className={`${P}-inventory-grid`}>
              {Object.entries(ITEMS).map(([itemId, item]) => {
                const count = inventory[itemId] ?? 0
                return (
                  <div
                    key={itemId}
                    className={`${P}-inventory-item ${count <= 0 ? 'empty' : ''}`}
                    onClick={() => count > 0 && handleUse(itemId)}
                  >
                    <div className={`${P}-inventory-item-icon`}>{item.icon}</div>
                    <div className={`${P}-inventory-item-name`}>{item.name}</div>
                    {count > 0 && (
                      <div className={`${P}-inventory-item-count`}>×{count}</div>
                    )}
                  </div>
                )
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Tab Dialogue ──

export default function TabDialogue() {
  const {
    messages, isTyping, streamingContent,
    sendMessage, inventory,
  } = useGameStore()

  const [input, setInput] = useState('')
  const [showInventory, setShowInventory] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  // Auto-scroll
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages, streamingContent])

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text || isTyping) return
    setInput('')
    sendMessage(text)
  }, [input, isTyping, sendMessage])

  const handleQuickAction = useCallback((action: string) => {
    if (isTyping) return
    sendMessage(action)
  }, [isTyping, sendMessage])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  const totalItems = Object.values(inventory).reduce((sum, n) => sum + n, 0)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Chat Area */}
      <div ref={chatRef} className={`${P}-scrollbar`} style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {/* Intro letter */}
        {messages.length === 0 && !isTyping && (
          <div className={`${P}-bubble-system`} style={{ textAlign: 'center', padding: 20 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>💕</div>
            <div style={{ fontWeight: 600, letterSpacing: 2, marginBottom: 8 }}>{STORY_INFO.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              {STORY_INFO.subtitle}<br />
              选择一位嘉宾开始对话吧！
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {/* Streaming bubble */}
        {isTyping && streamingContent && (
          <div className={`${P}-avatar-row`}>
            <div style={{ flex: 1 }}>
              <div
                className={`${P}-bubble-npc`}
                dangerouslySetInnerHTML={{ __html: parseStoryParagraph(streamingContent).narrative }}
              />
            </div>
          </div>
        )}

        {/* Typing indicator */}
        {isTyping && !streamingContent && (
          <div className={`${P}-typing-indicator`}>
            <span /><span /><span />
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className={`${P}-quick-grid`}>
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action}
            className={`${P}-quick-btn`}
            onClick={() => handleQuickAction(action)}
            disabled={isTyping}
          >
            {action}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          className={`${P}-inventory-btn`}
          onClick={() => setShowInventory(true)}
        >
          <Backpack size={20} />
          {totalItems > 0 && <span className={`${P}-inventory-btn-badge`}>{totalItems}</span>}
        </button>
        <input
          className={`${P}-input`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入你的行动..."
          disabled={isTyping}
        />
        <button
          className={`${P}-send-btn`}
          onClick={handleSend}
          disabled={isTyping || !input.trim()}
        >
          <PaperPlaneRight size={18} weight="fill" />
        </button>
      </div>

      {/* Inventory Sheet */}
      <InventorySheet open={showInventory} onClose={() => setShowInventory(false)} />
    </div>
  )
}
