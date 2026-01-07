import type { NextApiRequest, NextApiResponse } from 'next';
import { JamService } from '@/services/jam-service';
import { createPagesServerClient } from '@/utils/supabase/server';
import { getUserIdFromRequest } from '@/utils/auth';
import { withRateLimit } from '@/middleware/rate-limit';

async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const userId = await getUserIdFromRequest(req, res);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const supabase = createPagesServerClient(req, res);

        const { name } = req.body;
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return res.status(400).json({ error: 'Name is required' });
        }

        if (name.length > 255) {
            return res.status(400).json({ error: 'Name too long' });
        }

        const jam = await JamService.createJam(userId, { name: name.trim() }, supabase);

        return res.status(201).json({ jam, serverTime: Date.now() });
    } catch (error: any) {
        return res.status(500).json({ error: 'Failed to create jam', details: error.message });
    }
}

export default withRateLimit(handler, {
    interval: 60 * 60 * 1000,
    maxRequests: 10
});