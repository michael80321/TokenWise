export interface ModelPricing {
  id: string;
  name: string;
  provider: string;
  input_per_mtok: number;
  output_per_mtok: number;
  context_window: number;
  supports_cache: boolean;
  cache_discount: number | null;
  long_context_surcharge: number | null;
  tool_calling: boolean;
  json_mode: boolean;
  mcp: boolean;
  quality_score: number;
  speed_toks: number;
  notes: string;
}

export interface PricingData {
  last_updated: string;
  models: ModelPricing[];
}

export type SortKey = 'quality' | 'price' | 'cp_value';
