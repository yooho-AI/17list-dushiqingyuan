/**
 * [INPUT]: script.md(?raw), stream.ts, data.ts
 * [OUTPUT]: useGameStore (Zustand hook) + re-exports from data.ts
 * [POS]: lib state hub — script-through + rich messages + drawers + dual-track parsing + chain reactions
 * [PROTOCOL]: Update this header on change, then check CLAUDE.md
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import GAME_SCRIPT from './script.md?raw'
import { streamChat, chat } from './stream'
import { extractChoices } from './parser'
import {
  type Character, type CharacterStats, type Message, type StatMeta, type StoryRecord,
  PERIODS, MAX_WEEKS, MAX_ACTION_POINTS,
  SCENES, ITEMS, STORY_INFO, PLAYER_STAT_METAS,
  buildCharacters, getCurrentChapter, getDayEvents,
} from './data'

// ── Types ──

interface PlayerStats {
  charm: number
  communication: number
  empathy: number
  independence: number
  emotional: number
}

interface GameState {
  gameStarted: boolean
  playerName: string
  characters: Record<string, Character>

  currentWeek: number
  currentPeriodIndex: number
  actionPoints: number
  playerStats: PlayerStats

  currentScene: string
  currentCharacter: string | null
  characterStats: Record<string, CharacterStats>
  unlockedScenes: string[]

  currentChapter: number
  triggeredEvents: string[]
  inventory: Record<string, number>

  messages: Message[]
  historySummary: string
  isTyping: boolean
  streamingContent: string
  choices: string[]

  endingType: string | null

  activeTab: 'dialogue' | 'scene' | 'character'
  showDashboard: boolean
  showRecords: boolean
  showMenu: boolean
  storyRecords: StoryRecord[]
}

interface GameActions {
  setPlayerInfo: (name: string) => void
  initGame: () => void
  selectCharacter: (charId: string | null) => void
  selectScene: (sceneId: string) => void
  setActiveTab: (tab: 'dialogue' | 'scene' | 'character') => void
  toggleDashboard: () => void
  toggleRecords: () => void
  toggleMenu: () => void
  sendMessage: (text: string) => Promise<void>
  advanceTime: () => void
  useItem: (itemId: string) => void
  checkEnding: () => void
  addSystemMessage: (text: string) => void
  addStoryRecord: (title: string, content: string) => void
  resetGame: () => void
  saveGame: () => void
  loadGame: () => void
  hasSave: () => boolean
  clearSave: () => void
}

type GameStore = GameState & GameActions

let messageCounter = 0
const makeId = () => `msg-${Date.now()}-${++messageCounter}`
const SAVE_KEY = 'ds-save-v1'

// ── Dual-track stat parser ──

interface StatChangeResult {
  charChanges: Array<{ charId: string; stat: string; delta: number }>
  globalChanges: Array<{ key: string; delta: number }>
}

function parseStatChanges(
  content: string,
  characters: Record<string, Character>
): StatChangeResult {
  const charChanges: StatChangeResult['charChanges'] = []
  const globalChanges: StatChangeResult['globalChanges'] = []

  const nameToId: Record<string, string> = {}
  for (const [id, char] of Object.entries(characters)) {
    nameToId[char.name] = id
  }

  const labelToKey: Record<string, Array<{ charId: string; key: string }>> = {}
  for (const [charId, char] of Object.entries(characters)) {
    for (const meta of char.statMetas) {
      const labels = [meta.label, meta.label.replace(/度$/, ''), meta.label + '值']
      for (const label of labels) {
        if (!labelToKey[label]) labelToKey[label] = []
        labelToKey[label].push({ charId, key: meta.key })
      }
    }
  }

  const GLOBAL_ALIASES: Record<string, string> = {
    '外貌魅力': 'charm', '魅力': 'charm',
    '沟通表达': 'communication', '沟通': 'communication',
    '共情能力': 'empathy', '共情': 'empathy',
    '独立思考': 'independence', '独立': 'independence',
    '情绪稳定': 'emotional', '情绪': 'emotional',
    '精力': 'energy',
  }

  // Track 1: 【角色名 数值+N】
  const charRegex = /[【\[]([^\]】]+?)\s+(\S+?)([+-])(\d+)[】\]]/g
  let match
  while ((match = charRegex.exec(content))) {
    const [, context, statLabel, sign, numStr] = match
    const delta = parseInt(numStr) * (sign === '+' ? 1 : -1)
    const charId = nameToId[context]
    if (charId) {
      const entries = labelToKey[statLabel]
      const entry = entries?.find((e) => e.charId === charId) || entries?.[0]
      if (entry) {
        charChanges.push({ charId: entry.charId, stat: entry.key, delta })
      }
    }
  }

  // Track 2: 【Stat+N】
  const globalRegex = /[【\[](\S+?)([+-])(\d+)[】\]]/g
  let gMatch
  while ((gMatch = globalRegex.exec(content))) {
    const [fullMatch, label, sign, numStr] = gMatch
    // Skip if already matched as charChange (has a space)
    if (fullMatch.includes(' ')) continue
    const delta = parseInt(numStr) * (sign === '+' ? 1 : -1)
    const globalKey = GLOBAL_ALIASES[label]
    if (globalKey) {
      globalChanges.push({ key: globalKey, delta })
    }
  }

  return { charChanges, globalChanges }
}

// ── System prompt builder ──

function buildStatsSnapshot(state: GameState): string {
  return Object.entries(state.characterStats)
    .map(([charId, stats]) => {
      const char = state.characters[charId]
      if (!char) return ''
      const lines = char.statMetas
        .map((m: StatMeta) => `  ${m.icon} ${m.label}: ${stats[m.key] ?? 0}/100`)
        .join('\n')
      return `${char.name}:\n${lines}`
    })
    .filter(Boolean)
    .join('\n')
}

function buildSystemPrompt(state: GameState): string {
  const char = state.currentCharacter
    ? state.characters[state.currentCharacter]
    : null
  const chapter = getCurrentChapter(state.currentWeek)
  const scene = SCENES[state.currentScene]

  const playerStatLines = PLAYER_STAT_METAS
    .map((m) => `  ${m.icon} ${m.label}: ${state.playerStats[m.key as keyof PlayerStats] ?? 0}`)
    .join('\n')

  return `你是《${STORY_INFO.title}》的AI叙述者。

## 游戏剧本
${GAME_SCRIPT}

## 当前状态
玩家「${state.playerName}」
第${state.currentWeek}周 · ${PERIODS[state.currentPeriodIndex].name}
第${chapter.id}章「${chapter.name}」
当前场景：${scene.name}
${char ? `当前交互角色：${char.name}` : '无特定交互对象'}
行动力：${state.actionPoints}/${MAX_ACTION_POINTS}

## 玩家属性
${playerStatLines}

## 男嘉宾数值
${buildStatsSnapshot(state)}

## 背包
${Object.entries(state.inventory).filter(([, v]) => v > 0).map(([k, v]) => `${ITEMS[k]?.name} x${v}`).join('、') || '空'}

## 已触发事件
${state.triggeredEvents.join('、') || '无'}

## 输出格式
- 每段回复 200-400 字（关键对话 500-800 字）
- 角色对话：【角色名】"对话内容"
- 数值变化：【角色名 好感度+N】【角色名 信任度-N】【角色名 了解度+N】
- 全局属性变化：【沟通+N】【共情-N】
- 支持 Markdown 格式（**加粗**、*斜体*、> 引用、表格等）
- 严格遵循剧本中每位角色的说话风格和行为逻辑

## 选项系统
每次回复末尾必须给出3-4个行动选项供玩家选择下一步。格式严格如下：
1. 选项文本（简洁，15字以内）
2. 选项文本
3. 选项文本
4. 选项文本
选项应涵盖不同的情感策略和对话方向（如：主动靠近/保持距离/深入了解/转换话题等）。不要在选项前加"你的选择"等标题。`
}

// ── Store ──

export const useGameStore = create<GameStore>()(
  immer((set, get) => ({
    // ── Initial state ──
    gameStarted: false,
    playerName: '',
    characters: buildCharacters(),

    currentWeek: 1,
    currentPeriodIndex: 0,
    actionPoints: MAX_ACTION_POINTS,
    playerStats: { charm: 80, communication: 75, empathy: 70, independence: 75, emotional: 70 },

    currentScene: 'yuanqi',
    currentCharacter: null,
    characterStats: Object.fromEntries(
      Object.entries(buildCharacters()).map(([id, char]) => [id, { ...char.initialStats }])
    ),
    unlockedScenes: ['yuanqi', 'cafe', 'gallery', 'riverside'],

    currentChapter: 1,
    triggeredEvents: [],
    inventory: { roses: 1, booklist: 1 },

    messages: [],
    historySummary: '',
    isTyping: false,
    streamingContent: '',
    choices: [],

    endingType: null,

    activeTab: 'dialogue',
    showDashboard: false,
    showRecords: false,
    showMenu: false,
    storyRecords: [],

    // ── Actions ──

    setPlayerInfo: (name: string) => {
      set((s) => { s.playerName = name })
    },

    initGame: () => {
      set((s) => {
        s.gameStarted = true
        s.messages.push({
          id: makeId(),
          role: 'system',
          content: `欢迎来到缘起APP，${s.playerName}。系统已为你匹配10位优质男嘉宾。\n\n你可以在线上与他们聊天，也可以前往不同场景进行线下约会。每周有3点行动力，每次深度互动消耗1点。\n\n准备好开始你的都市情缘了吗？`,
          timestamp: Date.now(),
        })
      })
    },

    selectCharacter: (charId: string | null) => {
      set((s) => {
        s.currentCharacter = charId
        if (charId) s.activeTab = 'dialogue'
      })
    },

    selectScene: (sceneId: string) => {
      const state = get()
      if (!state.unlockedScenes.includes(sceneId)) return
      if (state.currentScene === sceneId) return

      set((s) => {
        s.currentScene = sceneId
        s.activeTab = 'dialogue'
        s.messages.push({
          id: makeId(),
          role: 'system',
          content: `你来到了${SCENES[sceneId].name}。`,
          timestamp: Date.now(),
          type: 'scene-transition',
          sceneId,
        })
      })
    },

    setActiveTab: (tab) => {
      set((s) => { s.activeTab = tab })
    },

    toggleDashboard: () => {
      set((s) => {
        s.showDashboard = !s.showDashboard
        if (s.showDashboard) s.showRecords = false
      })
    },

    toggleRecords: () => {
      set((s) => {
        s.showRecords = !s.showRecords
        if (s.showRecords) s.showDashboard = false
      })
    },

    toggleMenu: () => {
      set((s) => { s.showMenu = !s.showMenu })
    },

    sendMessage: async (text: string) => {
      set((s) => {
        s.messages.push({
          id: makeId(), role: 'user', content: text, timestamp: Date.now(),
        })
        s.isTyping = true
        s.streamingContent = ''
      })

      try {
        const state = get()

        // History compression
        if (state.messages.length > 15 && !state.historySummary) {
          const summary = await chat([
            { role: 'system', content: '将以下对话压缩为200字以内的摘要，保留关键剧情、数值变化和情感转折：' },
            ...state.messages.slice(0, -5).map((m) => ({
              role: m.role, content: m.content,
            })),
          ])
          set((s) => { s.historySummary = summary })
        }

        // Build system prompt with GAME_SCRIPT
        const systemPrompt = buildSystemPrompt(get())
        const apiMessages = [
          { role: 'system' as const, content: systemPrompt },
          ...(get().historySummary
            ? [{ role: 'system' as const, content: `历史摘要: ${get().historySummary}` }]
            : []),
          ...get().messages.slice(-10).map((m) => ({
            role: m.role, content: m.content,
          })),
        ]

        // Stream SSE
        let fullContent = ''
        await streamChat(
          apiMessages,
          (chunk) => {
            fullContent += chunk
            set((s) => { s.streamingContent = fullContent })
          },
          () => {},
        )

        // Parse dual-track stat changes
        const { charChanges, globalChanges } = parseStatChanges(fullContent, get().characters)

        // Apply changes
        set((s) => {
          for (const change of charChanges) {
            const stats = s.characterStats[change.charId]
            if (stats) {
              stats[change.stat] = Math.max(0, Math.min(100, (stats[change.stat] ?? 0) + change.delta))
            }
          }
          for (const change of globalChanges) {
            const key = change.key as keyof PlayerStats
            if (key in s.playerStats) {
              s.playerStats[key] = Math.max(0, Math.min(100, s.playerStats[key] + change.delta))
            }
          }
        })

        // Chain reactions
        set((s) => {
          // If any character's affection ≥ 70 and trust < 30, trigger jealousy event
          for (const [charId, stats] of Object.entries(s.characterStats)) {
            const aff = stats.affection ?? 0
            if (aff >= 70 && !s.triggeredEvents.includes(`chain_high_aff_${charId}`)) {
              // Other characters with affection > 40 get trust boost (they sense your closeness)
              for (const [otherId, otherStats] of Object.entries(s.characterStats)) {
                if (otherId !== charId && (otherStats.affection ?? 0) > 40) {
                  otherStats.trust = Math.max(0, (otherStats.trust ?? 0) - 3)
                }
              }
              s.triggeredEvents.push(`chain_high_aff_${charId}`)
            }
          }

          // Multi-dating detection: if 3+ characters have affection ≥ 50, all trust -5
          const highAffCount = Object.values(s.characterStats).filter(
            (stats) => (stats.affection ?? 0) >= 50
          ).length
          if (highAffCount >= 3 && !s.triggeredEvents.includes('chain_multi_dating')) {
            for (const stats of Object.values(s.characterStats)) {
              if ((stats.affection ?? 0) >= 50) {
                stats.trust = Math.max(0, (stats.trust ?? 0) - 5)
              }
            }
            s.triggeredEvents.push('chain_multi_dating')
          }
        })

        // Check BE condition
        const postState = get()
        const highestAff = Math.max(
          ...Object.values(postState.characterStats).map((s) => s.affection ?? 0)
        )
        const highestAffCharId = Object.entries(postState.characterStats)
          .find(([, s]) => (s.affection ?? 0) === highestAff)?.[0]
        if (
          highestAff >= 70 &&
          highestAffCharId &&
          (postState.characterStats[highestAffCharId]?.trust ?? 0) < 40 &&
          postState.currentWeek >= 10
        ) {
          set((s) => { s.endingType = 'be-regret' })
        }

        // Extract choices from AI response
        const { cleanContent, choices } = extractChoices(fullContent)

        // Push AI message (with clean content, choices stored separately)
        set((s) => {
          s.messages.push({
            id: makeId(),
            role: 'assistant',
            content: cleanContent,
            character: s.currentCharacter ?? undefined,
            timestamp: Date.now(),
          })
          s.choices = choices
          s.isTyping = false
          s.streamingContent = ''
        })

        // Advance time + save
        get().advanceTime()
        get().saveGame()

        // Story record
        const charName = get().currentCharacter
          ? get().characters[get().currentCharacter!]?.name
          : null
        get().addStoryRecord(charName ?? '缘起', cleanContent.slice(0, 40))

      } catch (err) {
        set((s) => { s.isTyping = false; s.streamingContent = '' })
        const msg = err instanceof Error ? err.message : String(err)
        get().addSystemMessage(`网络异常: ${msg.slice(0, 80)}`)
      }
    },

    advanceTime: () => {
      let weekChanged = false

      set((s) => {
        s.actionPoints -= 1
        s.currentPeriodIndex += 1

        if (s.currentPeriodIndex >= PERIODS.length) {
          s.currentPeriodIndex = 0
          s.currentWeek += 1
          s.actionPoints = MAX_ACTION_POINTS
          weekChanged = true

          // Weekly auto-unlock scenes
          for (const [sceneId, scene] of Object.entries(SCENES)) {
            if (
              scene.unlockCondition?.week &&
              s.currentWeek >= scene.unlockCondition.week &&
              !s.unlockedScenes.includes(sceneId)
            ) {
              s.unlockedScenes.push(sceneId)
            }
          }

          // Chapter progression
          const newChapter = getCurrentChapter(s.currentWeek)
          if (newChapter.id !== s.currentChapter) {
            s.currentChapter = newChapter.id
            s.storyRecords.push({
              id: `rec-ch-${newChapter.id}`,
              day: s.currentWeek,
              period: PERIODS[0].name,
              title: `进入${newChapter.name}`,
              content: newChapter.description,
            })
          }
        }
      })

      const state = get()

      // Rich message: week change
      if (weekChanged) {
        const chapter = getCurrentChapter(state.currentWeek)
        set((s) => {
          s.messages.push({
            id: makeId(),
            role: 'system',
            content: '',
            timestamp: Date.now(),
            type: 'week-change',
            dayInfo: { week: state.currentWeek, chapter: chapter.name },
          })
        })
        get().addStoryRecord('周变', `进入第${state.currentWeek}周`)
      }

      // Forced events
      const events = getDayEvents(state.currentWeek, state.triggeredEvents)
      for (const event of events) {
        if (event.triggerPeriod === undefined || event.triggerPeriod === state.currentPeriodIndex) {
          set((s) => {
            s.triggeredEvents.push(event.id)
            s.storyRecords.push({
              id: `rec-evt-${event.id}`,
              day: state.currentWeek,
              period: PERIODS[state.currentPeriodIndex].name,
              title: event.name,
              content: event.description,
            })
          })
          get().addSystemMessage(`【${event.name}】${event.description}`)
        }
      }

      // Time ending check
      if (state.currentWeek >= MAX_WEEKS && state.currentPeriodIndex === PERIODS.length - 1) {
        get().checkEnding()
      }
    },

    useItem: (itemId: string) => {
      set((s) => {
        const count = s.inventory[itemId] ?? 0
        if (count <= 0) return
        s.inventory[itemId] = count - 1
      })
      const item = ITEMS[itemId]
      if (item) {
        get().addSystemMessage(`使用了${item.icon} ${item.name}`)
      }
    },

    checkEnding: () => {
      const state = get()
      const setEnding = (id: string) => {
        set((s) => { s.endingType = id })
      }

      // BE: 遗憾错过 — highest affection ≥ 70 but trust < 40
      const entries = Object.entries(state.characterStats)
      const sorted = entries.sort((a, b) => (b[1].affection ?? 0) - (a[1].affection ?? 0))
      const [topCharId, topStats] = sorted[0] ?? ['', {}]
      if ((topStats.affection ?? 0) >= 70 && (topStats.trust ?? 0) < 40) {
        setEnding('be-regret')
        return
      }

      // TE: 挚爱圆满 — any character affection ≥ 85, trust ≥ 80, understanding ≥ 75
      for (const [, stats] of entries) {
        if (
          (stats.affection ?? 0) >= 85 &&
          (stats.trust ?? 0) >= 80 &&
          (stats.understanding ?? 0) >= 75
        ) {
          setEnding('te-perfect')
          return
        }
      }

      // HE: 自我成长 — independence ≥ 85, empathy ≥ 80, no affection ≥ 70
      const maxAff = Math.max(...entries.map(([, s]) => s.affection ?? 0))
      if (state.playerStats.independence >= 85 && state.playerStats.empathy >= 80 && maxAff < 70) {
        setEnding('he-growth')
        return
      }

      // NE1: 现实妥协 — any character affection 60-84, trust ≥ 60
      if (topCharId) {
        const aff = topStats.affection ?? 0
        if (aff >= 60 && aff < 85 && (topStats.trust ?? 0) >= 60) {
          setEnding('ne-compromise')
          return
        }
      }

      // NE2: 开放探索 — fallback
      setEnding('ne-explore')
    },

    addSystemMessage: (text: string) => {
      set((s) => {
        s.messages.push({
          id: makeId(), role: 'system', content: text, timestamp: Date.now(),
        })
      })
    },

    addStoryRecord: (title: string, content: string) => {
      const state = get()
      set((s) => {
        s.storyRecords.push({
          id: makeId(),
          day: state.currentWeek,
          period: PERIODS[state.currentPeriodIndex]?.name ?? '',
          title,
          content,
        })
      })
    },

    resetGame: () => {
      set((s) => {
        s.gameStarted = false
        s.playerName = ''
        s.characters = buildCharacters()
        s.currentWeek = 1
        s.currentPeriodIndex = 0
        s.actionPoints = MAX_ACTION_POINTS
        s.playerStats = { charm: 80, communication: 75, empathy: 70, independence: 75, emotional: 70 }
        s.currentScene = 'yuanqi'
        s.currentCharacter = null
        s.characterStats = Object.fromEntries(
          Object.entries(buildCharacters()).map(([id, char]) => [id, { ...char.initialStats }])
        )
        s.unlockedScenes = ['yuanqi', 'cafe', 'gallery', 'riverside']
        s.currentChapter = 1
        s.triggeredEvents = []
        s.inventory = { roses: 1, booklist: 1 }
        s.messages = []
        s.historySummary = ''
        s.isTyping = false
        s.streamingContent = ''
        s.choices = []
        s.endingType = null
        s.activeTab = 'dialogue'
        s.showDashboard = false
        s.showRecords = false
        s.showMenu = false
        s.storyRecords = []
      })
      get().clearSave()
    },

    saveGame: () => {
      const s = get()
      const data = {
        version: 1,
        playerName: s.playerName,
        characters: s.characters,
        currentWeek: s.currentWeek,
        currentPeriodIndex: s.currentPeriodIndex,
        actionPoints: s.actionPoints,
        playerStats: s.playerStats,
        currentScene: s.currentScene,
        currentCharacter: s.currentCharacter,
        characterStats: s.characterStats,
        currentChapter: s.currentChapter,
        triggeredEvents: s.triggeredEvents,
        unlockedScenes: s.unlockedScenes,
        inventory: s.inventory,
        messages: s.messages.slice(-30),
        historySummary: s.historySummary,
        endingType: s.endingType,
        activeTab: s.activeTab,
        storyRecords: s.storyRecords.slice(-50),
      }
      localStorage.setItem(SAVE_KEY, JSON.stringify(data))
    },

    loadGame: () => {
      const raw = localStorage.getItem(SAVE_KEY)
      if (!raw) return
      try {
        const data = JSON.parse(raw)
        if (data.version !== 1) return
        set((s) => {
          s.gameStarted = true
          s.playerName = data.playerName
          s.characters = data.characters ?? buildCharacters()
          s.currentWeek = data.currentWeek
          s.currentPeriodIndex = data.currentPeriodIndex
          s.actionPoints = data.actionPoints
          s.playerStats = data.playerStats ?? { charm: 80, communication: 75, empathy: 70, independence: 75, emotional: 70 }
          s.currentScene = data.currentScene
          s.currentCharacter = data.currentCharacter
          s.characterStats = data.characterStats
          s.currentChapter = data.currentChapter
          s.triggeredEvents = data.triggeredEvents
          s.unlockedScenes = data.unlockedScenes
          s.inventory = data.inventory ?? {}
          s.messages = data.messages ?? []
          s.historySummary = data.historySummary ?? ''
          s.endingType = data.endingType
          s.activeTab = data.activeTab ?? 'dialogue'
          s.storyRecords = data.storyRecords ?? []
        })
      } catch { /* corrupted save */ }
    },

    hasSave: () => !!localStorage.getItem(SAVE_KEY),

    clearSave: () => { localStorage.removeItem(SAVE_KEY) },
  }))
)

// ── Re-export data.ts ──

export {
  SCENES, ITEMS, PERIODS, CHAPTERS,
  MAX_WEEKS, MAX_ACTION_POINTS,
  STORY_INFO, FORCED_EVENTS, ENDINGS,
  QUICK_ACTIONS, PLAYER_STAT_METAS,
  buildCharacters, getCurrentChapter,
  getStatLevel, getAvailableCharacters, getDayEvents,
} from './data'

export type {
  Character, CharacterStats, Scene, GameItem, Chapter,
  ForcedEvent, Ending, TimePeriod, Message, StatMeta, StoryRecord,
} from './data'
