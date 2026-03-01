/**
 * [INPUT]: None (no external dependencies)
 * [OUTPUT]: All type definitions + constants + characters/scenes/items/chapters/events/endings + utility functions
 * [POS]: lib UI thin layer, consumed by store.ts and all components. Narrative content lives in script.md
 * [PROTOCOL]: Update this header on change, then check CLAUDE.md
 */

// ── Types ──

export interface TimePeriod {
  index: number
  name: string
  icon: string
  hours: string
}

export interface StatMeta {
  key: string
  label: string
  color: string
  icon: string
  category: 'relation' | 'status' | 'skill'
}

export type CharacterStats = Record<string, number>

export interface Character {
  id: string
  name: string
  portrait: string
  gender: 'female' | 'male'
  age: number
  title: string
  description: string
  personality: string
  speakingStyle: string
  secret: string
  triggerPoints: string[]
  behaviorPatterns: string
  themeColor: string
  joinDay: number
  statMetas: StatMeta[]
  initialStats: CharacterStats
}

export interface Scene {
  id: string
  name: string
  icon: string
  description: string
  background: string
  atmosphere: string
  tags: string[]
  unlockCondition?: {
    week?: number
    stat?: { charId: string; key: string; min: number }
  }
}

export interface GameItem {
  id: string
  name: string
  icon: string
  type: 'gift' | 'experience' | 'expression'
  description: string
  maxCount?: number
}

export interface Chapter {
  id: number
  name: string
  dayRange: [number, number]
  description: string
  objectives: string[]
  atmosphere: string
}

export interface ForcedEvent {
  id: string
  name: string
  triggerDay: number
  triggerPeriod?: number
  description: string
}

export interface Ending {
  id: string
  name: string
  type: 'TE' | 'HE' | 'NE' | 'BE'
  description: string
  condition: string
}

export interface StoryRecord {
  id: string
  day: number
  period: string
  title: string
  content: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  character?: string
  timestamp: number
  type?: 'scene-transition' | 'week-change' | 'chapter-change'
  sceneId?: string
  dayInfo?: { week: number; chapter: string }
  episodeInfo?: { episode: number; title: string }
}

// ── Constants ──

export const PERIODS: TimePeriod[] = [
  { index: 0, name: '工作日', icon: '💼', hours: 'Mon-Fri' },
  { index: 1, name: '周末白天', icon: '☀️', hours: 'Sat 日间' },
  { index: 2, name: '周末夜晚', icon: '🌙', hours: 'Sat夜-Sun' },
]

export const MAX_WEEKS = 12
export const MAX_ACTION_POINTS = 3

// ── Player StatMeta ──

export const PLAYER_STAT_METAS: StatMeta[] = [
  { key: 'charm', label: '外貌魅力', color: '#f472b6', icon: '✨', category: 'status' },
  { key: 'communication', label: '沟通表达', color: '#60a5fa', icon: '💬', category: 'skill' },
  { key: 'empathy', label: '共情能力', color: '#34d399', icon: '💗', category: 'skill' },
  { key: 'independence', label: '独立思考', color: '#a78bfa', icon: '🧠', category: 'skill' },
  { key: 'emotional', label: '情绪稳定', color: '#fbbf24', icon: '🌊', category: 'status' },
]

// ── Character StatMeta (shared) ──

const SHARED_STAT_METAS: StatMeta[] = [
  { key: 'affection', label: '好感度', color: '#ff6b8a', icon: '💕', category: 'relation' },
  { key: 'trust', label: '信任度', color: '#22c55e', icon: '🤝', category: 'relation' },
  { key: 'understanding', label: '了解度', color: '#3b82f6', icon: '🔍', category: 'relation' },
]

// ── Characters ──

const LIN_ZHIYUAN: Character = {
  id: 'linzhiyuan',
  name: '林致远',
  portrait: '/characters/linzhiyuan.jpg',
  gender: 'male',
  age: 32,
  title: '顶级律所合伙人律师',
  description: '理性严谨的法律精英，逻辑至上但心底藏着不轻易展露的温柔',
  personality: '理性主义者的浪漫，用逻辑框架理解感情',
  speakingStyle: '简洁有力，逻辑链清晰，偶尔冷幽默',
  secret: '法官母亲检察官父亲，选律师是为走出体制',
  triggerPoints: ['了解度≥60揭示拒绝家族相亲', '好感度≥75取消商务晚宴见你'],
  behaviorPatterns: '精准但不冷漠，心动时打破自己的时间表',
  themeColor: '#2563eb',
  joinDay: 1,
  statMetas: SHARED_STAT_METAS,
  initialStats: { affection: 15, trust: 20, understanding: 5 },
}

