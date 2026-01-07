import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas públicas (no requieren autenticación)
const publicPaths = ['/api/auth/login','/api/auth/register','/api/auth/forgot-password','/auth/login','/auth/register', '/auth/forgot-password'];

// Rutas que no deben ser interceptadas por el middleware
const excludedPaths = ['/_next', '/favicon.ico', '/themes', '/layout', '/assets'];

export function middleware(request: NextRequest) {
    const { nextUrl } = request;

    // Permitir acceso a rutas excluidas (estáticos, etc.)
    if (excludedPaths.some(path => nextUrl.pathname.startsWith(path))) {
        return NextResponse.next();
    }

    // Verificar si la ruta es pública
    const isPublic = publicPaths.includes(nextUrl.pathname);

    // Para rutas de API: dejar que el backend maneje la autenticación via tokens
    if (nextUrl.pathname.startsWith('/api')) {
        return NextResponse.next();
    }

    // Para rutas del frontend: la autenticación se maneja en el cliente (SessionGuard)
    // No verificamos cookies ya que usamos tokens API
    if (!isPublic) {
        // Podrías agregar lógica adicional aquí si es necesario
        // Por ahora, permitimos el acceso y dejamos que el cliente verifique
        return NextResponse.next();
    }

    // Permitir acceso a rutas públicas
    return NextResponse.next();
}


// Configura los matchers para las rutas protegidas
export const config = {
    matcher: [
        '/((?!_next|themes|assets|layout|favicon.ico).*)',
    ],
}