import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getUserIdFromRequest } from '@/utils/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const userId = await getUserIdFromRequest(req);

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { data: playlists, error } = await supabase
            .from('playlists')
            .select('id, name, description, cover_image_url, is_public, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching playlists:', error);
            return res.status(500).json({ error: 'Failed to fetch playlists' });
        }

        res.status(200).json(playlists || []);
    } catch (error) {
        console.error('API error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
