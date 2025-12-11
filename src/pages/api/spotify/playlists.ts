import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { SpotifyService } from '@/services/spotify-service';
import type { SpotifyConnection } from '@/types/spotify';
import { getUserIdFromRequest } from '@/utils/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const userId = await getUserIdFromRequest(req);

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: connection, error } = await supabase
        .from('spotify_connections')
        .select('*')
        .eq('user_id', userId)
        .single<SpotifyConnection>();

    if (error || !connection) {
        return res.status(404).json({ error: 'Spotify not connected' });
    }

    let accessToken = connection.access_token;

    try {
        if (SpotifyService.isTokenExpired(connection.token_expires_at)) {
            try {
                const refreshed = await SpotifyService.refreshAccessToken(connection.refresh_token);
                accessToken = refreshed.access_token;

                const expiresAt = SpotifyService.calculateExpiryDate(refreshed.expires_in);

                await supabase
                    .from('spotify_connections')
                    .update({
                        access_token: refreshed.access_token,
                        token_expires_at: expiresAt.toISOString(),
                    })
                    .eq('user_id', userId);
            } catch (refreshError: any) {
                console.error('Spotify token refresh failed:', {
                    userId,
                    error: refreshError?.response?.data || refreshError?.message,
                    statusCode: refreshError?.response?.status
                });

                await supabase
                    .from('spotify_connections')
                    .delete()
                    .eq('user_id', userId);

                return res.status(401).json({
                    error: 'spotify_reauth_required',
                    message: 'Your Spotify connection has expired. Please reconnect your account.'
                });
            }
        }

        const playlists = await SpotifyService.getUserPlaylists(accessToken);
        res.status(200).json({ playlists });
    } catch (error: any) {
        console.error('Spotify API error:', {
            userId,
            error: error?.response?.data || error?.message,
            statusCode: error?.response?.status
        });

        if (error?.response?.status === 403) {
            await supabase
                .from('spotify_connections')
                .delete()
                .eq('user_id', userId);

            return res.status(403).json({
                error: 'spotify_permission_denied',
                message: 'Access to Spotify was denied. Please reconnect and grant all required permissions.'
            });
        }

        return res.status(500).json({
            error: 'spotify_api_error',
            message: 'Failed to fetch playlists from Spotify. Please try again later.'
        });
    }
}
