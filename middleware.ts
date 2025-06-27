import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas protegidas (puedes ajustar el patrón según tus necesidades)
const publicPaths = ['/auth/login','/auth/register', '/auth/forgot-password'];

export function middleware(request: NextRequest) {
    const { cookies, nextUrl } = request;
    if (
        nextUrl.pathname.startsWith('/_next') ||
        nextUrl.pathname.startsWith('/favicon.ico') ||
        nextUrl.pathname.startsWith('/public') ||
        nextUrl.pathname.startsWith('/styles') ||
        nextUrl.pathname.startsWith('/api')
    ) {
        return NextResponse.next();
    }
    // Verifica si la cookie de sesión existe
    const isAuthenticated = cookies.has('apideic_session'); // O el nombre de tu cookie de sesión

    // Verifica si la ruta es pública
    const isPublic = publicPaths.includes(nextUrl.pathname);

    
    if (!isPublic && !isAuthenticated) {
        // Redirige a login si no hay sesión
        return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // Permite el acceso si hay sesión o la ruta no es protegida
    return NextResponse.next();
}

// Configura los matchers para las rutas protegidas
export const config = {
    matcher: [
        '/((?!_next|favicon.ico|public|styles|api).*)',
    ],
}