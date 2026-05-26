// Rule-based scenario recommendation engine — zero LLM cost, runs entirely client-side.
// Logic: user answers are mapped to tag scores, top-scoring models are returned with rationale.

export type ScenarioTag =
  | 'high_volume'      // >500k tokens/day
  | 'low_volume'       // <50k tokens/day
  | 'long_context'     // needs >64k context
  | 'tool_calling'     // needs function/tool calling
  | 'json_output'      // needs reliable JSON mode
  | 'mcp_needed'       // needs MCP support
  | 'cost_sensitive'   // budget is primary concern
  | 'quality_first'    // quality is primary concern
  | 'speed_first'      // latency is primary concern
  | 'privacy'          // prefers self-hostable / open-source
  | 'chinese_heavy'    // heavy traditional/simplified Chinese
  | 'reasoning'        // complex multi-step reasoning
  | 'multimodal'       // vision / image input needed
  | 'caching'          // high prompt repetition → cache helps
  | 'agent_workflow';  // autonomous agent / multi-step workflow

export interface ScenarioQuestion {
  id: string;
  question: string;
  options: { label: string; tags: ScenarioTag[]; value: string }[];
}

export const SCENARIO_QUESTIONS: ScenarioQuestion[] = [
  {
    id: 'use_case',
    question: '你的主要使用情境是什麼？',
    options: [
      { value: 'chatbot', label: '客服 / 對話機器人', tags: ['high_volume', 'chinese_heavy'] },
      { value: 'rag', label: 'RAG / 知識庫問答', tags: ['long_context', 'json_output', 'caching'] },
      { value: 'agent', label: 'AI Agent / 自動化流程', tags: ['tool_calling', 'agent_workflow', 'json_output'] },
      { value: 'content', label: '內容生成 / 寫作', tags: ['quality_first', 'chinese_heavy'] },
      { value: 'code', label: '程式生成 / 除錯', tags: ['quality_first', 'tool_calling', 'json_output'] },
      { value: 'analysis', label: '資料分析 / 摘要', tags: ['long_context', 'json_output'] },
      { value: 'vision', label: '圖片理解 / 多模態', tags: ['multimodal'] },
      { value: 'reasoning', label: '複雜推理 / 數學', tags: ['reasoning', 'quality_first'] },
    ],
  },
  {
    id: 'volume',
    question: '預估每天的 token 用量（input + output）？',
    options: [
      { value: 'tiny',   label: '< 10 萬 token',   tags: ['low_volume'] },
      { value: 'small',  label: '10–100 萬 token',  tags: [] },
      { value: 'medium', label: '100–500 萬 token', tags: ['high_volume', 'caching'] },
      { value: 'large',  label: '500 萬+ token',    tags: ['high_volume', 'cost_sensitive', 'caching'] },
    ],
  },
  {
    id: 'priority',
    question: '你最在乎哪個維度？',
    options: [
      { value: 'quality', label: '品質 / 準確度', tags: ['quality_first'] },
      { value: 'cost',    label: '成本 / CP 值',  tags: ['cost_sensitive'] },
      { value: 'speed',   label: '回應速度',       tags: ['speed_first'] },
      { value: 'privacy', label: '資料隱私',       tags: ['privacy'] },
    ],
  },
  {
    id: 'context',
    question: '你的 prompt 通常多長？',
    options: [
      { value: 'short',  label: '短（< 4K token）',   tags: [] },
      { value: 'medium', label: '中（4K–32K token）',  tags: [] },
      { value: 'long',   label: '長（32K–100K token）', tags: ['long_context'] },
      { value: 'ultra',  label: '超長（100K+ token）',  tags: ['long_context', 'cost_sensitive'] },
    ],
  },
  {
    id: 'features',
    question: '你需要哪些技術功能？（可多選）',
    options: [
      { value: 'tools',   label: 'Tool Calling / Function Call', tags: ['tool_calling'] },
      { value: 'json',    label: '結構化 JSON 輸出',              tags: ['json_output'] },
      { value: 'mcp',     label: 'MCP 支援',                      tags: ['mcp_needed'] },
      { value: 'chinese', label: '繁體中文品質要求高',             tags: ['chinese_heavy'] },
    ],
  },
];

