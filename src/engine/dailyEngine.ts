// Rule-based consumer AI tool recommendation engine — zero LLM cost.

export type UseCase = 'writing' | 'coding' | 'search' | 'image' | 'video' | 'data' | 'chat' | 'learn';
export type Budget = 'free' | 'paid' | 'any';
export type Priority = 'quality' | 'speed' | 'chinese' | 'privacy';

export interface DailyAnswers {
  useCase?: UseCase;
  budget?: Budget;
  priority?: Priority;
}

export interface ToolRecommendation {
  name: string;
  tagline: string;
  pros: string[];
  tier: 'free' | 'freemium' | 'paid';
  url_hint: string;
  badge?: string;
}

// Decision tree: [useCase, budget, priority] → tools
const TOOL_DB: Record<string, ToolRecommendation> = {
  chatgpt_free: {
    name: 'ChatGPT (免費版)',
    tagline: '通用型 AI 助手，最廣泛使用',
    pros: ['免費可用', '使用人數最多', '外掛生態豐富'],
    tier: 'free',
    url_hint: 'chat.openai.com',
  },
  chatgpt_plus: {
    name: 'ChatGPT Plus (GPT-4o)',
    tagline: '旗艦多模態，視覺 + 語音全能',
    pros: ['圖片理解強', '工具整合多', 'DALL·E 3 內建'],
    tier: 'freemium',
    url_hint: 'chat.openai.com',
    badge: '首推',
  },
  claude: {
    name: 'Claude',
    tagline: '寫作 + 長文分析，繁中最細膩',
    pros: ['繁中語感最自然', '長文理解強', '輸出品質穩定'],
    tier: 'freemium',
    url_hint: 'claude.ai',
    badge: '首推',
  },
  gemini: {
    name: 'Gemini',
    tagline: '深度整合 Google 生態，搜尋即時',
    pros: ['即時網路搜尋', 'Google Docs 整合', '繁中表現佳'],
    tier: 'freemium',
    url_hint: 'gemini.google.com',
  },
  perplexity: {
    name: 'Perplexity',
    tagline: 'AI 搜尋引擎，帶來源即時回答',
    pros: ['每個答案有出處', '即時資訊', '研究效率高'],
    tier: 'freemium',
    url_hint: 'perplexity.ai',
    badge: '首推',
  },
  cursor: {
    name: 'Cursor',
    tagline: 'AI-first 程式碼編輯器',
    pros: ['整合 Claude + GPT', '理解整個 codebase', '工程師首選'],
    tier: 'freemium',
    url_hint: 'cursor.com',
    badge: '首推',
  },
  github_copilot: {
    name: 'GitHub Copilot',
    tagline: '寫程式的即時補全助手',
    pros: ['與 VS Code 無縫整合', '多語言支援', '有免費方案'],
    tier: 'freemium',
    url_hint: 'github.com/features/copilot',
  },
  midjourney: {
    name: 'Midjourney',
    tagline: '商業品質圖像生成首選',
    pros: ['美感最強', '一致風格', '設計師御用'],
    tier: 'paid',
    url_hint: 'midjourney.com',
    badge: '首推',
  },
  ideogram: {
    name: 'Ideogram',
    tagline: '文字融入圖片，排版精準',
    pros: ['文字生成準確', '有免費額度', '適合 banner 設計'],
    tier: 'freemium',
    url_hint: 'ideogram.ai',
  },
  runway: {
    name: 'Runway Gen-3',
    tagline: '短片生成 + 影片編輯 AI',
    pros: ['影片生成品質頂尖', '多功能影像工具', '創作者首選'],
    tier: 'paid',
    url_hint: 'runwayml.com',
    badge: '首推',
  },
  notebooklm: {
    name: 'NotebookLM',
    tagline: '把你的文件變成 AI 知識庫',
    pros: ['直接上傳 PDF/文件', '免費使用', '來源可追蹤'],
    tier: 'free',
    url_hint: 'notebooklm.google.com',
    badge: '首推',
  },
  deepseek_chat: {
    name: 'DeepSeek Chat',
    tagline: '高品質中文推理，完全免費',
    pros: ['推理能力強', '繁中表現佳', '完全免費'],
    tier: 'free',
    url_hint: 'chat.deepseek.com',
    badge: '省錢首選',
  },
  kimi: {
    name: 'Kimi',
    tagline: '長文件閱讀 + 中文理解',
    pros: ['超長 context 免費', '中文優化', '文件上傳方便'],
    tier: 'freemium',
    url_hint: 'kimi.ai',
  },
};

type RuleKey = `${UseCase}_${Budget}_${Priority}` | `${UseCase}_${Budget}` | UseCase;

