import type { NextApiRequest, NextApiResponse } from 'next';
import { JamService } from '@/services/jam-service';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { withRateLimit } from '@/middleware/rate-limit';

async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        let token = req.headers.authorization?.replace('Bearer ', '');

        if (!token && req.body) {
            try {
                const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
                token = body.token;
            } catch { }
        }

        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

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

        const supabaseClient = createClient(
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

        await JamService.leaveJam(jamId, user.id, supabaseClient);

        // If the user leaving is the host, the jam should have been ended by the client
        // But as a fallback, we could check if the jam has no active participants
        // However, for now we will rely on the explicit endJam call or the cleanup job


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