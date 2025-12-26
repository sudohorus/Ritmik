import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { PlaylistService } from '@/services/playlist-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { token, ...playlistData } = req.body;

    if (!token) {
        return res.status(400).json({ error: 'Turnstile token is required' });
    }

    try {
        const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                secret: process.env.TURNSTILE_SECRET_KEY,
                response: token,
                remoteip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            }),
        });

        const verifyResult = await verifyResponse.json();

        if (!verifyResult.success) {
            return res.status(400).json({ error: 'Invalid Turnstile token' });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        const supabase = createClient(supabaseUrl, supabaseKey, {
            global: {
                headers: req.headers.authorization ? {
                    Authorization: req.headers.authorization
                } : undefined
            }
        });

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const playlist = await PlaylistService.createPlaylist(user.id, playlistData, supabase);

        return res.status(200).json(playlist);

    } catch {
        return res.status(500).json({ error: 'Internal server error' });
    }
}
