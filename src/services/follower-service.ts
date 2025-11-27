import { supabase } from '@/lib/supabase';

export interface FollowerStats {
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
}

export interface FollowerUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export class FollowerService {
  static async followUser(followingId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('followers')
      .insert({
        follower_id: user.id,
        following_id: followingId,
      });

    if (error) {
      if (error.code === '23505') {
        throw new Error('You are already following this user');
      }
      throw error;
    }
  }

  static async unfollowUser(followingId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('followers')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', followingId);

    if (error) {
      throw error;
    }
  }

  static async getFollowerStats(userId: string, currentUserId?: string): Promise<FollowerStats> {
    try {
      const [followerResult, followingResult, isFollowingResult] = await Promise.all([
        supabase
          .from('followers')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', userId),

        supabase
          .from('followers')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', userId),
        
        currentUserId && currentUserId !== userId
          ? supabase
              .from('followers')
              .select('id')
              .eq('follower_id', currentUserId)
              .eq('following_id', userId)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null })
      ]);

      const isFollowing = !isFollowingResult.error && !!isFollowingResult.data;

      return {
        followerCount: followerResult.count || 0,
        followingCount: followingResult.count || 0,
        isFollowing,
      };
    } catch (err) {
      return {
        followerCount: 0,
        followingCount: 0,
        isFollowing: false,
      };
    }
  }

  static async getFollowers(userId: string): Promise<FollowerUser[]> {
    const { data, error } = await supabase
      .from('followers')
      .select(`
        created_at,
        users!followers_follower_id_fkey (
          id,
          username,
          display_name,
          avatar_url,
          created_at
        )
      `)
      .eq('following_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data || [])
      .filter((item: any) => item.users)
      .map((item: any) => ({
        id: item.users.id,
        username: item.users.username,
        display_name: item.users.display_name,
        avatar_url: item.users.avatar_url,
        created_at: item.users.created_at,
      }));
  }

  static async getFollowing(userId: string): Promise<FollowerUser[]> {
    const { data, error } = await supabase
      .from('followers')
      .select(`
        created_at,
        users!followers_following_id_fkey (
          id,
          username,
          display_name,
          avatar_url,
          created_at
        )
      `)
      .eq('follower_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data || [])
      .filter((item: any) => item.users)
      .map((item: any) => ({
        id: item.users.id,
        username: item.users.username,
        display_name: item.users.display_name,
        avatar_url: item.users.avatar_url,
        created_at: item.users.created_at,
      }));
  }

  static async getFollowingPlaylists(userId: string) {
    try {
      const { data: followingData, error: followingError } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', userId);

      if (followingError) {
        throw followingError;
      }

      if (!followingData || followingData.length === 0) {
        return [];
      }

      const followingIds = followingData.map(f => f.following_id);

      const { data: playlistsData, error: playlistsError } = await supabase
        .from('playlists')
        .select(`
          *,
          users (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .in('user_id', followingIds)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (playlistsError) {
        throw playlistsError;
      }

      return playlistsData || [];
    } catch (err) {
      return [];
    }
  }
}