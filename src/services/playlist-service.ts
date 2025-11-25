import { supabase } from '@/lib/supabase';
import { Playlist, CreatePlaylistData, AddTrackToPlaylistData } from '@/types/playlist';

export class PlaylistService {
  static async getUserPlaylists(userId: string): Promise<Playlist[]> {
    const { data, error } = await supabase
      .from('playlists')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getPublicPlaylists(): Promise<Playlist[]> {
    const { data, error } = await supabase
      .from('playlists')
      .select(`
        *,
        playlist_tracks(count),
        users (
          username,
          display_name
        )
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(playlist => ({
      ...playlist,
      track_count: playlist.playlist_tracks?.[0]?.count || 0,
      playlist_tracks: undefined,
    }));
  }

  static async getPlaylistById(playlistId: string): Promise<Playlist | null> {
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
    
    return data;
  }

  static async createPlaylist(userId: string, playlistData: CreatePlaylistData): Promise<Playlist> {
    const { data, error } = await supabase
      .from('playlists')
      .insert({
        user_id: userId,
        name: playlistData.name,
        description: playlistData.description,
        cover_image_url: playlistData.cover_image_url,
        is_public: playlistData.is_public ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    return data;
  }

  static async updatePlaylist(playlistId: string, data: Partial<CreatePlaylistData>): Promise<Playlist> {
    const updateData: Record<string, any> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.is_public !== undefined) updateData.is_public = data.is_public;
    if (data.cover_image_url !== undefined) updateData.cover_image_url = data.cover_image_url;

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
    const { error } = await supabase
      .from('playlists')
      .delete()
      .eq('id', playlistId);

    if (error) throw error;
  }

  static async getPlaylistTracks(playlistId: string) {
    const { data, error } = await supabase
      .from('playlist_tracks')
      .select('*')
      .eq('playlist_id', playlistId)
      .order('position', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async addTrackToPlaylist(trackData: AddTrackToPlaylistData): Promise<void> {
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
    const { error } = await supabase
      .from('playlist_tracks')
      .delete()
      .eq('playlist_id', playlistId)
      .eq('video_id', trackId);

    if (error) throw error;
  }

  static async reorderPlaylistTracks(playlistId: string, trackIds: string[]): Promise<void> {
    const updates = trackIds.map((videoId, index) => ({
      playlist_id: playlistId,
      video_id: videoId,
      position: index,
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from('playlist_tracks')
        .update({ position: update.position })
        .eq('playlist_id', update.playlist_id)
        .eq('video_id', update.video_id);

      if (error) throw error;
    }
  }
}

