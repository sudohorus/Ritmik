import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export function createImportToken(userId: string): string {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '5m' });
}

export function validateImportToken(token: string): string | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        return decoded.userId;
    } catch {
        return null;
    }
}
