import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data, error } = await supabase.rpc('cleanup_inactive_jam_participants');

        if (error) {
            console.error('Cleanup error:', error);
            return res.status(500).json({ error: 'Cleanup failed' });
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Cleanup error:', error);
        return res.status(500).json({ error: 'Cleanup failed' });
    }
}
