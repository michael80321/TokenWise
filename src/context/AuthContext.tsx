import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { fetchMe, MeResponse } from '../api/auth';
import { registerForPushNotifications } from '../api/notifications';

const TOKEN_KEY = 'tokenwise_jwt';

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
      const stored = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!stored) {
        setState({ token: null, user: null, loading: false });
        return;
      }
      const user = await fetchMe(stored);
      setState({ token: stored, user, loading: false });
    } catch {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      setState({ token: null, user: null, loading: false });
    }
  }, []);

  useEffect(() => { loadStoredToken(); }, [loadStoredToken]);

  const signIn = useCallback(async (token: string) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    const user = await fetchMe(token);
    setState({ token, user, loading: false });
    // Best-effort push registration — don't block sign-in if it fails
    registerForPushNotifications(token).catch(console.warn);
  }, []);

  const signOut = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
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
