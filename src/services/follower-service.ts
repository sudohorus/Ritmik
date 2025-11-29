import { supabase } from '@/lib/supabase';
import { SettingsService } from './settings-service';

export interface FollowerStats {
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  followersVisible: boolean;
  followingVisible: boolean;
}

export interface FollowerUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  isFollowedByCurrentUser?: boolean; 
}

export class FollowerService {
  static async followUser(followingId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    if (user.id === followingId) {
      throw new Error('You cannot follow yourself');
    }

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

    if (error) throw error;
  }

  static async getFollowerStats(userId: string, currentUserId?: string): Promise<FollowerStats> {
    try {
      const isOwnProfile = currentUserId === userId;

      let followersPublic = true;
      let followingPublic = true;

      if (!isOwnProfile) {
        const settings = await SettingsService.getUserSettings(userId);
        followersPublic = settings?.followers_public ?? true;
        followingPublic = settings?.following_public ?? true;
      }

      const followersVisible = isOwnProfile || followersPublic;
      const followingVisible = isOwnProfile || followingPublic;

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
        followerCount: followersVisible ? (followerResult.count || 0) : 0,
        followingCount: followingVisible ? (followingResult.count || 0) : 0,
        isFollowing,
        followersVisible,
        followingVisible,
      };
    } catch (err) {
      return {
        followerCount: 0,
        followingCount: 0,
        isFollowing: false,
        followersVisible: true,
        followingVisible: true,
      };
    }
  }

  static async getFollowers(userId: string, currentUserId?: string): Promise<FollowerUser[]> {
    const isOwnProfile = currentUserId === userId;

    if (!isOwnProfile) {
      const followersPublic = await SettingsService.checkFollowersPublic(userId);
      if (!followersPublic) {
        throw new Error('This user\'s followers list is private');
      }
    }

    const { data, error } = await supabase
      .from('followers')
      .select(`
        created_at,
        follower_user:users!followers_follower_id_fkey (
          id,
          username,
          display_name,
          avatar_url,
          created_at
        )
      `)
      .eq('following_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const followerUsers = (data || [])
      .filter((item: any) => item.follower_user)
      .map((item: any) => ({
        id: item.follower_user.id,
        username: item.follower_user.username,
        display_name: item.follower_user.display_name,
        avatar_url: item.follower_user.avatar_url,
        created_at: item.follower_user.created_at,
      }));

    if (currentUserId && followerUsers.length > 0) {
      const userIds = followerUsers.map(u => u.id);
      
      const { data: followData } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', currentUserId)
        .in('following_id', userIds);

      const followedIds = new Set((followData || []).map(f => f.following_id));

      return followerUsers.map(user => ({
        ...user,
        isFollowedByCurrentUser: followedIds.has(user.id)
      }));
    }

    return followerUsers;
  }

  static async getFollowing(userId: string, currentUserId?: string): Promise<FollowerUser[]> {
    const isOwnProfile = currentUserId === userId;

    if (!isOwnProfile) {
      const followingPublic = await SettingsService.checkFollowingPublic(userId);
      if (!followingPublic) {
        throw new Error('This user\'s following list is private');
      }
    }

    const { data, error } = await supabase
      .from('followers')
      .select(`
        created_at,
        following_user:users!followers_following_id_fkey (
          id,
          username,
          display_name,
          avatar_url,
          created_at
        )
      `)
      .eq('follower_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const followingUsers = (data || [])
      .filter((item: any) => item.following_user)
      .map((item: any) => ({
        id: item.following_user.id,
        username: item.following_user.username,
        display_name: item.following_user.display_name,
        avatar_url: item.following_user.avatar_url,
        created_at: item.following_user.created_at,
      }));

    if (currentUserId && followingUsers.length > 0) {
      const userIds = followingUsers.map(u => u.id);
      
      const { data: followData } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', currentUserId)
        .in('following_id', userIds);

      const followedIds = new Set((followData || []).map(f => f.following_id));

      return followingUsers.map(user => ({
        ...user,
        isFollowedByCurrentUser: followedIds.has(user.id)
      }));
    }

    return followingUsers;
  }

  static async getFollowingPlaylists(userId: string): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Authentication required');
      }

      if (user.id !== userId) {
        throw new Error('Unauthorized: You can only view your own following feed');
      }

      const { data: followingData, error: followingError } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', userId); 

      if (followingError) throw followingError;
      if (!followingData || followingData.length === 0) return [];

      const followingIds = followingData.map(f => f.following_id);

      const { data: playlistsData, error: playlistsError } = await supabase
        .from('playlists')
        .select(`
          id,
          name,
          description,
          cover_image_url,
          created_at,
          user_id,
          users!inner (
            id,
            username,
            display_name
          ),
          playlist_tracks (count)
        `)
        .in('user_id', followingIds)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(100);

      if (playlistsError) throw playlistsError;

      return (playlistsData || []).map((playlist: any) => ({
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        cover_image_url: playlist.cover_image_url,
        created_at: playlist.created_at,
        user_id: playlist.user_id,
        users: {
          id: playlist.users.id,
          username: playlist.users.username,
          display_name: playlist.users.display_name,
        },
        track_count: playlist.playlist_tracks?.[0]?.count || 0,
      }));
    } catch (err) {
      throw err;
    }
  }

  static async getBulkFollowStatus(
    currentUserId: string,
    targetUserIds: string[]
  ): Promise<Map<string, boolean>> {
    if (!currentUserId || targetUserIds.length === 0) {
      return new Map();
    }

    const { data, error } = await supabase
      .from('followers')
      .select('following_id')
      .eq('follower_id', currentUserId)
      .in('following_id', targetUserIds);

    if (error) {
      return new Map();
    }

    const followedIds = new Set((data || []).map(f => f.following_id));
    const statusMap = new Map<string, boolean>();
    
    targetUserIds.forEach(id => {
      statusMap.set(id, followedIds.has(id));
    });

    return statusMap;
  }
}