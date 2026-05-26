const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

export interface MeResponse {
  userId: string;
  email: string;
  tier: 'free' | 'pro';
}

export async function requestOTP(email: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? '發送失敗');
}

export async function verifyOTP(email: string, code: string): Promise<string> {
  const res = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? '驗證失敗');
  return data.token as string;
}

export async function fetchMe(token: string): Promise<MeResponse> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Unauthorized');
  return res.json() as Promise<MeResponse>;
}
