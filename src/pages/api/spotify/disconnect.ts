import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@/utils/supabase/server';
import { getUserIdFromRequest } from '@/utils/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const userId = await getUserIdFromRequest(req, res);

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = createPagesServerClient(req, res);

    const { error } = await supabase
        .from('spotify_connections')
        .delete()
        .eq('user_id', userId);

    if (error) {
        return res.status(500).json({ error: 'Failed to disconnect Spotify' });
    }

    res.status(200).json({ success: true });
}
