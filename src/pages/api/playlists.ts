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

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 8;
        const search = req.query.search as string;
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        let query = supabase
            .from('playlists')
            .select('id, name, description, cover_image_url, banner_image_url, is_public, created_at', { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(from, to);

        if (search) {
            query = query.ilike('name', `%${search}%`);
        }

        const { data: playlists, error, count } = await query;

        if (error) {
            console.error('Error fetching playlists:', error);
            return res.status(500).json({ error: 'Failed to fetch playlists' });
        }

        res.status(200).json({
            data: playlists || [],
            meta: {
                page,
                limit,
                total: count || 0,
                hasMore: (count || 0) > to + 1
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}
