/**
 * [INPUT]: store.ts (useGameStore, SCENES)
 * [OUTPUT]: 场景Tab — 9:16大图 + 相关角色 + 地点列表
 * [POS]: 三Tab之一，AppShell 路由渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import {
  useGameStore, SCENES,
} from '../../lib/store'

const P = 'ds'

export default function TabScene() {
  const {
    currentScene, unlockedScenes, characters,
    selectScene, selectCharacter, setActiveTab,
  } = useGameStore()

  const scene = SCENES[currentScene]

  return (
    <div className={`${P}-scrollbar`} style={{ height: '100%', overflowY: 'auto' }}>
      {/* Scene Hero */}
      {scene && (
        <div className={`${P}-scene-hero`}>
          <img
            src={scene.background}
            alt={scene.name}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <div className={`${P}-scene-hero-overlay`}>
            <div className={`${P}-scene-hero-icon`}>{scene.icon}</div>
            <div className={`${P}-scene-hero-name`}>{scene.name}</div>
            <div className={`${P}-scene-hero-desc`}>{scene.atmosphere}</div>
          </div>
        </div>
      )}

      {/* Related Characters */}
      <div style={{ padding: '12px 12px 0' }}>
        <div className={`${P}-neon-divider`} />
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 2, marginBottom: 8 }}>
          👤 嘉宾
        </div>
        <div className={`${P}-char-grid`}>
          {Object.values(characters).map((char) => (
            <button
              key={char.id}
              className={`${P}-char-tag`}
              onClick={() => {
                selectCharacter(char.id)
                setActiveTab('character')
              }}
            >
              <img
                src={char.portrait}
                alt={char.name}
                style={{
                  width: 28, height: 28, borderRadius: '50%', objectFit: 'cover',
                  border: `2px solid ${char.themeColor}`,
                }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
              <span style={{ color: char.themeColor }}>{char.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Location List */}
      <div style={{ padding: '16px 12px' }}>
        <div className={`${P}-neon-divider`} />
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 2, marginBottom: 8 }}>
          🗺️ 约会地点
        </div>
        <div className={`${P}-location-grid`}>
          {Object.values(SCENES).map((s) => {
            const unlocked = unlockedScenes.includes(s.id)
            const isCurrent = s.id === currentScene
            return (
              <button
                key={s.id}
                className={`${P}-location-item ${isCurrent ? 'current' : ''} ${!unlocked ? 'locked' : ''}`}
                onClick={() => unlocked && selectScene(s.id)}
                disabled={!unlocked}
              >
                <div className={`${P}-location-icon`}>{unlocked ? s.icon : '🔒'}</div>
                <div className={`${P}-location-name`}>{s.name}</div>
                <div className={`${P}-location-status`}>
                  {isCurrent ? '当前' : unlocked ? '可前往' : '未解锁'}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
