import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserIdFromRequest } from '@/utils/auth';
import { createImportToken } from '@/utils/import-tokens';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const userId = await getUserIdFromRequest(req);

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = createImportToken(userId);

        res.status(200).json({ token });
    } catch (error) {
        console.error('Error creating import token:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
