import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/types/auth';
import { Session } from '@supabase/supabase-js';
import { isSessionValid, withRetry, getAuthErrorMessage } from '@/utils/auth-utils';
import { showToast } from '@/lib/toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string, token?: string) => Promise<{ error: any }>;
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
  const isRefreshingRef = useRef(false);


  const updateUser = useCallback((newUser: User | null) => {
    const current = userRef.current;

    if (
      current?.id === newUser?.id &&
      current?.username === newUser?.username &&
      current?.display_name === newUser?.display_name &&
      current?.avatar_url === newUser?.avatar_url &&
      current?.banner_url === newUser?.banner_url &&
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
        .select('id, username, display_name, avatar_url, banner_url, has_completed_onboarding')
        .eq('id', userId)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        email: '',
        username: data.username,
        display_name: data.display_name,
        avatar_url: data.avatar_url,
        banner_url: data.banner_url,
        has_completed_onboarding: data.has_completed_onboarding,
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
        const { data: { session: current }, error } = await withRetry(
          () => supabase.auth.getSession(),
          { retries: 2, delay: 1000 }
        );

        if (!mounted) return;

        if (error || !current?.user) {
          sessionIdRef.current = null;
          updateUser(null);
          setSession(null);
          setLoading(false);
          return;
        }

        if (!isSessionValid(current)) {
          const { data: { session: refreshed }, error: refreshError } = await supabase.auth.refreshSession();

          if (refreshError || !refreshed) {
            sessionIdRef.current = null;
            updateUser(null);
            setSession(null);
            setLoading(false);
            return;
          }

          sessionIdRef.current = refreshed.access_token;
          setSession(refreshed);

          const profile = await fetchUserProfile(refreshed.user.id);
          if (mounted) {
            updateUser(profile || mapUserFromAuth(refreshed.user));
            setLoading(false);
          }
          return;
        }

        sessionIdRef.current = current.access_token;
        setSession(current);

        const profile = await fetchUserProfile(current.user.id);
        if (mounted) {
          updateUser(profile || mapUserFromAuth(current.user));
          setLoading(false);
        }
      } catch (err) {
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
          if (isRefreshingRef.current) return;
          isRefreshingRef.current = true;

          sessionIdRef.current = newSession.access_token;
          setSession(newSession);

          isRefreshingRef.current = false;
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

          try {
            const profile = await fetchUserProfile(newSession.user.id);
            updateUser(profile || mapUserFromAuth(newSession.user));
          } catch (err) {
            updateUser(mapUserFromAuth(newSession.user));
          }
          setLoading(false);
        }

        if (event === 'USER_UPDATED' && newSession?.user) {
          if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);

          refreshTimeoutRef.current = setTimeout(async () => {
            try {
              const profile = await fetchUserProfile(newSession.user.id);
              updateUser(profile || mapUserFromAuth(newSession.user));
            } catch (err) {
            }
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
      const ipAddress = await import('@/utils/rate-limiter').then(m => m.getClientIP());
      const { checkRateLimit, recordAttempt, formatTimeRemaining } = await import('@/utils/rate-limiter');

      const rateLimitCheck = await checkRateLimit(ipAddress, 'signup');

      if (!rateLimitCheck.allowed) {
        const timeRemaining = rateLimitCheck.blockedUntil
          ? formatTimeRemaining(rateLimitCheck.blockedUntil)
          : '30 minutes';
        const message = `Account creation limit reached. Please try again in ${timeRemaining}.`;
        showToast.error(message);
        return { error: { message } };
      }

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

      if (error) {
        const friendlyMessage = getAuthErrorMessage(error);
        showToast.error(friendlyMessage);
        return { error: { message: friendlyMessage } };
      }

      if (data.user) {
        try {
          await supabase.from('users').insert({
            id: data.user.id,
            username,
            display_name: username,
          });

          await recordAttempt(ipAddress, 'signup');
        } catch (dbError) {
        }
      }

      return { error: null };
    } catch (err) {
      const friendlyMessage = getAuthErrorMessage(err);
      showToast.error(friendlyMessage);
      return { error: { message: friendlyMessage } };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const ipAddress = await import('@/utils/rate-limiter').then(m => m.getClientIP());
      const { checkRateLimit, recordAttempt, resetAttempts, formatTimeRemaining } = await import('@/utils/rate-limiter');

      const rateLimitCheck = await checkRateLimit(ipAddress, 'login');

      if (!rateLimitCheck.allowed) {
        const timeRemaining = rateLimitCheck.blockedUntil
          ? formatTimeRemaining(rateLimitCheck.blockedUntil)
          : '30 minutes';
        const message = `Too many failed login attempts. Please try again in ${timeRemaining}.`;
        showToast.error(message);
        return { error: { message } };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        await recordAttempt(ipAddress, 'login');

        const friendlyMessage = getAuthErrorMessage(error);
        showToast.error(friendlyMessage);
        return { error: { message: friendlyMessage } };
      }

      await resetAttempts(ipAddress, 'login');
      return { error: null };
    } catch (err) {
      const friendlyMessage = getAuthErrorMessage(err);
      showToast.error(friendlyMessage);
      return { error: { message: friendlyMessage } };
    }
  };

  const signOut = async () => {
    try {
      sessionIdRef.current = null;
      updateUser(null);
      setSession(null);

      await supabase.auth.signOut();
    } catch { }
  };

  const refreshUser = async () => {
    try {
      const { data: { session: current } } = await supabase.auth.getSession();

      if (current?.user) {
        const profile = await fetchUserProfile(current.user.id);
        updateUser(profile || mapUserFromAuth(current.user));
      }
    } catch { }
  };

  const resetPassword = async (email: string) => {
    try {
      const response = await fetch('/api/auth/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast.error(data.error || 'Failed to send reset email');
        return { error: { message: data.error } };
      }

      return { error: null };
    } catch (err) {
      showToast.error('An unexpected error occurred');
      return { error: { message: 'An unexpected error occurred' } };
    }
  };

  const updatePassword = async (password: string, token?: string) => {
    try {
      if (token) {
        const response = await fetch('/api/auth/complete-reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          showToast.error(data.error || 'Failed to update password');
          return { error: { message: data.error } };
        }
      } else {
        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
          const friendlyMessage = getAuthErrorMessage(error);
          showToast.error(friendlyMessage);
          return { error: { message: friendlyMessage } };
        }
      }

      return { error: null };
    } catch (err) {
      showToast.error('An unexpected error occurred');
      return { error: { message: 'An unexpected error occurred' } };
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
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