const LU_JINGSHEN: Character = {
  id: 'lujingshen',
  name: '陆景深',
  portrait: '/characters/lujingshen.jpg',
  gender: 'male',
  age: 30,
  title: '三甲医院心外科主治医生',
  description: '温柔冷静的心外科医生，照顾别人是他的本能也是他的壳',
  personality: '天生的照顾者，但照顾别人是逃避面对自己',
  speakingStyle: '温和平稳，习惯用问句关心人，深夜话变多',
  secret: '小镇出身全家族期望，一直在给家里汇钱',
  triggerPoints: ['了解度≥50发现他在车里睡觉', '好感度≥70请你帮挑病童礼物'],
  behaviorPatterns: '体贴到近乎完美，真正走近是他展现疲惫时',
  themeColor: '#16a34a',
  joinDay: 1,
  statMetas: SHARED_STAT_METAS,
  initialStats: { affection: 20, trust: 15, understanding: 5 },
}

const ZHOU_ZEYAN: Character = {
  id: 'zhouzeyan',
  name: '周泽言',
  portrait: '/characters/zhouzeyan.jpg',
  gender: 'male',
  age: 35,
  title: '互联网大厂高级技术总监',
  description: '真诚的理工直男，不擅花言巧语但用行动表达爱',
  personality: '技术宅与管理者结合体，真诚到不会包装自己',
  speakingStyle: '言简意赅，技术类比表达感受，谈技术变话痨',
  secret: '家境优渥但刻意低调，有严重社交焦虑',
  triggerPoints: ['了解度≥55教山区孩子编程', '好感度≥65邀你参观智能家居'],
  behaviorPatterns: '爱意体现在帮你解决问题，笨拙但真诚地浪漫',
  themeColor: '#7c3aed',
  joinDay: 1,
  statMetas: SHARED_STAT_METAS,
  initialStats: { affection: 10, trust: 25, understanding: 5 },
}

const QIN_YU: Character = {
  id: 'qinyu',
  name: '秦宇',
  portrait: '/characters/qinyu.jpg',
  gender: 'male',
  age: 33,
  title: '科技公司CEO',
  description: '充满激情的创业者，对待感情像对待创业一样全力投入',
  personality: '天生的领导者和冒险家，自信有感染力',
  speakingStyle: '自信语速快，善用比喻和故事，偶尔冒英文',
  secret: '首次创业失败负债百万靠二次创业翻身',
  triggerPoints: ['了解度≥50发现公司融资困难', '好感度≥70取消海外出差陪你'],
  behaviorPatterns: '高速运转的节奏，想找跟上节奏的伴侣',
  themeColor: '#dc2626',
  joinDay: 1,
  statMetas: SHARED_STAT_METAS,
  initialStats: { affection: 20, trust: 15, understanding: 5 },
}

const SHEN_QINGHE: Character = {
  id: 'shenqinghe',
  name: '沈清和',
  portrait: '/characters/shenqinghe.jpg',
  gender: 'male',
  age: 29,
  title: '知名大学金融系副教授',
  description: '儒雅博学的青年学者，浪漫是为你写诗而非送玫瑰',
  personality: '学者型理想主义者，有时分不清爱人还是爱"爱情"',
  speakingStyle: '措辞讲究，引用文哲典故，消息像小短文',
  secret: '书香门第但经济一般，对婚姻制度有矛盾态度',
  triggerPoints: ['了解度≥55学术专著出版困难', '好感度≥65邀你看私人藏书房'],
  behaviorPatterns: '精神世界丰富，心动时学者从容消失变笨拙',
  themeColor: '#0891b2',
  joinDay: 1,
  statMetas: SHARED_STAT_METAS,
  initialStats: { affection: 15, trust: 20, understanding: 10 },
}

const CHEN_MO: Character = {
  id: 'chenmo',
  name: '陈默',
  portrait: '/characters/chenmo.jpg',
  gender: 'male',
  age: 31,
  title: '独立建筑设计工作室创始人',
  description: '沉默的观察者，不善言辞但眼睛看到别人忽略的一切',
  personality: '感性细腻的创造者，沉默不是冷漠而是深度在场',
  speakingStyle: '话少但精准，常发图片而非文字，设计话题滔滔不绝',
  secret: '有阿斯伯格特质，工作室经营困难但不愿妥协',
  triggerPoints: ['了解度≥50参观工作室', '好感度≥70发现关于你的速写集'],
  behaviorPatterns: '用设计表达爱——为你画速写设计空间',
  themeColor: '#d97706',
  joinDay: 1,
  statMetas: SHARED_STAT_METAS,
  initialStats: { affection: 10, trust: 15, understanding: 5 },
}