const RULES: Partial<Record<string, string[]>> = {
  // Writing
  'writing_free_chinese':   ['claude', 'deepseek_chat'],
  'writing_free_quality':   ['claude', 'chatgpt_free'],
  'writing_free':           ['claude', 'chatgpt_free', 'deepseek_chat'],
  'writing_paid_quality':   ['claude', 'chatgpt_plus'],
  'writing_paid_chinese':   ['claude', 'gemini'],
  'writing_paid':           ['claude', 'chatgpt_plus'],
  'writing_any_privacy':    ['deepseek_chat', 'claude'],
  writing:                  ['claude', 'chatgpt_plus', 'deepseek_chat'],

  // Coding
  'coding_free':            ['cursor', 'github_copilot', 'deepseek_chat'],
  'coding_paid_quality':    ['cursor', 'github_copilot'],
  'coding_paid_speed':      ['cursor', 'chatgpt_plus'],
  'coding_paid':            ['cursor', 'github_copilot'],
  'coding_any_privacy':     ['cursor', 'deepseek_chat'],
  coding:                   ['cursor', 'github_copilot', 'claude'],

  // Search / research
  'search_free':            ['perplexity', 'gemini', 'notebooklm'],
  'search_paid':            ['perplexity', 'chatgpt_plus'],
  'search_any_chinese':     ['perplexity', 'gemini', 'kimi'],
  search:                   ['perplexity', 'gemini', 'notebooklm'],

  // Image generation
  'image_free':             ['ideogram', 'chatgpt_free'],
  'image_paid_quality':     ['midjourney', 'chatgpt_plus'],
  'image_paid':             ['midjourney', 'ideogram'],
  image:                    ['midjourney', 'ideogram'],

  // Video
  'video_paid':             ['runway'],
  'video_free':             ['runway'],
  video:                    ['runway'],

  // Data analysis
  'data_free':              ['notebooklm', 'chatgpt_free'],
  'data_paid':              ['chatgpt_plus', 'claude'],
  'data_any_chinese':       ['kimi', 'chatgpt_plus'],
  data:                     ['chatgpt_plus', 'notebooklm', 'claude'],

  // Chat / companion
  'chat_free':              ['chatgpt_free', 'deepseek_chat', 'claude'],
  'chat_paid':              ['chatgpt_plus', 'claude'],
  'chat_any_chinese':       ['deepseek_chat', 'claude', 'kimi'],
  chat:                     ['claude', 'chatgpt_plus', 'chatgpt_free'],

  // Learning
  'learn_free':             ['notebooklm', 'perplexity', 'chatgpt_free'],
  'learn_paid':             ['chatgpt_plus', 'perplexity'],
  'learn_any_chinese':      ['kimi', 'gemini', 'deepseek_chat'],
  learn:                    ['notebooklm', 'perplexity', 'chatgpt_plus'],
};

export function recommendTools(answers: DailyAnswers): ToolRecommendation[] {
  const { useCase, budget, priority } = answers;
  if (!useCase) return [];

  // Try most specific key first, fall back to less specific
  const keys: string[] = [];
  if (budget && priority) keys.push(`${useCase}_${budget}_${priority}`);
  if (budget) keys.push(`${useCase}_${budget}`);
  if (priority) keys.push(`${useCase}_any_${priority}`);
  keys.push(useCase);

  for (const key of keys) {
    const ids = RULES[key];
    if (ids && ids.length > 0) {
      return ids
        .map((id) => TOOL_DB[id])
        .filter(Boolean)
        .slice(0, 3);
    }
  }

  return [TOOL_DB['chatgpt_free'], TOOL_DB['claude']].filter(Boolean);
}

export const USE_CASE_OPTIONS: { value: UseCase; label: string; emoji: string }[] = [
  { value: 'writing',  label: '寫作 / 文案 / 翻譯', emoji: '✏️' },
  { value: 'coding',   label: '寫程式 / 除錯',       emoji: '💻' },
  { value: 'search',   label: '搜尋 / 研究',          emoji: '🔍' },
  { value: 'image',    label: '圖片生成',              emoji: '🖼️' },
  { value: 'video',    label: '影片製作',              emoji: '🎬' },
  { value: 'data',     label: '資料分析 / 文件整理',  emoji: '📊' },
  { value: 'chat',     label: '日常對話 / 陪聊',      emoji: '💬' },
  { value: 'learn',    label: '學習 / 準備考試',      emoji: '📚' },
];

export const BUDGET_OPTIONS: { value: Budget; label: string; desc: string }[] = [
  { value: 'free',  label: '只用免費',    desc: '不想付費，找免費好用的' },
  { value: 'paid',  label: '願意付月費', desc: '品質優先，付費換更好體驗' },
  { value: 'any',   label: '隨便',        desc: '先看推薦再決定' },
];

export const PRIORITY_OPTIONS: { value: Priority; label: string; desc: string }[] = [
  { value: 'quality', label: '品質 / 準確', desc: '回答要精準、有深度' },
  { value: 'speed',   label: '速度',         desc: '回應要快，不想等' },
  { value: 'chinese', label: '中文品質',     desc: '繁體中文要自然流暢' },
  { value: 'privacy', label: '隱私安全',     desc: '不想資料上雲端' },
];
