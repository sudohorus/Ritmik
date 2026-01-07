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

        const { jamId } = req.body;
        if (!jamId || typeof jamId !== 'string') {
            return res.status(400).json({ error: 'Jam ID is required' });
        }

        await JamService.updateHeartbeat(jamId, userId, supabase);

        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to update heartbeat' });
    }
}

export default withRateLimit(handler, {
    interval: 60 * 1000,
    maxRequests: 100
});
