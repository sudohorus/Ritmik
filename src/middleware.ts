import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
    const origin = request.headers.get('origin');

    const allowedOrigins = [
        'http://localhost:3000',
        process.env.NEXT_PUBLIC_SITE_URL,
        'https://ritmik.vercel.app'
    ].filter(Boolean);

    const isAllowedOrigin = origin && allowedOrigins.includes(origin);

    if (process.env.NODE_ENV === 'production') {
        const proto = request.headers.get('x-forwarded-proto');
        if (proto && proto !== 'https') {
            const url = new URL(request.url);
            url.protocol = 'https:';
            return NextResponse.redirect(url);
        }
    }

    const isApiRoute = request.nextUrl.pathname.startsWith('/api');

    if (isApiRoute) {
        if (request.method === 'OPTIONS') {
            const response = new NextResponse(null, { status: 200 });
            if (isAllowedOrigin) {
                response.headers.set('Access-Control-Allow-Origin', origin);
                response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
                response.headers.set('Access-Control-Max-Age', '86400');
            }
            return response;
        }
    }

    const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.youtube.com https://s.ytimg.com https://www.google.com https://www.gstatic.com https://challenges.cloudflare.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https:;
    font-src 'self' https://fonts.gstatic.com;
    frame-src 'self' https://www.youtube.com https://challenges.cloudflare.com;
    connect-src 'self' https://www.youtube.com https://s.ytimg.com https://*.supabase.co https://*.supabase.in https://api.ipify.org wss://*.supabase.co;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    block-all-mixed-content;
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-nonce', nonce);
    requestHeaders.set('Content-Security-Policy', cspHeader);

    const response = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });

    if (isApiRoute && isAllowedOrigin) {
        response.headers.set('Access-Control-Allow-Origin', origin);
    }

    response.headers.set('Content-Security-Policy', cspHeader);
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    response.headers.set('X-XSS-Protection', '1; mode=block');

    return response;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
