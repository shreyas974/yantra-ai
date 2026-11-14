import { NextRequest, NextResponse } from 'next/server';
export function middleware(req: NextRequest) {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        const origin = req.headers.get('origin');
        const expected = new URL(process.env.APP_URL || req.url).origin;
        if ((origin && origin !== expected) || req.headers.get('sec-fetch-site') === 'cross-site') {
            return NextResponse.json({ error: 'Cross-origin request rejected.' }, { status: 403 });
        }
        if (Number(req.headers.get('content-length') || 0) > 65536) {
            return NextResponse.json({ error: 'Request too large.' }, { status: 413 });
        }
        if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method) && !req.headers.get('content-type')?.includes('application/json')) {
            // Empty-body logout remains supported.
            if (req.nextUrl.pathname !== '/api/auth/logout')
                return NextResponse.json({ error: 'JSON content type required.' }, { status: 415 });
        }
    }
    const res = NextResponse.next();
    res.headers.set('Cache-Control', 'no-store');
    return res;
}
export const config = { matcher: '/api/:path*' };
