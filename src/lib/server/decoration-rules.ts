import { SupabaseClient } from '@supabase/supabase-js';

type EligibilityChecker = (userId: string, supabase: SupabaseClient) => Promise<boolean>;

const rules: Record<string, EligibilityChecker> = {
    'New Year 2026': async () => {
        const now = new Date();
        const start = new Date('2025-12-31T00:00:00-03:00');
        const end = new Date('2026-01-02T23:59:59-03:00');
        return now >= start && now <= end;
    },

    'Bizarre Listener': async (userId, supabase) => {
        const { data: { user }, error } = await supabase.auth.admin.getUserById(userId);

        if (error || !user || !user.created_at) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('created_at')
                .eq('id', userId)
                .single();

            if (profile?.created_at) {
                const createdDate = new Date(profile.created_at);
                const cutoffDate = new Date('2025-12-14T23:59:59');
                return createdDate <= cutoffDate;
            }
            return false;
        }

        const createdDate = new Date(user.created_at);
        const cutoffDate = new Date('2025-12-14T23:59:59');
        return createdDate <= cutoffDate;
    },

    'UFC Belt': async (userId, supabase) => {
        const allowedUsers = ['sudohorus', 'kiuzo'];
        const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', userId)
            .single();

        return !!(profile && profile.username && allowedUsers.includes(profile.username));
    },

    'Santa Hat': async () => {
        const now = new Date();
        const start = new Date('2025-12-23T00:00:00-03:00');
        const end = new Date('2025-12-25T23:59:59-03:00');
        return now >= start && now <= end;
    },

    '10 Hours Listener': async (userId, supabase) => {
        const { data: stats, error } = await supabase
            .from('user_statistics')
            .select('total_listen_time')
            .eq('user_id', userId)
            .single();

        if (error || !stats) return false;
        return (stats.total_listen_time || 0) >= 36000;
    }
};

export const checkEligibility = async (
    decorationName: string,
    userId: string,
    supabase: SupabaseClient,
    isFree: boolean
): Promise<boolean> => {
    const checker = rules[decorationName];
    if (checker) {
        return checker(userId, supabase);
    }

    if (isFree) {
        return true;
    }

    return false;
};
