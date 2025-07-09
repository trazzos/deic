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
    // Verifica si la cookie de sesión existe
    const isAuthenticated = cookies.get('apideic_session'); // O el nombre de tu cookie de sesión

    // Verifica si la ruta es pública

    const isPublic = publicPaths.includes(nextUrl.pathname);

    // Si es endpoint de API y no autenticado, responde 401 JSON
    if (nextUrl.pathname.startsWith('/api') && !isPublic && !isAuthenticated) {
        return NextResponse.json({ error: 'Unauthorized desde nextjs middleware' }, { status: 401 });
    }


   if (!nextUrl.pathname.startsWith('/api') && !isPublic && !isAuthenticated) {
        //Redirige a login si no hay sesión
        return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // Permite el acceso si hay sesión o la ruta no es protegida
    return NextResponse.next();
}


// Configura los matchers para las rutas protegidas
export const config = {
    matcher: [
        '/((?!_next|themes|assets|favicon.ico).*)',
    ],
}