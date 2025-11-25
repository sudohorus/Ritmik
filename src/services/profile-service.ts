import { supabase } from '@/lib/supabase';
import { User } from '@/types/auth';

export interface UpdateProfileData {
  username?: string;
  display_name?: string;
  avatar_url?: string;
}

export class ProfileService {
  static async getUserProfile(userId: string): Promise<{ data: User | null; error: any }> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    return { data: data as User | null, error };
  }

  static async checkUsernameAvailable(username: string, currentUserId: string): Promise<{ available: boolean; error: any }> {
    const { data, error } = await supabase
      .from('users')
      .select('id, username')
      .eq('username', username)
      .single();

    if (error && error.code !== 'PGRST116') {
      return { available: false, error };
    }

    if (data && data.id !== currentUserId) {
      return { available: false, error: null };
    }

    return { available: true, error: null };
  }

  static async updateProfile(userId: string, updates: UpdateProfileData): Promise<{ data: User | null; error: any }> {
    if (updates.username) {
      const { available, error: checkError } = await this.checkUsernameAvailable(updates.username, userId);
      
      if (checkError) {
        return { data: null, error: checkError };
      }

      if (!available) {
        return { 
          data: null, 
          error: { 
            message: 'This username is already taken. Please choose another one.',
            code: 'USERNAME_TAKEN'
          } 
        };
      }
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === '23505' || error.message?.includes('unique constraint')) {
        return { 
          data: null, 
          error: { 
            message: 'This username is already taken. Please choose another one.',
            code: 'USERNAME_TAKEN'
          } 
        };
      }
      return { data: null, error };
    }

    if (!error && data) {
      await supabase.auth.updateUser({
        data: {
          username: updates.username || data.username,
          display_name: updates.display_name || data.display_name,
          avatar_url: updates.avatar_url || data.avatar_url,
        },
      });
    }

    return { data: data as User | null, error };
  }
}

