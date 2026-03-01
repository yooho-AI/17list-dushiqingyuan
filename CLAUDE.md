# 都市情缘 — AI 现代女性相亲模拟器

React 19 + Zustand 5 + Immer + Vite 7 + Tailwind CSS v4 + Framer Motion + Cloudflare Pages

## 架构

```
17list-dushiqingyuan/
├── worker/index.js              - ☆ CF Worker API 代理（备用，未部署）
├── public/
│   ├── audio/bgm.mp3            - 背景音乐
│   ├── characters/              - 10 角色立绘 9:16 竖版 (1440x2560)
│   └── scenes/                  - 7 场景背景 9:16 竖版 (1440x2560)
├── src/
│   ├── main.tsx                 - ☆ React 入口
│   ├── vite-env.d.ts            - Vite 类型声明
│   ├── App.tsx                  - 根组件: 三阶段开场(Splash→嘉宾闪切→角色创建) + GameScreen + EndingModal + MenuOverlay
│   ├── lib/
│   │   ├── script.md            - ★ 剧本直通：五模块原文（零转换注入 prompt）
│   │   ├── data.ts              - ★ UI 薄层：类型(含富消息扩展) + 10角色 + 7场景 + 6道具 + 4章节 + 5事件 + 5结局
│   │   ├── store.ts             - ★ 状态中枢：Zustand + 富消息插入(场景/换周) + 抽屉状态 + StoryRecord + Analytics + 双轨解析
│   │   ├── parser.ts            - AI 回复解析（10角色着色 + 数值着色）
│   │   ├── analytics.ts         - Umami 埋点（ds_ 前缀）
│   │   ├── stream.ts            - ☆ SSE 流式通信
│   │   ├── bgm.ts               - ☆ 背景音乐
│   │   └── hooks.ts             - ☆ useMediaQuery / useIsMobile
│   ├── styles/
│   │   ├── globals.css          - 全局基础样式（ds- 前缀）
│   │   ├── opening.css          - 开场样式：Splash + 嘉宾闪切 + 角色创建
│   │   └── rich-cards.css       - 富UI组件：场景卡 + 周变卡 + 档案卡 + NPC气泡 + DashboardDrawer + RecordSheet + SVG关系图 + Toast
│   └── components/game/
│       ├── app-shell.tsx        - 居中壳 + Header(📓+📜) + 三向手势 + Tab路由 + TabBar + DashboardDrawer + RecordSheet + Toast
│       ├── dashboard-drawer.tsx - 恋爱手帐(左抽屉)：扉页+缘分速览+场景网格+恋爱目标+个人属性+背包。Reorder拖拽排序
│       ├── tab-dialogue.tsx     - 对话Tab：富消息路由(SceneCard/WeekCard逐字打字机/NPC头像气泡) + 快捷操作 + 背包
│       ├── tab-scene.tsx        - 场景Tab：9:16大图 + 头像嘉宾标签 + 地点列表
│       └── tab-character.tsx    - 人物Tab：立绘 + 属性条 + SVG RelationGraph + 关系列表 + CharacterDossier 全屏档案
├── index.html
├── package.json
├── vite.config.ts               - ☆
├── tsconfig*.json               - ☆
└── wrangler.toml                - ☆
```

★ = 种子文件 ☆ = 零修改模板

## 核心设计

- **现代都市恋爱模拟**：10 位男嘉宾多线叙事，线上+线下约会深度结合
- **双轨数值**：5 全局属性（魅力/沟通/共情/独立/情绪）+ NPC 好感/信任/了解
- **暗色玫粉主题**：深蓝底(#0f1629)+玫粉(#ff6b8a)，暗色毛玻璃，ds- CSS 前缀
- **3 时段制**：每周 3 时段（工作日/周末白天/周末夜晚），共 36 时间槽
- **剧本直通**：script.md 存五模块原文，?raw import 注入 prompt
- **5 结局**：BE(遗憾错过) + TE(挚爱圆满) + HE(自我成长) + NE1(现实妥协) + NE2(开放探索)

## 富UI组件系统

| 组件 | 位置 | 触发 | 视觉风格 |
|------|------|------|----------|
| SplashScreen | App.tsx | 开场Phase1 | 全屏深蓝渐变+心形粒子+shimmer Logo+脉冲CTA |
| CharacterMontage | App.tsx | 开场Phase2 | 10角色立绘顺序闪现(1.8s/人)，交替左右滑入 |
| DashboardDrawer | dashboard-drawer | Header📓+右滑手势 | 毛玻璃+淡玫粉：扉页+缘分速览(好感条)+场景缩略图+目标清单+属性药丸+道具格+Reorder拖拽 |
| RecordSheet | app-shell | Header📜+左滑手势 | 右侧滑入事件记录：时间线倒序+粉色圆点 |
| SceneTransitionCard | tab-dialogue | selectScene | 场景背景+Ken Burns(8s)+渐变遮罩+粉色角标 |
| WeekCard | tab-dialogue | 换周 | 弹簧落入+逐字打字机(80ms)+章节名 |
| RelationGraph | tab-character | 始终可见 | SVG环形布局，中心"我"+10NPC立绘节点+连线+关系标签 |
| CharacterDossier | tab-character | 点击角色 | 全屏右滑入+50vh立绘呼吸动画+好感阶段+触发暗示 |
| Toast | app-shell | saveGame | TabBar上方弹出"✅ 已保存"2s消失 |

## 三向手势导航

- **右滑**（任意主Tab内容区）→ 左侧恋爱手帐
- **左滑**（任意主Tab内容区）→ 右侧事件记录
- Header 按钮（📓/📜）同等触发
- 手帐内组件支持拖拽排序（Reorder + localStorage `ds-dash-order` 持久化）

## Store 状态扩展

- `showDashboard: boolean` — 左抽屉开关
- `showRecords: boolean` — 右抽屉开关
- `storyRecords: StoryRecord[]` — 事件记录（sendMessage 和 advanceTime 自动追加）
- `selectCharacter` 末尾自动跳转 dialogue Tab

## 富消息机制

Message 类型扩展 `type` 字段路由渲染：
- `scene-transition` → SceneTransitionCard（selectScene 触发）
- `week-change` → WeekCard（advanceTime 换周时触发）
- NPC 消息带 `character` 字段 → 28px 圆形立绘头像

## 链式反应

- 高好感(≥70)嫉妒效应：其他好感>40角色信任-3
- 多线追求(3+角色好感≥50)：全员信任-5

## Analytics 集成

- `trackGameStart` / `trackPlayerCreate` → App.tsx 开场
- `trackGameContinue` → App.tsx 继续游戏
- `trackTimeAdvance` / `trackChapterEnter` → store.ts advanceTime
- `trackEndingReached` → store.ts checkEnding
- `trackSceneUnlock` → store.ts selectScene/advanceTime

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
