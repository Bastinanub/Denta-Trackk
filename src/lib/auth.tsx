import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Staff } from './types';

interface AuthState {
  session: Session | null;
  user: User | null;
  staff: Staff | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshStaff: (userId?: string) => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadStaff(userId: string | undefined) {
    if (!userId) {
      setStaff(null);
      return;
    }
    const { data } = await supabase.from('staff').select('*').eq('id', userId).maybeSingle();
    setStaff((data as Staff | null) ?? null);
  }

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      Promise.resolve(loadStaff(data.session?.user.id)).finally(() => setLoading(false));
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      (async () => {
        await loadStaff(newSession?.user.id);
      })();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      session,
      user: session?.user ?? null,
      staff,
      loading,
      signOut: async () => {
        await supabase.auth.signOut();
        setStaff(null);
      },
      refreshStaff: async (userId?: string) => {
        await loadStaff(userId ?? session?.user.id);
      },
    }),
    [session, staff, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
