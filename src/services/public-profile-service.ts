import { supabase } from '@/lib/supabase';

export interface PublicProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
  created_at: string;
}

export class PublicProfileService {
  static async getProfileByUsername(username: string): Promise<{ data: PublicProfile | null; error: any }> {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, display_name, avatar_url, email, created_at')
      .eq('username', username)
      .single();

    return { data: data as PublicProfile | null, error };
  }

  static async getUserPlaylists(userId: string): Promise<{ data: any[]; error: any }> {
    const { data, error } = await supabase
      .from('playlists')
      .select('id, name, description, cover_image_url, is_public, created_at')
      .eq('user_id', userId)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    return { data: data || [], error };
  }
}



