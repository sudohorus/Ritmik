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

        const userId = state;

        let tokens;
        try {
            tokens = await SpotifyService.exchangeCodeForTokens(code);
        } catch (tokenError: any) {
            console.error('Token exchange failed:', {
                userId,
                error: tokenError?.response?.data || tokenError?.message,
                statusCode: tokenError?.response?.status
            });
            return res.redirect('/settings/integrations?error=token_exchange_failed');
        }

        let userProfile;
        try {
            userProfile = await SpotifyService.getUserProfile(tokens.access_token);
        } catch (profileError: any) {
            console.error('Get user profile failed:', {
                userId,
                error: profileError?.response?.data || profileError?.message,
                statusCode: profileError?.response?.status
            });

            if (profileError?.response?.status === 403) {
                return res.redirect('/settings/integrations?error=spotify_permissions_denied');
            }

            return res.redirect('/settings/integrations?error=profile_fetch_failed');
        }

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
            console.error('Database error:', {
                userId,
                error: dbError
            });
            return res.redirect('/settings/integrations?error=database_error');
        }

        res.redirect('/settings/integrations?success=spotify_connected');
    } catch (error: any) {
        console.error('Spotify callback error:', {
            error: error?.message,
            stack: error?.stack
        });
        res.redirect('/settings/integrations?error=connection_failed');
    }
}
