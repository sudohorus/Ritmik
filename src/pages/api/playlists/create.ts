import { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@/utils/supabase/server';
import { PlaylistService } from '@/services/playlist-service';
import { getUserIdFromRequest } from '@/utils/auth';

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

        const userId = await getUserIdFromRequest(req, res);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const supabase = createPagesServerClient(req, res);

        const playlist = await PlaylistService.createPlaylist(userId, playlistData, supabase);

        return res.status(200).json(playlist);

    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
}
