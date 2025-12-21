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

        const { name } = req.body;
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return res.status(400).json({ error: 'Name is required' });
        }

        if (name.length > 255) {
            return res.status(400).json({ error: 'Name too long' });
        }

        const jam = await JamService.createJam(user.id, { name: name.trim() }, supabase);

        return res.status(201).json({ jam, serverTime: Date.now() });
    } catch (error: any) {
        return res.status(500).json({ error: 'Failed to create jam', details: error.message });
    }
}

export default withRateLimit(handler, {
    interval: 60 * 60 * 1000,
    maxRequests: 10
});