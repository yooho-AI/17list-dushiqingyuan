/**
 * [INPUT]: 无外部依赖
 * [OUTPUT]: 对外提供 track* 系列埋点函数
 * [POS]: lib 的 Umami 埋点模块，被 store.ts 和 App.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const PREFIX = 'ds_'

function trackEvent(name: string, data?: Record<string, string | number>) {
  try {
    ;(window as unknown as Record<string, { track: (n: string, d?: Record<string, string | number>) => void }>).umami?.track(PREFIX + name, data)
  } catch { /* silent */ }
}

export const trackGameStart = () => trackEvent('game_start')
export const trackGameContinue = () => trackEvent('game_continue')
export const trackPlayerCreate = (name: string) =>
  trackEvent('player_create', { name })
export const trackTimeAdvance = (week: number, period: string) =>
  trackEvent('time_advance', { week, period })
export const trackChapterEnter = (chapter: number) =>
  trackEvent('chapter_enter', { chapter })
export const trackEndingReached = (ending: string) =>
  trackEvent('ending_reached', { ending })
export const trackSceneUnlock = (scene: string) =>
  trackEvent('scene_unlock', { scene })
