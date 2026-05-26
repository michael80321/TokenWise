import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

type Tier = 'free' | 'pro';

interface SubscriptionContextValue {
  tier: Tier;
  isPro: boolean;
  refresh: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextValue>({
  tier: 'free',
  isPro: false,
  refresh: () => {},
});

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user, refreshUser } = useAuth();
  const [tier, setTier] = useState<Tier>('free');

  useEffect(() => {
    setTier(user?.tier ?? 'free');
  }, [user?.tier]);

  const refresh = useCallback(() => { refreshUser(); }, [refreshUser]);

  return (
    <SubscriptionContext.Provider value={{ tier, isPro: tier === 'pro', refresh }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