const ZHAO_QIHANG: Character = {
  id: 'zhaoqihang',
  name: '赵启航',
  portrait: '/characters/zhaoqihang.jpg',
  gender: 'male',
  age: 28,
  title: '外资投行精英分析师',
  description: '精致的都市社交高手，你永远分不清他的体贴是真心还是技巧',
  personality: '最懂恋爱技巧，成长在于从完美面具到真实的人',
  speakingStyle: '圆滑得体情商极高，每句话都让人舒服',
  secret: '小县城出身靠奖学金读名校，精致是模仿的结果',
  triggerPoints: ['了解度≥45发现他在多平台活跃', '好感度≥60第一次卸下面具'],
  behaviorPatterns: '社交游戏老手，但遇到真心时不知所措',
  themeColor: '#64748b',
  joinDay: 1,
  statMetas: SHARED_STAT_METAS,
  initialStats: { affection: 25, trust: 10, understanding: 5 },
}

const XU_XIANGYANG: Character = {
  id: 'xuxiangyang',
  name: '徐向阳',
  portrait: '/characters/xuxiangyang.jpg',
  gender: 'male',
  age: 34,
  title: '家族餐饮企业接班人',
  description: '温暖踏实的传统好男人，"带回家给爸妈看"的理想对象',
  personality: '大地般温暖的传统好男人，在家族期望和自我间挣扎',
  speakingStyle: '热情直爽接地气，爱用食物比喻，语音多过文字',
  secret: '有绘画天赋被家里否定，几家分店其实在亏损',
  triggerPoints: ['了解度≥50发现他和父亲经营理念冲突', '好感度≥65邀你跟家人吃饭'],
  behaviorPatterns: '用做菜和照顾来表达爱，直球但不粗糙',
  themeColor: '#ea580c',
  joinDay: 1,
  statMetas: SHARED_STAT_METAS,
  initialStats: { affection: 20, trust: 20, understanding: 5 },
}

const YE_FENG: Character = {
  id: 'yefeng',
  name: '叶枫',
  portrait: '/characters/yefeng.jpg',
  gender: 'male',
  age: 27,
  title: '旅行作家/摄影师',
  description: '风一样的自由灵魂，给你诗和远方但不确定能否给稳定明天',
  personality: '浪漫不羁的自由主义者，渴望归属却害怕定下来',
  speakingStyle: '文艺有画面感，说话像讲故事，偶尔消失几天',
  secret: '父母15岁时离婚，旅行是逃避"家"的方式',
  triggerPoints: ['了解度≥45未公开的"留不住的人"摄影集', '好感度≥65取消旅行陪你过生日'],
  behaviorPatterns: '用镜头和文字记录你，为你考虑停下来',
  themeColor: '#059669',
  joinDay: 1,
  statMetas: SHARED_STAT_METAS,
  initialStats: { affection: 20, trust: 15, understanding: 10 },
}

const HAN_DONG: Character = {
  id: 'handong',
  name: '韩东',
  portrait: '/characters/handong.jpg',
  gender: 'male',
  age: 36,
  title: '公务员正科级干部',
  description: '规则的忠实守护者，他的可预测性本身就是稀缺品质',
  personality: '稳重踏实把稳定看作最高价值，内心藏着不切实际的梦',
  speakingStyle: '稳重正式，措辞谨慎用"可能""一般来说"，从不发语音',
  secret: '偷偷写了三年科幻小说从未给任何人看过',
  triggerPoints: ['了解度≥50发现他在写小说', '好感度≥60请假陪你看病'],
  behaviorPatterns: '中规中矩但偶尔的打破常规最动人',
  themeColor: '#475569',
  joinDay: 1,
  statMetas: SHARED_STAT_METAS,
  initialStats: { affection: 15, trust: 25, understanding: 5 },
}

export function buildCharacters(): Record<string, Character> {
  return {
    linzhiyuan: LIN_ZHIYUAN,
    lujingshen: LU_JINGSHEN,
    zhouzeyan: ZHOU_ZEYAN,
    qinyu: QIN_YU,
    shenqinghe: SHEN_QINGHE,
    chenmo: CHEN_MO,
    zhaoqihang: ZHAO_QIHANG,
    xuxiangyang: XU_XIANGYANG,
    yefeng: YE_FENG,
    handong: HAN_DONG,
  }
}

// ── Scenes ──

