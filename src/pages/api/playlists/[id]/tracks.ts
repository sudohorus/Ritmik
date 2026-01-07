import { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@/utils/supabase/server';
import { PlaylistService } from '@/services/playlist-service';
import { getUserIdFromRequest } from '@/utils/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid playlist ID' });
    }

    try {
        const userId = await getUserIdFromRequest(req, res);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const supabase = createPagesServerClient(req, res);

        const tracks = await PlaylistService.getPlaylistTracks(id as string, userId, supabase);

        return res.status(200).json(tracks);
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error', details: error });
    }
}