// Model tag affinity scores: how well each model matches each scenario tag.
// Scale: 0 (no match) to 5 (perfect match)
const MODEL_AFFINITIES: Record<string, Partial<Record<ScenarioTag, number>>> = {
  'claude-opus-4-7': {
    quality_first: 5, reasoning: 5, agent_workflow: 5,
    tool_calling: 5, json_output: 5, mcp_needed: 5,
    long_context: 5, chinese_heavy: 4, caching: 4,
    high_volume: 1, cost_sensitive: 1, speed_first: 2,
  },
  'claude-sonnet-4-6': {
    quality_first: 4, reasoning: 4, agent_workflow: 4,
    tool_calling: 5, json_output: 5, mcp_needed: 5,
    long_context: 4, chinese_heavy: 4, caching: 4,
    high_volume: 3, cost_sensitive: 3, speed_first: 3,
  },
  'claude-haiku-4-5': {
    speed_first: 4, high_volume: 4, cost_sensitive: 4,
    tool_calling: 4, json_output: 4, caching: 4,
    chinese_heavy: 3, long_context: 3, quality_first: 2,
    reasoning: 2, agent_workflow: 2,
  },
  'gpt-4o-2025': {
    quality_first: 5, reasoning: 4, multimodal: 5,
    tool_calling: 5, json_output: 5, long_context: 3,
    chinese_heavy: 3, agent_workflow: 4, caching: 3,
    cost_sensitive: 2, high_volume: 2,
  },
  'gpt-4o-mini': {
    cost_sensitive: 4, speed_first: 4, high_volume: 4,
    tool_calling: 4, json_output: 4, caching: 3,
    chinese_heavy: 2, quality_first: 2, reasoning: 2,
  },
  'gemini-2-5-pro': {
    long_context: 5, chinese_heavy: 5, quality_first: 4,
    reasoning: 4, multimodal: 4, high_volume: 3,
    tool_calling: 4, json_output: 4, cost_sensitive: 3,
    agent_workflow: 3,
  },
  'gemini-2-0-flash': {
    speed_first: 5, high_volume: 5, cost_sensitive: 5,
    long_context: 5, chinese_heavy: 4, tool_calling: 3,
    json_output: 3, quality_first: 2, reasoning: 2,
  },
  'deepseek-v3': {
    cost_sensitive: 5, high_volume: 5, chinese_heavy: 5,
    quality_first: 3, json_output: 3, tool_calling: 3,
    caching: 4, speed_first: 3, reasoning: 2,
  },
  'deepseek-r1': {
    reasoning: 5, quality_first: 4, cost_sensitive: 4,
    chinese_heavy: 4, privacy: 3, high_volume: 2,
    tool_calling: 1, json_output: 1,
  },
  'llama-3-3-70b': {
    privacy: 5, cost_sensitive: 4, tool_calling: 3,
    json_output: 3, high_volume: 3, chinese_heavy: 2,
    quality_first: 2, reasoning: 2,
  },
};

const RATIONALE_TEMPLATES: Partial<Record<ScenarioTag, string>> = {
  cost_sensitive: '成本控制是你的優先，這個模型的 CP 值在同等品質中最高',
  quality_first: '以你的使用情境，品質是關鍵，這個模型在這個維度表現最穩',
  high_volume: '高流量場景，這個模型的吞吐量與單價最適合大量呼叫',
  long_context: '你的 context 很長，這個模型的 context window 足夠應付',
  tool_calling: '你需要 tool calling，這個模型的工具呼叫穩定性經過大量驗證',
  reasoning: '複雜推理場景，這個模型的思鏈能力讓結果更可靠',
  chinese_heavy: '繁中品質要求高，這個模型在中文理解與生成上表現細膩',
  privacy: '資料隱私是你的顧慮，這個模型可自行託管或走私有部署',
  multimodal: '你需要圖片理解，這個模型的多模態能力最成熟',
  agent_workflow: '多步驟 agent 工作流，這個模型的工具串接與指令遵循最穩定',
  mcp_needed: '你需要 MCP 支援，目前原生支援 MCP 的選擇有限',
  caching: '你的 prompt 重複率高，這個模型的 cache 折扣能大幅降低實際費用',
  speed_first: '低延遲需求，這個模型的響應速度在同等品質中最快',
};

export interface Recommendation {
  modelId: string;
  score: number;
  primaryTag: ScenarioTag;
  rationale: string;
}

export function recommend(selectedTags: ScenarioTag[]): Recommendation[] {
  const tagSet = new Set(selectedTags);
  const scores: Record<string, number> = {};

  for (const [modelId, affinities] of Object.entries(MODEL_AFFINITIES)) {
    let score = 0;
    for (const tag of tagSet) {
      score += affinities[tag] ?? 0;
    }
    scores[modelId] = score;
  }

  const ranked = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return ranked.map(([modelId, score]) => {
    // Find the highest-affinity tag for this model among selected tags
    const affinities = MODEL_AFFINITIES[modelId] ?? {};
    let bestTag: ScenarioTag = selectedTags[0] ?? 'quality_first';
    let bestAffinity = -1;
    for (const tag of tagSet) {
      const a = affinities[tag] ?? 0;
      if (a > bestAffinity) { bestAffinity = a; bestTag = tag; }
    }

    const rationale = RATIONALE_TEMPLATES[bestTag] ?? '綜合你的需求，這個模型是不錯的起點';
    return { modelId, score, primaryTag: bestTag, rationale };
  });
}
