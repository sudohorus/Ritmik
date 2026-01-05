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
      .select('*, playlist_collaborators!inner(user_id)', { count: 'exact', head: false })
      .or(`user_id.eq.${userId},playlist_collaborators.user_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data: data1, error: error1 } = await supabase
      .from('playlists')
      .select('*')
      .eq('user_id', userId);

    let data2: any[] = [];
    let error2 = null;

    try {
      const result = await supabase
        .from('playlist_collaborators')
        .select('playlist_id, playlists(*)')
        .eq('user_id', userId);
      data2 = result.data || [];
      error2 = result.error;
    } catch (e) {

    }

    if (error1) throw error1;

    const ownedPlaylists = data1 || [];
    const collaborativePlaylists = (data2 || []).map((item: any) => item.playlists);

    const allPlaylists = [...ownedPlaylists, ...collaborativePlaylists].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    let filtered = allPlaylists;
    if (search) {
      filtered = allPlaylists.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    }

    const paginated = filtered.slice(from, to + 1);

    return { data: paginated, count: filtered.length };
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

    return { data: playlists, count: count || 0 };
  }

  static async getPlaylistById(playlistId: string, userId?: string): Promise<Playlist | null> {
    let currentUserId = userId;

    if (!currentUserId) {
      const { data: { session } } = await supabase.auth.getSession();
      currentUserId = session?.user?.id;
    }

    let { data, error } = await supabase
      .from('playlists')
      .select(`
        *,
        users (
          username,
          display_name
        ),
        playlist_collaborators (
          user_id,
          added_at,
          users:users!playlist_collaborators_user_id_fkey (
            username,
            display_name,
            avatar_url
          )
        )
      `)
      .eq('id', playlistId)
      .single();

    if (error) {
      const { data: fallbackData, error: fallbackError } = await supabase
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

      if (fallbackError) {
        if (fallbackError.code === 'PGRST116') return null;
        throw fallbackError;
      }
      data = fallbackData;
    }
    return {
      ...data,
      collaborators: data.playlist_collaborators
    };
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
        cover_crop: playlistData.cover_crop,
        banner_crop: playlistData.banner_crop,
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
    if (data.cover_crop !== undefined) updateData.cover_crop = data.cover_crop;
    if (data.banner_crop !== undefined) updateData.banner_crop = data.banner_crop;

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
  }

  static async getPlaylist(playlistId: string, userId?: string, client?: any): Promise<Playlist> {
    const supabaseClient = client || supabase;
    let { data: playlist, error } = await supabaseClient
      .from('playlists')
      .select(`
        *, 
        users(username, display_name, avatar_url),
        playlist_collaborators(user_id)
      `)
      .eq('id', playlistId)
      .single();

    if (error) {
      const { data: fallbackPlaylist, error: fallbackError } = await supabaseClient
        .from('playlists')
        .select(`
          *, 
          users(username, display_name, avatar_url)
        `)
        .eq('id', playlistId)
        .single();

      if (fallbackError || !fallbackPlaylist) {
        throw new Error('Playlist not found');
      }
      playlist = fallbackPlaylist;
    } else if (!playlist) {
      throw new Error('Playlist not found');
    }

    return {
      ...playlist,
      collaborators: playlist.playlist_collaborators
    };
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
      .select(`
        *,
        added_by_user: users!playlist_tracks_added_by_fkey (
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('playlist_id', playlistId)
      .order('position', { ascending: true });

    if (error) {
      const { data: fallbackData, error: fallbackError } = await supabaseClient
        .from('playlist_tracks')
        .select('*')
        .eq('playlist_id', playlistId)
        .order('position', { ascending: true });

      if (fallbackError) throw fallbackError;
      return fallbackData || [];
    }

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
      .select('user_id, playlist_collaborators(user_id)')
      .eq('id', trackData.playlist_id)
      .single();

    if (fetchError || !playlist) {
      throw new Error('Playlist not found');
    }

    const isOwner = playlist.user_id === user.id;
    const isCollaborator = playlist.playlist_collaborators?.some((c: any) => c.user_id === user.id);

    if (!isOwner && !isCollaborator) {
      throw new Error('Unauthorized: You can only add tracks to your own or collaborative playlists');
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
        added_by: user.id,
      });

    if (error) {
      if (error.code === '23505') {
        throw new Error('Track already exists in this playlist');
      }
      throw error;
    }
  }

  static async addTracksToPlaylist(playlistId: string, tracks: AddTrackToPlaylistData[]): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      throw new Error('Authentication required');
    }

    const { data: playlist, error: fetchError } = await supabase
      .from('playlists')
      .select('user_id, playlist_collaborators(user_id)')
      .eq('id', playlistId)
      .single();

    if (fetchError || !playlist) {
      throw new Error('Playlist not found');
    }

    const isOwner = playlist.user_id === user.id;
    const isCollaborator = playlist.playlist_collaborators?.some((c: any) => c.user_id === user.id);

    if (!isOwner && !isCollaborator) {
      throw new Error('Unauthorized: You can only add tracks to your own or collaborative playlists');
    }

    const currentTracks = await this.getPlaylistTracks(playlistId);
    let nextPosition = currentTracks.length;

    const tracksToInsert = tracks.map((track, index) => ({
      playlist_id: playlistId,
      video_id: track.track_id,
      title: track.title,
      artist: track.artist,
      thumbnail_url: track.thumbnail,
      duration: track.duration,
      position: nextPosition + index,
      added_by: user.id,
    }));

    const { error } = await supabase
      .from('playlist_tracks')
      .insert(tracksToInsert)
      .select();

    if (error) {
      if (error.code === '23505') {
        const { error: retryError } = await supabase
          .from('playlist_tracks')
          .insert(tracksToInsert)
          .select();

        if (retryError) throw retryError;
        return;
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
      .select('user_id, playlist_collaborators(user_id)')
      .eq('id', playlistId)
      .single();

    if (fetchError || !playlist) {
      throw new Error('Playlist not found');
    }

    const isOwner = playlist.user_id === user.id;
    const isCollaborator = playlist.playlist_collaborators?.some((c: any) => c.user_id === user.id);

    if (!isOwner && !isCollaborator) {
      throw new Error('Unauthorized: You can only remove tracks from your own or collaborative playlists');
    }

    const { error } = await supabase
      .from('playlist_tracks')
      .delete()
      .eq('playlist_id', playlistId)
      .eq('video_id', trackId);

    if (error) throw error;
  }

  static async removeTracksFromPlaylist(playlistId: string, trackIds: string[]): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      throw new Error('Authentication required');
    }

    const { data: playlist, error: fetchError } = await supabase
      .from('playlists')
      .select('user_id, playlist_collaborators(user_id)')
      .eq('id', playlistId)
      .single();

    if (fetchError || !playlist) {
      throw new Error('Playlist not found');
    }

    const isOwner = playlist.user_id === user.id;
    const isCollaborator = playlist.playlist_collaborators?.some((c: any) => c.user_id === user.id);

    if (!isOwner && !isCollaborator) {
      throw new Error('Unauthorized: You can only remove tracks from your own or collaborative playlists');
    }

    const { error } = await supabase
      .from('playlist_tracks')
      .delete()
      .eq('playlist_id', playlistId)
      .in('video_id', trackIds);

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
      .select('user_id, playlist_collaborators(user_id)')
      .eq('id', playlistId)
      .single();

    if (fetchError || !playlist) {
      throw new Error('Playlist not found');
    }

    const isOwner = playlist.user_id === user.id;
    const isCollaborator = playlist.playlist_collaborators?.some((c: any) => c.user_id === user.id);

    if (!isOwner && !isCollaborator) {
      throw new Error('Unauthorized: You can only reorder your own or collaborative playlists');
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

  static async addCollaborator(playlistId: string, userId: string): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    const currentUser = session?.user;
    if (!currentUser) {
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

    if (playlist.user_id !== currentUser.id) {
      throw new Error('Unauthorized: Only the owner can add collaborators');
    }

    const { error } = await supabase
      .from('playlist_collaborators')
      .insert({
        playlist_id: playlistId,
        user_id: userId,
        added_by: currentUser.id
      });

    if (error) {
      if (error.code === '23505') {
        throw new Error('User is already a collaborator');
      }
      throw error;
    }
  }

  static async removeCollaborator(playlistId: string, userId: string): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    const currentUser = session?.user;
    if (!currentUser) {
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

    if (playlist.user_id !== currentUser.id && userId !== currentUser.id) {
      throw new Error('Unauthorized: You can only remove collaborators from your own playlists or leave yourself');
    }

    const { error } = await supabase
      .from('playlist_collaborators')
      .delete()
      .eq('playlist_id', playlistId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  static async createInviteLink(playlistId: string, options: { maxUses?: number, expiresInMinutes?: number } = {}): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Authentication required');

    const { data: playlist, error: fetchError } = await supabase
      .from('playlists')
      .select('user_id')
      .eq('id', playlistId)
      .single();

    if (fetchError || !playlist) throw new Error('Playlist not found');
    if (playlist.user_id !== user.id) throw new Error('Unauthorized');

    const token = crypto.randomUUID();
    const expiresAt = options.expiresInMinutes
      ? new Date(Date.now() + options.expiresInMinutes * 60 * 1000).toISOString()
      : null;

    const { error } = await supabase
      .from('playlist_invites')
      .insert({
        playlist_id: playlistId,
        token,
        created_by: user.id,
        max_uses: options.maxUses ?? null,
        expires_at: expiresAt
      });

    if (error) {
      throw error;
    }

    return token;
  }

  static async validateInvite(token: string): Promise<{ playlist: Playlist, invite: any }> {
    const { data, error } = await supabase.rpc('validate_playlist_invite', {
      invite_token: token
    });

    if (error) throw new Error(error.message || 'Invalid invite link');
    if (!data) throw new Error('Invalid invite link');

    const result = typeof data === 'string' ? JSON.parse(data) : data;

    return {
      playlist: result.playlist,
      invite: {
        ...result.invite,
        inviter: result.inviter
      }
    };
  }

  static async acceptInvite(token: string): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Authentication required');

    const { error } = await supabase.rpc('accept_playlist_invite', {
      invite_token: token
    });

    if (error) {
      throw error;
    }
  }
}