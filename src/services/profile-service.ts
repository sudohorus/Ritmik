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
    try {
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

      const { error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);

      if (updateError) {
        if (updateError.code === '23505' || updateError.message?.includes('unique constraint')) {
          return { 
            data: null, 
            error: { 
              message: 'This username is already taken. Please choose another one.',
              code: 'USERNAME_TAKEN'
            } 
          };
        }
        return { data: null, error: updateError };
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
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

      return { data: data as User | null, error };
    } catch (err) {
      return { 
        data: null, 
        error: { 
          message: err instanceof Error ? err.message : 'Failed to update profile',
        } 
      };
    }
  }
}

