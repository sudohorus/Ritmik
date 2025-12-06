import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { UnauthorizedError } from '@/utils/error-handler';

export interface AuthenticatedRequest extends NextApiRequest {
    user?: {
        id: string;
        email: string;
    };
}

async function verifyToken(req: NextApiRequest): Promise<{ id: string; email: string } | null> {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.substring(7);

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return null;
        }

        return {
            id: user.id,
            email: user.email || '',
        };
    } catch {
        return null;
    }
}

export function requireAuth(
    handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
) {
    return async (req: AuthenticatedRequest, res: NextApiResponse) => {
        const user = await verifyToken(req);

        if (!user) {
            return res.status(401).json({
                error: 'Unauthorized',
                code: 'UNAUTHORIZED',
            });
        }

        req.user = user;
        return handler(req, res);
    };
}

export function optionalAuth(
    handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
) {
    return async (req: AuthenticatedRequest, res: NextApiResponse) => {
        const user = await verifyToken(req);

        if (user) {
            req.user = user;
        }

        return handler(req, res);
    };
}

export function checkOwnership(userId: string, resourceOwnerId: string): boolean {
    return userId === resourceOwnerId;
}
