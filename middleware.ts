import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas protegidas (puedes ajustar el patrón según tus necesidades)
const publicPaths = ['/auth/login','/auth/register', '/auth/forgot-password', '/sanctum/csrf-cookie'];

export function middleware(request: NextRequest) {
    const { cookies, nextUrl } = request;
    if (
        nextUrl.pathname.startsWith('/_next') ||
        nextUrl.pathname.startsWith('/favicon.ico') ||
        nextUrl.pathname.startsWith('/themes') ||
        nextUrl.pathname.startsWith('/assets') // Permite el acceso a la ruta CSRF de NextAuth
    ) {
        return NextResponse.next();
    }
    
    const isAuthenticated = cookies.get('apideic_session');
    const isApi = nextUrl.pathname.startsWith('/api');

    // Si es endpoint de API y no autenticado, responde 401 JSON (no redirige)
    if (isApi && !isAuthenticated) {
        return NextResponse.json({ error: 'Unauthorized desde nextjs middleware' }, { status: 401 });
    }

    // Solo redirige a login en rutas de páginas protegidas
    if (!isApi && !isAuthenticated) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    return NextResponse.next();
}


// Configura los matchers para las rutas protegidas
export const config = {
    matcher: [
        '/((?!_next|themes|assets|favicon.ico).*)',
    ],
}