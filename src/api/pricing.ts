import { PricingData } from '../data/types';
import fallbackData from '../data/pricing.json';

// Set this to your Railway backend URL after deploy
// e.g. https://tokenwise-backend-production.up.railway.app
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export async function fetchPricing(): Promise<PricingData> {
  if (!API_BASE_URL) {
    // No backend configured — use local fallback (dev / offline)
    return fallbackData as PricingData;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/pricing`, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    return data as PricingData;
  } catch (err) {
    console.warn('Failed to fetch live pricing, using local fallback:', err);
    return fallbackData as PricingData;
  }
}
