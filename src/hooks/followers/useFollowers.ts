import { useState, useEffect, useCallback, useRef } from 'react';
import { FollowerService, FollowerStats } from '@/services/follower-service';
import { useAuth } from '@/contexts/AuthContext';
import { showToast } from '@/lib/toast';

export function useFollowers(targetUserId: string | undefined) {
  const { user } = useAuth();
  const [stats, setStats] = useState<FollowerStats>({
    followerCount: 0,
    followingCount: 0,
    isFollowing: false,
    followersVisible: true,
    followingVisible: true,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const mountedRef = useRef(true);
  const loadedUserRef = useRef<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    if (loadedUserRef.current === targetUserId && !loading) {
      return;
    }

    loadedUserRef.current = targetUserId;
    setLoading(true);

    try {
      const data = await FollowerService.getFollowerStats(targetUserId, user?.id);
      if (mountedRef.current) {
        setStats(data);
      }
    } catch (err) {
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [targetUserId, user?.id, loading]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (targetUserId) {
      loadedUserRef.current = null;
      loadStats();
    }
  }, [user?.id, targetUserId]);

  const followUser = async () => {
    if (!targetUserId || !user) return;

    setActionLoading(true);
    try {
      await FollowerService.followUser(targetUserId);

      if (mountedRef.current) {
        setStats(prev => ({
          ...prev,
          followerCount: prev.followerCount + 1,
          isFollowing: true,
        }));
      }

      showToast.success('User followed successfully');
    } catch (err) {
      showToast.error('Failed to follow user');
      if (mountedRef.current) {
        await loadStats();
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setActionLoading(false);
      }
    }
  };

  const unfollowUser = async () => {
    if (!targetUserId || !user) return;

    setActionLoading(true);
    try {
      await FollowerService.unfollowUser(targetUserId);

      if (mountedRef.current) {
        setStats(prev => ({
          ...prev,
          followerCount: Math.max(0, prev.followerCount - 1),
          isFollowing: false,
        }));
      }

      showToast.success('User unfollowed');
    } catch (err) {
      showToast.error('Failed to unfollow user');
      if (mountedRef.current) {
        await loadStats();
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setActionLoading(false);
      }
    }
  };

  const toggleFollow = async () => {
    if (stats.isFollowing) {
      await unfollowUser();
    } else {
      await followUser();
    }
  };

  const refresh = useCallback(() => {
    loadedUserRef.current = null;
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    actionLoading,
    followUser,
    unfollowUser,
    toggleFollow,
    refresh,
  };
}