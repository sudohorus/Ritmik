import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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

  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    console.log('[AuthContext] fetchUserProfile start', { userId });
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.error('[AuthContext] fetchUserProfile error or no data', { userId, error });
      return null;
    }

    console.log('[AuthContext] fetchUserProfile success', { userId });

    return {
      id: data.id,
      email: data.email,
      username: data.username,
      display_name: data.display_name,
      avatar_url: data.avatar_url,
    };
  };

  useEffect(() => {
    console.log('[AuthContext] initial getSession effect start');
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('[AuthContext] getSession resolved', { hasSession: !!session });
      setSession(session);
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setUser(profile || mapUserFromAuth(session.user));
      } else {
        setUser(null);
      }
      setLoading(false);
      console.log('[AuthContext] initial auth state set', { hasUser: !!session?.user });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('[AuthContext] onAuthStateChange', { hasSession: !!session, event: _event });
      setSession(session);
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setUser(profile || mapUserFromAuth(session.user));
      } else {
        setUser(null);
      }
      setLoading(false);
      console.log('[AuthContext] onAuthStateChange completed', { hasUser: !!session?.user });
    });

    return () => subscription.unsubscribe();
  }, []);

  const mapUserFromAuth = (authUser: any): User => ({
    id: authUser.id,
    email: authUser.email,
    username: authUser.user_metadata?.username,
    display_name: authUser.user_metadata?.display_name,
    avatar_url: authUser.user_metadata?.avatar_url,
  });

  const signUp = async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined,
        data: {
          username: username,
          display_name: username,
        },
      },
    });

    if (!error && data.user) {
      const { error: insertError } = await supabase.from('users').insert({
        id: data.user.id,
        email: email,
        username: username,
        display_name: username,
      });

      if (insertError) {
        console.error('Failed to insert user into public.users:', insertError);
      }
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error?.message?.includes('Email not confirmed')) {
      return { error: { message: 'Please disable email confirmation in Supabase settings.' } };
    }

    return { error };
  };

  const signOut = async () => {
    console.log('[AuthContext] signOut called');
    await supabase.auth.signOut();
    console.log('[AuthContext] signOut finished');
  };

  const refreshUser = async () => {
    console.log('[AuthContext] refreshUser start');
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Refresh timeout')), 5000)
      );
      
      const refreshPromise = (async () => {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('[AuthContext] refreshUser getSession resolved', { hasSession: !!session });
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          setUser(profile || mapUserFromAuth(session.user));
          console.log('[AuthContext] refreshUser user updated', { userId: session.user.id });
        }
      })();

      await Promise.race([refreshPromise, timeoutPromise]);
      console.log('[AuthContext] refreshUser finished without timeout');
    } catch (err) {
      console.error('[AuthContext] Failed to refresh user', err);
    }
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
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
