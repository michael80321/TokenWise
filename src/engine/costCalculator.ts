export interface CostInput {
  inputTokens: number;
  outputTokens: number;
  requestsPerMonth: number;
  useCache: boolean;
  cacheHitRate: number; // 0–1
  useBatch: boolean;    // batch discount typically 50% off input
}

export interface ModelCostResult {
  modelId: string;
  monthlyCostUSD: number;
  yearlyCostUSD: number;
  inputCostUSD: number;
  outputCostUSD: number;
  savings?: {
    cacheUSD: number;
    batchUSD: number;
  };
}

interface PricingRow {
  id: string;
  input_per_mtok: number;
  output_per_mtok: number;
  supports_cache: boolean;
  cache_discount: number | null;
}

export function calcMonthlyCost(model: PricingRow, input: CostInput): ModelCostResult {
  const totalInputTokens = input.inputTokens * input.requestsPerMonth;
  const totalOutputTokens = input.outputTokens * input.requestsPerMonth;

  let effectiveInputRate = model.input_per_mtok;
  let cachesSavingsUSD = 0;
  let batchSavingsUSD = 0;

  // Cache: cache_discount is % off (e.g. 0.9 = 90% off cached portion)
  if (input.useCache && model.supports_cache && model.cache_discount != null) {
    const cachedTokens = totalInputTokens * input.cacheHitRate;
    const uncachedTokens = totalInputTokens * (1 - input.cacheHitRate);
    const cachedCost = (cachedTokens / 1_000_000) * model.input_per_mtok * (1 - model.cache_discount);
    const uncachedCost = (uncachedTokens / 1_000_000) * model.input_per_mtok;
    const withCache = cachedCost + uncachedCost;
    const withoutCache = (totalInputTokens / 1_000_000) * model.input_per_mtok;
    cachesSavingsUSD = withoutCache - withCache;
    effectiveInputRate = (withCache / (totalInputTokens / 1_000_000));
  }

  // Batch: 50% off input (industry standard, varies by provider)
  let batchInputRate = effectiveInputRate;
  if (input.useBatch) {
    batchInputRate = effectiveInputRate * 0.5;
    batchSavingsUSD = ((totalInputTokens / 1_000_000) * effectiveInputRate) -
                      ((totalInputTokens / 1_000_000) * batchInputRate);
  }

  const inputCostUSD = (totalInputTokens / 1_000_000) * batchInputRate;
  const outputCostUSD = (totalOutputTokens / 1_000_000) * model.output_per_mtok;
  const monthlyCostUSD = inputCostUSD + outputCostUSD;

  return {
    modelId: model.id,
    monthlyCostUSD,
    yearlyCostUSD: monthlyCostUSD * 12,
    inputCostUSD,
    outputCostUSD,
    savings: {
      cacheUSD: cachesSavingsUSD,
      batchUSD: batchSavingsUSD,
    },
  };
}

export function formatUSD(amount: number): string {
  if (amount === 0) return '$0';
  if (amount < 0.01) return `$${amount.toFixed(4)}`;
  if (amount < 1) return `$${amount.toFixed(3)}`;
  if (amount < 1000) return `$${amount.toFixed(2)}`;
  return `$${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}
