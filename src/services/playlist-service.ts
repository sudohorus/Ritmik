import { supabase } from '@/lib/supabase';
import { Playlist, CreatePlaylistData, AddTrackToPlaylistData } from '@/types/playlist';

export class PlaylistService {
  static async getUserPlaylists(userId: string, page: number = 1, limit: number = 8, search?: string): Promise<{ data: Playlist[], count: number }> {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      throw new Error('Authentication required');
    }

    if (user.id !== userId) {
      throw new Error('Unauthorized: You can only view your own playlists');
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('playlists')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) throw error;
    return { data: data || [], count: count || 0 };
  }

  static async getPublicPlaylists(page: number = 1, limit: number = 8, search?: string): Promise<{ data: Playlist[], count: number }> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('playlists')
      .select(`
        *,
        playlist_tracks(count),
        users (
          username,
          display_name
        )
      `, { count: 'exact' })
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    const playlists = (data || []).map(playlist => ({
      ...playlist,
      track_count: playlist.playlist_tracks?.[0]?.count || 0,
      playlist_tracks: undefined,
    }));

    const result = { data: playlists, count: count || 0 };

    return result;
  }

  static async getPlaylistById(playlistId: string, userId?: string): Promise<Playlist | null> {
    let currentUserId = userId;

    if (!currentUserId) {
      const { data: { session } } = await supabase.auth.getSession();
      currentUserId = session?.user?.id;
    }

    const { data, error } = await supabase
      .from('playlists')
      .select(`
        *,
        users (
          username,
          display_name
        )
      `)
      .eq('id', playlistId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    if (!data.is_public) {
      if (!currentUserId || data.user_id !== currentUserId) {
        throw new Error('This playlist is private');
      }
    }

    return data;
  }

  static async createPlaylist(userId: string, playlistData: CreatePlaylistData, client?: any): Promise<Playlist> {
    const supabaseClient = client || supabase;

    if (!client) {
      const { data: { session } } = await supabaseClient.auth.getSession();
      const user = session?.user;
      if (!user) {
        throw new Error('Authentication required');
      }

      if (user.id !== userId) {
        throw new Error('Unauthorized: You can only create playlists for yourself');
      }
    }

    const { data, error } = await supabaseClient
      .from('playlists')
      .insert({
        user_id: userId,
        name: playlistData.name,
        description: playlistData.description,
        cover_image_url: playlistData.cover_image_url,
        banner_image_url: playlistData.banner_image_url,
        is_public: playlistData.is_public ?? true,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  static async updatePlaylist(playlistId: string, data: Partial<CreatePlaylistData>): Promise<Playlist> {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      throw new Error('Authentication required');
    }

    const { data: existingPlaylist, error: fetchError } = await supabase
      .from('playlists')
      .select('user_id')
      .eq('id', playlistId)
      .single();

    if (fetchError || !existingPlaylist) {
      throw new Error('Playlist not found');
    }

    if (existingPlaylist.user_id !== user.id) {
      throw new Error('Unauthorized: You can only update your own playlists');
    }

    const updateData: Record<string, any> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.is_public !== undefined) updateData.is_public = data.is_public;
    if (data.cover_image_url !== undefined) updateData.cover_image_url = data.cover_image_url;
    if (data.banner_image_url !== undefined) updateData.banner_image_url = data.banner_image_url;

    const { data: updated, error } = await supabase
      .from('playlists')
      .update(updateData)
      .eq('id', playlistId)
      .select()
      .single();

    if (error) throw error;

    return updated;
  }

  static async deletePlaylist(playlistId: string): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      throw new Error('Authentication required');
    }

    const { data: existingPlaylist, error: fetchError } = await supabase
      .from('playlists')
      .select('user_id')
      .eq('id', playlistId)
      .single();

    if (fetchError || !existingPlaylist) {
      throw new Error('Playlist not found');
    }

    if (existingPlaylist.user_id !== user.id) {
      throw new Error('Unauthorized: You can only delete your own playlists');
    }

    const { error } = await supabase
      .from('playlists')
      .delete()
      .eq('id', playlistId);

    if (error) throw error;

    if (error) throw error;
  }

  static async getPlaylist(playlistId: string, userId?: string, client?: any): Promise<Playlist> {
    const supabaseClient = client || supabase;
    const { data: playlist, error } = await supabaseClient
      .from('playlists')
      .select('*, users(username, display_name, avatar_url)')
      .eq('id', playlistId)
      .single();

    if (error || !playlist) {
      throw new Error('Playlist not found');
    }

    if (!playlist.is_public && playlist.user_id !== userId) {
      throw new Error('This playlist is private');
    }

    return playlist;
  }

  static async getPlaylistTracks(playlistId: string, userId?: string, client?: any) {
    const supabaseClient = client || supabase;
    let currentUserId = userId;

    if (!currentUserId) {
      const { data: { session } } = await supabaseClient.auth.getSession();
      currentUserId = session?.user?.id;
    }

    await this.getPlaylist(playlistId, currentUserId, supabaseClient);

    const { data, error } = await supabaseClient
      .from('playlist_tracks')
      .select('*')
      .eq('playlist_id', playlistId)
      .order('position', { ascending: true });

    if (error) throw error;

    return data || [];
  }

  static async addTrackToPlaylist(trackData: AddTrackToPlaylistData): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      throw new Error('Authentication required');
    }

    const { data: playlist, error: fetchError } = await supabase
      .from('playlists')
      .select('user_id')
      .eq('id', trackData.playlist_id)
      .single();

    if (fetchError || !playlist) {
      throw new Error('Playlist not found');
    }

    if (playlist.user_id !== user.id) {
      throw new Error('Unauthorized: You can only add tracks to your own playlists');
    }

    const { data: existingTrack } = await supabase
      .from('playlist_tracks')
      .select('id')
      .eq('playlist_id', trackData.playlist_id)
      .eq('video_id', trackData.track_id)
      .single();

    if (existingTrack) {
      throw new Error('Track already exists in this playlist');
    }

    const tracks = await this.getPlaylistTracks(trackData.playlist_id);
    const nextPosition = tracks.length;

    const { error } = await supabase
      .from('playlist_tracks')
      .insert({
        playlist_id: trackData.playlist_id,
        video_id: trackData.track_id,
        title: trackData.title,
        artist: trackData.artist,
        thumbnail_url: trackData.thumbnail,
        duration: trackData.duration,
        position: nextPosition,
      });

    if (error) {
      if (error.code === '23505') {
        throw new Error('Track already exists in this playlist');
      }
      throw error;
    }
  }

  static async removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      throw new Error('Authentication required');
    }

    const { data: playlist, error: fetchError } = await supabase
      .from('playlists')
      .select('user_id')
      .eq('id', playlistId)
      .single();

    if (fetchError || !playlist) {
      throw new Error('Playlist not found');
    }

    if (playlist.user_id !== user.id) {
      throw new Error('Unauthorized: You can only remove tracks from your own playlists');
    }

    const { error } = await supabase
      .from('playlist_tracks')
      .delete()
      .eq('playlist_id', playlistId)
      .eq('video_id', trackId);

    if (error) throw error;
  }

  static async reorderPlaylistTracks(playlistId: string, trackIds: string[]): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      throw new Error('Authentication required');
    }

    const { data: playlist, error: fetchError } = await supabase
      .from('playlists')
      .select('user_id')
      .eq('id', playlistId)
      .single();

    if (fetchError || !playlist) {
      throw new Error('Playlist not found');
    }

    if (playlist.user_id !== user.id) {
      throw new Error('Unauthorized: You can only reorder your own playlists');
    }

    const updates = trackIds.map((videoId, index) => ({
      video_id: videoId,
      position: index,
    }));

    const { error } = await supabase.rpc('reorder_playlist_tracks', {
      p_playlist_id: playlistId,
      p_tracks: updates
    });

    if (error) throw error;
  }
}