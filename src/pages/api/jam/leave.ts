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

        const supabaseClient = createPagesServerClient(req, res);

        let jamId: string;

        if (typeof req.body === 'string') {
            try {
                const parsed = JSON.parse(req.body);
                jamId = parsed.jamId;
            } catch {
                return res.status(400).json({ error: 'Invalid request body' });
            }
        } else {
            jamId = req.body.jamId;
        }

        if (!jamId || typeof jamId !== 'string') {
            return res.status(400).json({ error: 'Jam ID is required' });
        }

        await JamService.leaveJam(jamId, userId, supabaseClient);

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Leave jam error:', error);
        return res.status(500).json({ error: 'Failed to leave jam' });
    }
}

export default withRateLimit(handler, {
    interval: 60 * 1000,
    maxRequests: 30
});