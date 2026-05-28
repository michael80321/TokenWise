import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { fetchMe, MeResponse } from '../api/auth';
import { registerForPushNotifications } from '../api/notifications';

const TOKEN_KEY = 'tokenwise_jwt';

// expo-secure-store doesn't work on web — fall back to localStorage
const storage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') { localStorage.setItem(key, value); return; }
    return SecureStore.setItemAsync(key, value);
  },
  async del(key: string): Promise<void> {
    if (Platform.OS === 'web') { localStorage.removeItem(key); return; }
    return SecureStore.deleteItemAsync(key);
  },
};

interface AuthState {
  token: string | null;
  user: MeResponse | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ token: null, user: null, loading: true });

  const loadStoredToken = useCallback(async () => {
    try {
      const stored = await storage.get(TOKEN_KEY);
      if (!stored) {
        setState({ token: null, user: null, loading: false });
        return;
      }
      const user = await fetchMe(stored);
      setState({ token: stored, user, loading: false });
    } catch {
      await storage.del(TOKEN_KEY);
      setState({ token: null, user: null, loading: false });
    }
  }, []);

  useEffect(() => { loadStoredToken(); }, [loadStoredToken]);

  const signIn = useCallback(async (token: string) => {
    await storage.set(TOKEN_KEY, token);
    const user = await fetchMe(token);
    setState({ token, user, loading: false });
    registerForPushNotifications(token).catch(console.warn);
  }, []);

  const signOut = useCallback(async () => {
    await storage.del(TOKEN_KEY);
    setState({ token: null, user: null, loading: false });
  }, []);

  const refreshUser = useCallback(async () => {
    if (!state.token) return;
    try {
      const user = await fetchMe(state.token);
      setState((s) => ({ ...s, user }));
    } catch {
      await signOut();
    }
  }, [state.token, signOut]);

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
