import { supabase } from '@/lib/supabase';

export interface UserSettings {
  followers_public: boolean;
  following_public: boolean;
  show_activity: boolean;
}

export class SettingsService {
  static async getUserSettings(userId: string): Promise<UserSettings | null> {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data) {
        return {
          followers_public: true,
          following_public: true,
          show_activity: true,
        };
      }

      return {
        followers_public: data.followers_public,
        following_public: data.following_public,
        show_activity: data.show_activity,
      };
    } catch (err) {
      return {
        followers_public: true,
        following_public: true,
        show_activity: true,
      };
    }
  }

  static async updateUserSettings(userId: string, settings: UserSettings): Promise<void> {
    const { error } = await supabase
      .from('user_settings')
      .upsert(
        {
          user_id: userId,
          followers_public: settings.followers_public,
          following_public: settings.following_public,
          show_activity: settings.show_activity,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (error) {
      console.error('Error saving user settings:', error);
      throw error;
    }
  }

  static async checkFollowersPublic(userId: string): Promise<boolean> {
    const settings = await this.getUserSettings(userId);
    return settings?.followers_public ?? true;
  }

  static async checkFollowingPublic(userId: string): Promise<boolean> {
    const settings = await this.getUserSettings(userId);
    return settings?.following_public ?? true;
  }
}
