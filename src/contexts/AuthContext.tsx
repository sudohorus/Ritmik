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
  const isInitializedRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateUser = useCallback((newUser: User | null) => {
    const currentUser = userRef.current;
    
    if (newUser === null && currentUser === null) return;
    if (newUser === null && currentUser !== null) {
      userRef.current = null;
      setUser(null);
      return;
    }
    if (currentUser === null && newUser !== null) {
      userRef.current = newUser;
      setUser(newUser);
      return;
    }
    
    if (
      currentUser?.id === newUser?.id &&
      currentUser?.username === newUser?.username &&
      currentUser?.display_name === newUser?.display_name &&
      currentUser?.avatar_url === newUser?.avatar_url &&
      currentUser?.email === newUser?.email
    ) {
      return;
    }
    
    userRef.current = newUser;
    setUser(newUser);
  }, []);

  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        email: data.email,
        username: data.username,
        display_name: data.display_name,
        avatar_url: data.avatar_url,
      };
    } catch (err) {
      return null;
    }
  };

  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    let isMounted = true;

    const initAuth = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (error) {
          setSession(null);
          updateUser(null);
          setLoading(false);
          return;
        }

        if (currentSession?.user) {
          sessionIdRef.current = currentSession.access_token;
          setSession(currentSession);
          const profile = await fetchUserProfile(currentSession.user.id);
          if (isMounted) {
            updateUser(profile || mapUserFromAuth(currentSession.user));
          }
        } else {
          sessionIdRef.current = null;
          setSession(null);
          updateUser(null);
        }
        
        if (isMounted) {
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setSession(null);
          updateUser(null);
          setLoading(false);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;

      if (event === 'TOKEN_REFRESHED') {
        if (newSession) {
          sessionIdRef.current = newSession.access_token;
          setSession(newSession);
        }
        return;
      }

      if (event === 'INITIAL_SESSION') {
        return;
      }
      
      if (event === 'SIGNED_OUT') {
        sessionIdRef.current = null;
        setSession(null);
        updateUser(null);
        setLoading(false);
        return;
      }
      
      if (event === 'SIGNED_IN' && newSession?.user) {
        if (sessionIdRef.current === newSession.access_token) {
          return;
        }
        
        sessionIdRef.current = newSession.access_token;
        setSession(newSession);
        
        const profile = await fetchUserProfile(newSession.user.id);
        if (isMounted) {
          updateUser(profile || mapUserFromAuth(newSession.user));
          setLoading(false);
        }
      }

      if (event === 'USER_UPDATED' && newSession?.user) {
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
        
        refreshTimeoutRef.current = setTimeout(async () => {
          const profile = await fetchUserProfile(newSession.user.id);
          if (isMounted) {
            updateUser(profile || mapUserFromAuth(newSession.user));
          }
        }, 500);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [updateUser]);

  const mapUserFromAuth = (authUser: any): User => ({
    id: authUser.id,
    email: authUser.email,
    username: authUser.user_metadata?.username,
    display_name: authUser.user_metadata?.display_name,
    avatar_url: authUser.user_metadata?.avatar_url,
  });

  const signUp = async (email: string, password: string, username: string) => {
    try {
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
        }
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
      await supabase.auth.signOut();
    } catch (err) {
    }
  };

  const refreshUser = async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession?.user) {
        const profile = await fetchUserProfile(currentSession.user.id);
        updateUser(profile || mapUserFromAuth(currentSession.user));
      }
    } catch (err) {
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