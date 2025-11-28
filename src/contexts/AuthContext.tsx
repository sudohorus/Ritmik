import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/types/auth';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const userRef = useRef<User | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const isInitializedRef = useRef(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  const updateUser = useCallback((newUser: User | null) => {
    const current = userRef.current;

    if (
      current?.id === newUser?.id &&
      current?.username === newUser?.username &&
      current?.display_name === newUser?.display_name &&
      current?.avatar_url === newUser?.avatar_url &&
      current?.email === newUser?.email
    ) return;

    userRef.current = newUser;
    setUser(newUser);
  }, []);

  const mapUserFromAuth = (authUser: any): User => ({
    id: authUser.id,
    email: authUser.email,
    username: authUser.user_metadata?.username,
    display_name: authUser.user_metadata?.display_name,
    avatar_url: authUser.user_metadata?.avatar_url,
  });

  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        email: data.email,
        username: data.username,
        display_name: data.display_name,
        avatar_url: data.avatar_url,
      };
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    let mounted = true;

    const init = async () => {
      try {
        const { data: { session: current }, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error || !current?.user) {
          sessionIdRef.current = null;
          updateUser(null);
          setSession(null);
          setLoading(false);
          return;
        }

        sessionIdRef.current = current.access_token;
        setSession(current);

        const profile = await fetchUserProfile(current.user.id);
        if (mounted) {
          updateUser(profile || mapUserFromAuth(current.user));
          setLoading(false);
        }
      } catch {
        if (mounted) {
          updateUser(null);
          setSession(null);
          setLoading(false);
        }
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        if (event === 'TOKEN_REFRESHED' && newSession) {
          sessionIdRef.current = newSession.access_token;
          setSession(newSession);
          return;
        }

        if (event === 'SIGNED_OUT') {
          if (sessionIdRef.current !== null) return;

          updateUser(null);
          setSession(null);
          setLoading(false);
          return;
        }

        if (event === 'SIGNED_IN' && newSession?.user) {
          if (sessionIdRef.current === newSession.access_token) return;

          sessionIdRef.current = newSession.access_token;
          setSession(newSession);

          const profile = await fetchUserProfile(newSession.user.id);
          updateUser(profile || mapUserFromAuth(newSession.user));
          setLoading(false);
        }

        if (event === 'USER_UPDATED' && newSession?.user) {
          if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);

          refreshTimeoutRef.current = setTimeout(async () => {
            const profile = await fetchUserProfile(newSession.user.id);
            updateUser(profile || mapUserFromAuth(newSession.user));
          }, 300);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    };
  }, [updateUser]);

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined,
          data: {
            username,
            display_name: username,
          },
        },
      });

      if (!error && data.user) {
        await supabase.from('users').insert({
          id: data.user.id,
          email,
          username,
          display_name: username,
        });
      }

      return { error };
    } catch (err) {
      return { error: err };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error?.message?.includes('Email not confirmed')) {
        return { error: { message: 'Please disable email confirmation in Supabase settings.' } };
      }

      return { error };
    } catch (err) {
      return { error: err };
    }
  };

  const signOut = async () => {
    try {
      sessionIdRef.current = null;
      updateUser(null);
      setSession(null);

      await supabase.auth.signOut();
    } catch {}
  };

  const refreshUser = async () => {
    try {
      const { data: { session: current } } = await supabase.auth.getSession();

      if (current?.user) {
        const profile = await fetchUserProfile(current.user.id);
        updateUser(profile || mapUserFromAuth(current.user));
      }
    } catch {}
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
