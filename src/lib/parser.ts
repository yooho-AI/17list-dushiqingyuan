/**
 * [INPUT]: 无外部依赖（避免循环引用 data.ts）
 * [OUTPUT]: 对外提供 parseStoryParagraph 函数（返回 narrative + statHtml + charColor）
 * [POS]: lib 的 AI 回复解析层，charColor 驱动气泡左边框角色色标
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

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

function parseInlineContent(text: string): string {
  let result = escapeHtml(text)
  for (const [name, color] of Object.entries(CHARACTER_COLORS)) {
    result = result.replaceAll(
      name,
      `<span class="char-name" style="color:${color};font-weight:600">${name}</span>`,
    )
  }
  return result
}

function colorizeStats(line: string): string {
  return line.replace(/([^\s【】\[\]]+?)([+-]\d+)/g, (_, label: string, delta: string) => {
    const color = STAT_COLORS[label] || DEFAULT_COLOR
    const cls = delta.startsWith('+') ? 'stat-up' : 'stat-down'
    return `<span class="stat-change ${cls}" style="color:${color}">${label}${delta}</span>`
  })
}

// ── 主解析函数 ──

export function parseStoryParagraph(content: string): {
  narrative: string
  statHtml: string
  charColor: string | null
} {
  const lines = content.split('\n').filter(Boolean)
  const narrativeParts: string[] = []
  const statParts: string[] = []
  let charColor: string | null = null

  for (const raw of lines) {
    const line = raw.trim()

    // 纯数值变化行：【好感度+10 信任度-5】
    if (/^[【\[][^】\]]*[+-]\d+[^】\]]*[】\]]$/.test(line)) {
      statParts.push(colorizeStats(line))
      continue
    }

    // 角色对话：【林致远】"你来了"
    const charMatch = line.match(/^[【\[]([^\]】]+)[】\]](.*)/)
    if (charMatch) {
      const [, charName, dialogue] = charMatch
      const color = CHARACTER_COLORS[charName] || DEFAULT_COLOR
      if (!charColor) charColor = color
      narrativeParts.push(
        `<p class="dialogue-line"><span class="char-name" style="color:${color}">${charName}</span>${parseInlineContent(dialogue)}</p>`,
      )
      continue
    }

    // 动作/旁白
    const actionMatch = line.match(/^[（(]([^）)]+)[）)]/) || line.match(/^\*([^*]+)\*/)
    if (actionMatch) {
      narrativeParts.push(`<p class="action">${parseInlineContent(line)}</p>`)
      continue
    }

    // 获得物品
    if (line.startsWith('【获得') || line.startsWith('[获得')) {
      statParts.push(`<div class="item-gain">${escapeHtml(line)}</div>`)
      continue
    }

    // 普通叙述
    narrativeParts.push(`<p class="narration">${parseInlineContent(line)}</p>`)
  }

  return {
    narrative: narrativeParts.join(''),
    statHtml: statParts.length > 0
      ? `<div class="stat-changes">${statParts.join('')}</div>`
      : '',
    charColor,
  }
}
