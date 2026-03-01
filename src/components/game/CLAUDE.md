# 组件层 L2 — 都市情缘

## 组件职责

### app-shell.tsx
- **唯一布局入口**（零 isMobile 分叉）
- Header: 📓(恋爱手帐) + ⚡AP + 时间 + 章节 + 🎵BGM + ☰菜单 + 📜(记录)
- TabContent: AnimatePresence 切换 dialogue/scene/character
- TabBar: 3按钮 + safe-area
- DashboardDrawer: 左侧滑入
- RecordSheet: 右侧滑入（事件记录倒序时间线）
- 三向手势: touchStart/touchEnd dx>60 → 抽屉

### dashboard-drawer.tsx
- **恋爱手帐**（左抽屉）
- 固定扉页: 玩家名/周数/章节/AP
- 5个可拖拽排序段: 缘分速览(好感条)/约会场景(3列网格)/恋爱目标/个人属性(药丸)/背包(道具)
- Reorder.Group + useDragControls
- 持久化: localStorage `ds-dash-order`

### tab-dialogue.tsx
- **对话主界面**
- 富消息路由: type=scene-transition→SceneCard | type=week-change→WeekCard | role→气泡
- NPC气泡: 圆形立绘头像+charColor左边框
- QuickActions: 2×2网格(深入聊天/表达好感/试探了解/冷静观察)
- InputArea: 背包按钮+输入框+发送
- InventorySheet: 底部上滑3列道具网格

### tab-scene.tsx
- **场景浏览**（纯展示，无Framer Motion）
- SceneHero: 9:16大图+渐变遮罩+场景名+氛围
- 嘉宾列表: 28px头像+名字，点击→selectCharacter+切Tab
- 地点列表: 2列网格，当前/可前往/未解锁三态

### tab-character.tsx
- **人物详情**
- PortraitHero: 9:16立绘，点击打开全屏档案
- StatBars: 好感/信任/了解三条动画条
- 我的属性: PLAYER_STAT_METAS驱动5条
- RelationGraph: SVG环形布局(中心"我"+10节点)
- 全部嘉宾列表: 头像+名字+好感值
- CharacterDossier: 全屏右滑入，50vh呼吸立绘+标签+数值条+可展开性格

## 数据流

```
store.ts (Zustand)
  ↓ useGameStore()
  ├── app-shell.tsx → activeTab, show*, toggle*
  ├── dashboard-drawer.tsx → characters, characterStats, playerStats, inventory
  ├── tab-dialogue.tsx → messages, isTyping, sendMessage, inventory
  ├── tab-scene.tsx → currentScene, unlockedScenes, selectScene
  └── tab-character.tsx → currentCharacter, characters, characterStats, playerStats
```

## 关键模式

- CSS 前缀: `ds-` 统一
- 角色图片: `portrait` 单字段（9:16竖版）
- 富消息: `Message.type` 字段驱动组件渲染
- 数值条: StatMeta 驱动，零 if/else
- 结局弹窗: ENDING_TYPE_MAP 数据驱动