export const SCENES: Record<string, Scene> = {
  yuanqi: {
    id: 'yuanqi',
    name: '缘起APP',
    icon: '📱',
    description: '线上聊天空间，你们的故事从这里开始',
    background: '/scenes/yuanqi.jpg',
    atmosphere: '既亲密又疏离，文字搭建的暧昧世界',
    tags: ['线上', '全时段'],
  },
  cafe: {
    id: 'cafe',
    name: '城市咖啡馆',
    icon: '☕',
    description: '安全轻松的首次见面场所',
    background: '/scenes/cafe.jpg',
    atmosphere: '咖啡香与爵士乐，试探阶段的安全港',
    tags: ['约会', '休闲'],
  },
  restaurant: {
    id: 'restaurant',
    name: '米其林餐厅',
    icon: '🍷',
    description: '优雅正式的深度约会场所',
    background: '/scenes/restaurant.jpg',
    atmosphere: '烛光银器白桌布，这不是随便聊聊',
    tags: ['约会', '正式'],
    unlockCondition: { week: 3 },
  },
  gallery: {
    id: 'gallery',
    name: '当代艺术中心',
    icon: '🎨',
    description: '文艺而充满对话契机的展览空间',
    background: '/scenes/gallery.jpg',
    atmosphere: '白色展厅抽象画作，每幅画前都是价值观测试',
    tags: ['文艺', '约会'],
  },
  riverside: {
    id: 'riverside',
    name: '滨江步道',
    icon: '🌊',
    description: '自然放松的户外漫步约会地',
    background: '/scenes/riverside.jpg',
    atmosphere: '江风拂面并肩而行，沉默也不尴尬',
    tags: ['户外', '浪漫'],
  },
  business: {
    id: 'business',
    name: '商务中心',
    icon: '🏢',
    description: '工作生活交集的偶遇之地',
    background: '/scenes/business.jpg',
    atmosphere: '效率和野心的领地，非约会的真实面',
    tags: ['工作', '偶遇'],
    unlockCondition: { week: 4 },
  },
  rooftop: {
    id: 'rooftop',
    name: '屋顶花园酒吧',
    icon: '🌃',
    description: '微醺夜晚的深度交流空间',
    background: '/scenes/rooftop.jpg',
    atmosphere: '城市全景串灯微风，酒精催生坦诚',
    tags: ['夜晚', '浪漫'],
    unlockCondition: { week: 6 },
  },
}

// ── Items ──

export const ITEMS: Record<string, GameItem> = {
  roses: {
    id: 'roses',
    name: '玫瑰花束',
    icon: '🌹',
    type: 'gift',
    description: '经典约会礼物，直接表达好感',
    maxCount: 3,
  },
  dessert: {
    id: 'dessert',
    name: '手工甜点',
    icon: '🍫',
    type: 'gift',
    description: '温馨走心的甜蜜心意',
    maxCount: 3,
  },
  booklist: {
    id: 'booklist',
    name: '推荐书单',
    icon: '📚',
    type: 'gift',
    description: '展示精神世界契合度的礼物',
    maxCount: 2,
  },
  concert: {
    id: 'concert',
    name: '音乐会门票',
    icon: '🎵',
    type: 'experience',
    description: '创造共同文化体验的邀请',
    maxCount: 2,
  },
  letter: {
    id: 'letter',
    name: '手写信',
    icon: '💌',
    type: 'expression',
    description: '最真诚的情感表达',
    maxCount: 3,
  },
  candle: {
    id: 'candle',
    name: '香薰蜡烛',
    icon: '🕯️',
    type: 'gift',
    description: '营造私密氛围的格调之选',
    maxCount: 2,
  },
}

// ── Chapters ──

export const CHAPTERS: Chapter[] = [
  {
    id: 1,
    name: '初识·线上破冰期',
    dayRange: [1, 3],
    description: '在缘起APP上与10位男嘉宾展开对话，建立第一印象',
    objectives: ['与至少5位男嘉宾完成首次深度聊天', '筛选出首批线下见面对象'],
    atmosphere: '新鲜、好奇、充满可能性',
  },
  {
    id: 2,
    name: '接触·线下约会期',
    dayRange: [4, 6],
    description: '与心仪男嘉宾进行线下约会，深入观察真实性格',
    objectives: ['完成至少3次线下约会', '记录每次约会的心动瞬间和犹豫点'],
    atmosphere: '期待、紧张、心跳加速',
  },
  {
    id: 3,
    name: '交织·生活渗透期',
    dayRange: [7, 9],
    description: '生活交集开始出现，在非约会场景中考验真实契合度',
    objectives: ['经历至少2次生活交集事件', '关注男嘉宾在非约会状态下的表现'],
    atmosphere: '深入、复杂、真假交织',
  },
  {
    id: 4,
    name: '抉择·关系定义期',
    dayRange: [10, 12],
    description: '综合考虑情感、价值观和现实因素，做出最终选择',
    objectives: ['与至少2位男嘉宾进行关于未来的深度对话', '做出最终抉择'],
    atmosphere: '纠结、成熟、尘埃落定',
  },
]

