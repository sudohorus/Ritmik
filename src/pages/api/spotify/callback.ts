import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { SpotifyService } from '@/services/spotify-service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
        return res.redirect('/settings/integrations?error=spotify_auth_failed');
    }

    if (!code || typeof code !== 'string') {
        return res.redirect('/settings/integrations?error=missing_code');
    }

    if (!state || typeof state !== 'string') {
        return res.redirect('/settings/integrations?error=invalid_state');
    }

    try {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        // Get userId from state parameter (passed from connect endpoint)
        const userId = state;

        const tokens = await SpotifyService.exchangeCodeForTokens(code);
        const userProfile = await SpotifyService.getUserProfile(tokens.access_token);
        const expiresAt = SpotifyService.calculateExpiryDate(tokens.expires_in);

        const { error: dbError } = await supabaseAdmin
            .from('spotify_connections')
            .upsert({
                user_id: userId,
                spotify_user_id: userProfile.id,
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                token_expires_at: expiresAt.toISOString(),
                connected_at: new Date().toISOString(),
            }, {
                onConflict: 'user_id'
            });

        if (dbError) {
            console.error('Database error:', dbError);
            return res.redirect('/settings/integrations?error=database_error');
        }

        res.redirect('/settings/integrations?success=spotify_connected');
    } catch (error) {
        console.error('Spotify callback error:', error);
        res.redirect('/settings/integrations?error=connection_failed');
    }
}
