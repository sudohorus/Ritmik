import { useState, useEffect } from 'react';
import { ProfileService, UpdateProfileData } from '@/services/profile-service';
import { User } from '@/types/auth';
import { useAuth } from '@/contexts/AuthContext';

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadProfile();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const loadProfile = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await ProfileService.getUserProfile(user.id);

    if (fetchError) {
      setError(fetchError.message || 'Failed to load profile');
      setProfile(null);
    } else {
      setProfile(data);
    }

    setLoading(false);
  };

  const updateProfile = async (updates: UpdateProfileData) => {
    if (!user?.id) return { error: 'User not authenticated' };

    setUpdating(true);
    setError(null);

    const { data, error: updateError } = await ProfileService.updateProfile(user.id, updates);

    if (updateError) {
      setError(updateError.message || 'Failed to update profile');
      setUpdating(false);
      return { error: updateError };
    }

    if (data) {
      setProfile(data);
    }

    setUpdating(false);
    return { error: null };
  };

  return {
    profile,
    loading,
    error,
    updating,
    updateProfile,
    refreshProfile: loadProfile,
  };
}