// ── Forced Events ──

export const FORCED_EVENTS: ForcedEvent[] = [
  {
    id: 'bestie_talk',
    name: '闺蜜分析会',
    triggerDay: 3,
    triggerPeriod: 2,
    description: '闺蜜约你出来要求你分享所有男嘉宾的情况，她的点评犀利但不一定客观',
  },
  {
    id: 'multi_invite',
    name: '多人邀约冲突',
    triggerDay: 5,
    triggerPeriod: 1,
    description: '三位以上男嘉宾同时邀约这个周末，你必须做出取舍',
  },
  {
    id: 'life_encounter',
    name: '职场偶遇',
    triggerDay: 7,
    triggerPeriod: 0,
    description: '在工作场景中与某位男嘉宾不期而遇，看到他约会之外的真实面',
  },
  {
    id: 'parents_ask',
    name: '父母过问',
    triggerDay: 9,
    triggerPeriod: 2,
    description: '父母开始询问交友进展，对不同男嘉宾的职业和背景有不同态度',
  },
  {
    id: 'showdown',
    name: '关系摊牌',
    triggerDay: 11,
    triggerPeriod: 2,
    description: '与你互动最多的男嘉宾主动提出确定关系，你必须给出回应',
  },
]

// ── Endings ──

export const ENDINGS: Ending[] = [
  {
    id: 'be-regret',
    name: '遗憾错过',
    type: 'BE',
    description: '你最心动的那个人，因为犹豫和时机错过，最终选择了退出',
    condition: '好感度最高≥70但信任度<40',
  },
  {
    id: 'te-perfect',
    name: '挚爱圆满',
    type: 'TE',
    description: '经历了完整的认识过程，你们建立起深厚健康充满承诺的关系',
    condition: '某男嘉宾好感度≥85且信任度≥80且了解度≥75',
  },
  {
    id: 'he-growth',
    name: '自我成长',
    type: 'HE',
    description: '在择偶旅程中厘清自我需求，实现了事业或个人的重大突破',
    condition: '独立思考≥85且共情能力≥80，无任何好感度≥70',
  },
  {
    id: 'ne-compromise',
    name: '现实妥协',
    type: 'NE',
    description: '选择了"合适"维度得分最高但情感火花平淡的伴侣',
    condition: '某男嘉宾好感度60-84且信任度≥60',
  },
  {
    id: 'ne-explore',
    name: '开放探索',
    type: 'NE',
    description: '拒绝在有限时间内做出最终抉择，带着成长继续探索',
    condition: '不满足以上任何条件',
  },
]

// ── Story Info ──

export const STORY_INFO = {
  title: '都市情缘',
  subtitle: '现代都市相亲模拟器',
  description: '化身都市独立女性，通过缘起APP结识10位优质男嘉宾，在心动与合适之间寻找答案',
  objective: '找到与你灵魂契合的伴侣，或发现更好的自己',
  era: '当代都市',
}

// ── Quick Actions ──

export const QUICK_ACTIONS: string[] = [
  '💬 深入聊天',
  '💕 表达好感',
  '🤔 试探了解',
  '👀 冷静观察',
]

// ── Utility Functions ──

export function getStatLevel(value: number) {
  if (value >= 80) return { level: 4, name: '情比金坚', color: '#ff6b8a' }
  if (value >= 60) return { level: 3, name: '心意渐明', color: '#f472b6' }
  if (value >= 30) return { level: 2, name: '初有好感', color: '#94a3b8' }
  return { level: 1, name: '初识阶段', color: '#64748b' }
}

export function getAvailableCharacters(
  day: number,
  characters: Record<string, Character>
): Record<string, Character> {
  return Object.fromEntries(
    Object.entries(characters).filter(([, char]) => char.joinDay <= day)
  )
}

export function getCurrentChapter(day: number): Chapter {
  return CHAPTERS.find((ch) => day >= ch.dayRange[0] && day <= ch.dayRange[1])
    ?? CHAPTERS[0]
}

export function getDayEvents(
  day: number,
  triggeredEvents: string[]
): ForcedEvent[] {
  return FORCED_EVENTS.filter(
    (e) => e.triggerDay === day && !triggeredEvents.includes(e.id)
  )
}
