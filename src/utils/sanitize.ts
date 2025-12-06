export function sanitizeString(input: string): string {
    if (typeof input !== 'string') return '';

    return input
        .replace(/[<>]/g, '') 
        .replace(/javascript:/gi, '') 
        .replace(/on\w+=/gi, '') 
        .trim()
        .slice(0, 1000);
}

export function sanitizeHtml(html: string): string {
    if (typeof html !== 'string') return '';

    return html
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

export function sanitizeEmail(email: string): string | null {
    if (typeof email !== 'string') return null;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const sanitized = email.trim().toLowerCase().slice(0, 254);

    return emailRegex.test(sanitized) ? sanitized : null;
}

export function sanitizeUrl(url: string): string | null {
    if (typeof url !== 'string') return null;

    try {
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return null;
        }
        return parsed.toString();
    } catch {
        return null;
    }
}

export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
    const sanitized: any = {};

    for (const [key, value] of Object.entries(obj)) {
        const sanitizedKey = sanitizeString(key);

        if (typeof value === 'string') {
            sanitized[sanitizedKey] = sanitizeString(value);
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            sanitized[sanitizedKey] = sanitizeObject(value);
        } else {
            sanitized[sanitizedKey] = value;
        }
    }

    return sanitized as T;
}

export function parseJsonSafely<T = any>(jsonString: string): T | null {
    try {
        return JSON.parse(jsonString);
    } catch {
        return null;
    }
}
