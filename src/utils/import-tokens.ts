import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.warn('JWT_SECRET is not defined in environment variables. Import tokens will not work securely.');
}

export function createImportToken(userId: string): string {
    if (!JWT_SECRET) throw new Error('Server configuration error: JWT_SECRET missing');
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '5m' });
}

export function validateImportToken(token: string): string | null {
    if (!JWT_SECRET) return null;
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        return decoded.userId;
    } catch {
        return null;
    }
}
