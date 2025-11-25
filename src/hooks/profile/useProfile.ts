import { useState, useEffect, useRef } from 'react';
import { ProfileService, UpdateProfileData } from '@/services/profile-service';
import { User } from '@/types/auth';
import { useAuth } from '@/contexts/AuthContext';

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const loadedUserIdRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Se não tem user, limpa
    if (!user?.id) {
      setProfile(null);
      setLoading(false);
      loadedUserIdRef.current = null;
      return;
    }

    // Se já carregou esse user, não recarrega
    if (user.id === loadedUserIdRef.current) {
      return;
    }

    loadedUserIdRef.current = user.id;

    const loadProfile = async () => {
      if (!mountedRef.current) return;
      
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await ProfileService.getUserProfile(user.id);

        if (!mountedRef.current) return;

        if (fetchError) {
          setError(fetchError.message || 'Failed to load profile');
          setProfile(null);
        } else {
          setProfile(data);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError('Failed to load profile');
          setProfile(null);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    loadProfile();
  }, [user?.id]);

  const updateProfile = async (updates: UpdateProfileData) => {
    if (!user?.id) return { error: { message: 'User not authenticated' } };

    setUpdating(true);

    try {
      const { data, error: updateError } = await ProfileService.updateProfile(user.id, updates);

      if (!mountedRef.current) {
        return { error: null };
      }

      if (updateError) {
        setUpdating(false);
        return { error: updateError };
      }

      if (data) {
        setProfile(data);
      }

      setUpdating(false);
      return { error: null, data };
    } catch (err) {
      if (mountedRef.current) {
        setUpdating(false);
      }
      return { error: { message: 'Failed to update profile' } };
    }
  };

  return {
    profile,
    loading,
    error,
    updating,
    updateProfile,
  };
}
