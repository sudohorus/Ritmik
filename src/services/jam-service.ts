import { supabase } from '@/lib/supabase';
import { JamSession, JamParticipant, CreateJamData, UpdateJamStateData } from '@/types/jam';
import { Track } from '@/types/track';
import { generateJamCode } from '@/utils/jam-utils';
import { SupabaseClient } from '@supabase/supabase-js';

export class JamService {
    static async createJam(hostUserId: string, data: CreateJamData, client: SupabaseClient = supabase): Promise<JamSession> {
        await this.cleanupInactiveParticipants(client);

        let code = generateJamCode();
        let attempts = 0;
        const maxAttempts = 10;

        while (attempts < maxAttempts) {
            const { data: existing } = await client
                .from('jam_sessions')
                .select('id')
                .eq('code', code)
                .single();

            if (!existing) break;

            code = generateJamCode();
            attempts++;
        }

        if (attempts === maxAttempts) {
            throw new Error('Failed to generate unique jam code');
        }

        const { data: jam, error } = await client
            .from('jam_sessions')
            .insert({
                host_user_id: hostUserId,
                name: data.name,
                code,
                is_active: true,
            })
            .select()
            .single();

        if (error) throw error;
        if (!jam) throw new Error('Failed to create jam');

        await client
            .from('jam_participants')
            .insert({
                jam_session_id: jam.id,
                user_id: hostUserId,
                is_active: true,
            });

        return jam;
    }

    static async getJamByCode(code: string, client: SupabaseClient = supabase): Promise<JamSession | null> {

        const { data, error } = await client
            .from('jam_sessions')
            .select('*')
            .eq('code', code.toUpperCase())
            .eq('is_active', true)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }

        return data;
    }

    static async getJamById(jamId: string, client: SupabaseClient = supabase): Promise<JamSession | null> {
        const { data, error } = await client
            .from('jam_sessions')
            .select('*')
            .eq('id', jamId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }

        return data;
    }

    static async joinJam(jamId: string, userId: string, client: SupabaseClient = supabase): Promise<void> {
        await this.cleanupInactiveParticipants(client);

        const jam = await this.getJamById(jamId, client);

        if (!jam) {
            throw new Error('Jam not found');
        }

        if (!jam.is_active) {
            throw new Error('Jam has ended');
        }

        const participants = await this.getActiveParticipants(jamId, client);

        if (participants.length >= jam.max_participants) {
            throw new Error('Jam is full');
        }

        const { error } = await client
            .from('jam_participants')
            .upsert({
                jam_session_id: jamId,
                user_id: userId,
                is_active: true,
                left_at: null,
            }, {
                onConflict: 'jam_session_id,user_id'
            });

        if (error) throw error;
    }

    static async leaveJam(jamId: string, userId: string, client: SupabaseClient = supabase): Promise<void> {
        const jam = await this.getJamById(jamId, client);
        if (!jam) return;

        if (jam.host_user_id === userId) {
            return this.endJam(jamId, userId, client);
        }

        const { error } = await client
            .from('jam_participants')
            .update({
                is_active: false,
                left_at: new Date().toISOString(),
            })
            .eq('jam_session_id', jamId)
            .eq('user_id', userId);

        if (error) throw error;
    }

    static async updateHeartbeat(jamId: string, userId: string, client: SupabaseClient = supabase): Promise<void> {
        const { error } = await client
            .from('jam_participants')
            .update({
                last_seen: new Date().toISOString(),
            })
            .eq('jam_session_id', jamId)
            .eq('user_id', userId)
            .eq('is_active', true);

        if (error) throw error;
    }


    static async endJam(jamId: string, hostUserId: string, client: SupabaseClient = supabase): Promise<void> {
        const jam = await this.getJamById(jamId, client);

        if (!jam) {
            throw new Error('Jam not found');
        }

        if (jam.host_user_id !== hostUserId) {
            throw new Error('Only host can end jam');
        }

        await client
            .from('jam_participants')
            .update({
                is_active: false,
                left_at: new Date().toISOString(),
            })
            .eq('jam_session_id', jamId);

        const { error: jamError } = await client
            .from('jam_sessions')
            .update({
                is_active: false,
                ended_at: new Date().toISOString(),
            })
            .eq('id', jamId);

        if (jamError) throw jamError;
    }


    static async updateJamState(jamId: string, hostUserId: string, data: UpdateJamStateData, client: SupabaseClient = supabase): Promise<void> {
        const jam = await this.getJamById(jamId, client);

        if (!jam) {
            throw new Error('Jam not found');
        }

        if (jam.host_user_id !== hostUserId) {
            throw new Error('Only host can update jam state');
        }

        const updateData: any = {
            updated_at: new Date().toISOString(),
        };

        if (data.current_track_id !== undefined) {
            updateData.current_track_id = data.current_track_id;
        }

        if (data.current_position !== undefined) {
            updateData.current_position = data.current_position;
        }

        if (data.is_playing !== undefined) {
            updateData.is_playing = data.is_playing;
        }

        if (data.queue !== undefined) {
            updateData.queue = data.queue;
        }

        const { error } = await client
            .from('jam_sessions')
            .update(updateData)
            .eq('id', jamId);

        if (error) throw error;
    }

    static async getActiveParticipants(jamId: string, client: SupabaseClient = supabase): Promise<JamParticipant[]> {
        const { data, error } = await client
            .from('jam_participants')
            .select(`
        *,
        user:users(id, username, display_name, avatar_url)
      `)
            .eq('jam_session_id', jamId)
            .eq('is_active', true)
            .order('joined_at', { ascending: true });

        if (error) throw error;
        return data || [];
    }

    static async isUserInJam(userId: string, client: SupabaseClient = supabase): Promise<JamSession | null> {
        const { data, error } = await client
            .from('jam_participants')
            .select('jam_session_id')
            .eq('user_id', userId)
            .eq('is_active', true)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }

        if (!data) return null;

        return await this.getJamById(data.jam_session_id, client);
    }
    static async cleanupInactiveParticipants(client: SupabaseClient = supabase): Promise<void> {
        try {
            await client.rpc('cleanup_inactive_jam_participants');
        } catch { }
    }
}
