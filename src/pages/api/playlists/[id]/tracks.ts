import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { PlaylistService } from '@/services/playlist-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid playlist ID' });
    }

    try {
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

        const tracks = await PlaylistService.getPlaylistTracks(id as string, user.id, supabase);

        return res.status(200).json(tracks);
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error', details: error });
    }
}
