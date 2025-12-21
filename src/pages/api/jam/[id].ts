import type { NextApiRequest, NextApiResponse } from 'next';
import { JamService } from '@/services/jam-service';
import { createClient } from '@supabase/supabase-js';
import { withRateLimit } from '@/middleware/rate-limit';

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;

    if (typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid jam ID' });
    }

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

    try {
        if (req.method === 'GET') {
            const [jam, participants] = await Promise.all([
                JamService.getJamById(id, supabase),
                JamService.getActiveParticipants(id, supabase)
            ]);

            if (!jam) {
                return res.status(404).json({ error: 'Jam not found' });
            }

            return res.status(200).json({ jam, participants });
        }

        if (req.method === 'PUT') {
            const { current_track_id, current_position, is_playing, queue } = req.body;
            await JamService.updateJamState(id, user.id, {
                current_track_id,
                current_position,
                is_playing,
                queue
            }, supabase);

            return res.status(200).json({ success: true });
        }

        if (req.method === 'DELETE') {
            await JamService.endJam(id, user.id, supabase);
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error: any) {
        console.error('Error handling jam request:', error);
        if (error.message === 'Only host can update jam state' || error.message === 'Only host can end jam') {
            return res.status(403).json({ error: error.message });
        }
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export default withRateLimit(handler, {
    interval: 60 * 1000, 
    maxRequests: 120 
});