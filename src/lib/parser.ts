/**
 * [INPUT]: marked (Markdown渲染)，无项目内依赖（避免循环引用 data.ts）
 * [OUTPUT]: parseStoryParagraph (narrative + statHtml + charColor), extractChoices (cleanContent + choices)
 * [POS]: lib AI 回复解析层，Markdown 渲染 + charColor 驱动气泡左边框 + 选项提取
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { marked } from 'marked'

// ── 角色名 → 主题色（手动同步 data.ts，不 import 避免循环依赖） ──

const CHARACTER_COLORS: Record<string, string> = {
  '林致远': '#2563eb',
  '陆景深': '#16a34a',
  '周泽言': '#7c3aed',
  '秦宇': '#dc2626',
  '沈清和': '#0891b2',
  '陈默': '#d97706',
  '赵启航': '#64748b',
  '徐向阳': '#ea580c',
  '叶枫': '#059669',
  '韩东': '#475569',
}

// ── 数值标签 → 颜色 ──

const STAT_COLORS: Record<string, string> = {
  '好感': '#ff6b8a', '好感度': '#ff6b8a',
  '信任': '#22c55e', '信任度': '#22c55e',
  '了解': '#3b82f6', '了解度': '#3b82f6',
  '外貌魅力': '#f472b6', '魅力': '#f472b6',
  '沟通表达': '#60a5fa', '沟通': '#60a5fa',
  '共情能力': '#34d399', '共情': '#34d399',
  '独立思考': '#a78bfa', '独立': '#a78bfa',
  '情绪稳定': '#fbbf24', '情绪': '#fbbf24',
  '精力': '#f97316',
}

const DEFAULT_COLOR = '#ff6b8a'

// ── 工具函数 ──

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function colorizeStats(line: string): string {
  return line.replace(/([^\s【】\[\]]+?)([+-]\d+)/g, (_, label: string, delta: string) => {
    const color = STAT_COLORS[label] || DEFAULT_COLOR
    const cls = delta.startsWith('+') ? 'stat-up' : 'stat-down'
    return `<span class="stat-change ${cls}" style="color:${color}">${label}${delta}</span>`
  })
}

function colorizeCharNames(html: string): string {
  let result = html
  for (const name of Object.keys(CHARACTER_COLORS)) {
    result = result.replaceAll(
      name,
      `<span class="char-name">${name}</span>`,
    )
  }
  return result
}

// ── 选项提取 ──

export function extractChoices(content: string): {
  cleanContent: string
  choices: string[]
} {
  const lines = content.split('\n')
  const choices: string[] = []
  let choiceStartIdx = lines.length

  // Scan from end for consecutive numbered/lettered choice lines
  for (let i = lines.length - 1; i >= 0; i--) {
    const trimmed = lines[i].trim()
    if (!trimmed && choices.length > 0) continue // skip empty lines between choices
    if (!trimmed && choices.length === 0) continue // skip trailing empty lines

    if (/^[1-4][\.、．]\s*.+/.test(trimmed) || /^[A-Da-d][\.、．]\s*.+/.test(trimmed)) {
      choices.unshift(trimmed.replace(/^[1-4A-Da-d][\.、．]\s*/, ''))
      choiceStartIdx = i
    } else {
      break
    }
  }

  if (choices.length < 2) return { cleanContent: content, choices: [] }

  // Also remove header line like "你的选择：" or "**选项：**"
  let cutIdx = choiceStartIdx
  if (cutIdx > 0) {
    const prevLine = lines[cutIdx - 1].trim()
    if (/选择|选项|你可以|接下来|你的行动/.test(prevLine)) {
      cutIdx -= 1
    }
  }

  // Skip empty line before header
  if (cutIdx > 0 && !lines[cutIdx - 1].trim()) {
    cutIdx -= 1
  }

  return {
    cleanContent: lines.slice(0, cutIdx).join('\n').trim(),
    choices,
  }
}

// ── 主解析函数 ──

export function parseStoryParagraph(content: string): {
  narrative: string
  statHtml: string
  charColor: string | null
} {
  const lines = content.split('\n')
  const narrativeLines: string[] = []
  const statParts: string[] = []
  let charColor: string | null = null

  for (const raw of lines) {
    const line = raw.trim()

    // Preserve empty lines for markdown paragraph breaks
    if (!line) { narrativeLines.push(''); continue }

    // 纯数值变化行：【好感度+10 信任度-5】
    if (/^[【\[][^】\]]*[+-]\d+[^】\]]*[】\]]$/.test(line)) {
      statParts.push(colorizeStats(line))
      continue
    }

    // 获得物品
    if (line.startsWith('【获得') || line.startsWith('[获得')) {
      statParts.push(`<div class="item-gain">${escapeHtml(line)}</div>`)
      continue
    }

    // Detect charColor from 【角色名】 pattern
    if (!charColor) {
      const charMatch = line.match(/^[【\[]([^\]】]+)[】\]]/)
      if (charMatch) {
        charColor = CHARACTER_COLORS[charMatch[1]] || null
      }
    }

    narrativeLines.push(raw)
  }

  // Render narrative through marked (Markdown → HTML)
  const rawNarrative = narrativeLines.join('\n').trim()
  const html = rawNarrative ? (marked.parse(rawNarrative, { breaks: true, gfm: true }) as string) : ''

  // Apply character name coloring on rendered HTML
  const narrative = colorizeCharNames(html)

  // Fallback: detect charColor from any character name in content
  if (!charColor) {
    for (const [name, color] of Object.entries(CHARACTER_COLORS)) {
      if (content.includes(name)) {
        charColor = color
        break
      }
    }
  }

  return {
    narrative,
    statHtml: statParts.length > 0
      ? `<div class="stat-changes">${statParts.join('')}</div>`
      : '',
    charColor,
  }
}
