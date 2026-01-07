import type { NextApiRequest, NextApiResponse } from 'next';
import { JamService } from '@/services/jam-service';
import { createPagesServerClient } from '@/utils/supabase/server';
import { getUserIdFromRequest } from '@/utils/auth';
import { validateJamCode } from '@/utils/jam-utils';
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

        const { code } = req.body;
        if (!code || typeof code !== 'string') {
            return res.status(400).json({ error: 'Code is required' });
        }

        if (!validateJamCode(code)) {
            return res.status(400).json({ error: 'Invalid jam code' });
        }

        const jam = await JamService.getJamByCode(code.toUpperCase(), supabase);
        if (!jam) {
            return res.status(404).json({ error: 'Jam not found' });
        }

        await JamService.joinJam(jam.id, userId, supabase);

        return res.status(200).json({ jam, serverTime: Date.now() });
    } catch (error: any) {
        if (error.message === 'Jam is full') {
            return res.status(400).json({ error: 'Jam is full' });
        }
        if (error.message === 'Jam has ended') {
            return res.status(400).json({ error: 'Jam has ended' });
        }
        return res.status(500).json({ error: 'Failed to join jam' });
    }
}

export default withRateLimit(handler, {
    interval: 60 * 1000,
    maxRequests: 20
});