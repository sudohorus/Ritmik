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

    if (SpotifyService.isTokenExpired(connection.token_expires_at)) {
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
    }

    const playlists = await SpotifyService.getUserPlaylists(accessToken);
    res.status(200).json({ playlists });
}
