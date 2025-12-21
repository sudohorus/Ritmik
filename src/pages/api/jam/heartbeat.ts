import type { NextApiRequest, NextApiResponse } from 'next';
import { JamService } from '@/services/jam-service';
import { createClient } from '@supabase/supabase-js';
import { withRateLimit } from '@/middleware/rate-limit';

async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                global: {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { jamId } = req.body;
        if (!jamId || typeof jamId !== 'string') {
            return res.status(400).json({ error: 'Jam ID is required' });
        }

        await JamService.updateHeartbeat(jamId, user.id, supabase);

        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to update heartbeat' });
    }
}

export default withRateLimit(handler, {
    interval: 60 * 1000,
    maxRequests: 100
});
