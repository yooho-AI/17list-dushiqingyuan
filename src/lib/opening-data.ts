/**
 * [INPUT]: 无外部依赖
 * [OUTPUT]: COVER 封面配置 + PROLOGUE 序幕配置
 * [POS]: 开场序列数据源：封面文案 + 缘起APP聊天 + 名字采集
 * [PROTOCOL]: ★ 种子文件，变更时更新此头部
 */

export const COVER = {
  video: '/video/landing.mp4',
  poster: '/video/landing-poster.jpg',
  title: '都市情缘',
  subtitle: '现 代 女 性 相 亲 模 拟 器',
  slogan: '在心动与合适之间，寻找属于你的答案',
}

export const PROLOGUE = {
  chatMessages: [
    { text: '亲爱的，欢迎来到缘起APP！', highlight: false },
    { text: '你的身份已通过VIP认证 ✨', highlight: false },
    { text: '我们为你精选了10位优质男嘉宾', highlight: false },
    { text: '律师、医生、教授、CEO……各行各业的精英都在这里', highlight: false },
    { text: '记住：跟着心走，但也别忘了理性判断 💕', highlight: true },
  ],
  nameInput: {
    label: '昵称',
    placeholder: '输入你的名字',
    maxLength: 8,
    ctaText: '开始匹配',
  },
  randomNames: ['苏婉', '夏晴', '林悦', '陈思雨', '沈暮雪', '叶知秋', '温若初', '江念瑶'],
}
