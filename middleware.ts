import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas protegidas (puedes ajustar el patrón según tus necesidades)
const publicPaths = ['/auth/login','/auth/register', '/auth/forgot-password', '/sanctum/csrf-cookie'];

export function middleware(request: NextRequest) {
    
    // Permite el acceso si hay sesión o la ruta no es protegida
    return NextResponse.next();
}


// Configura los matchers para las rutas protegidas
export const config = {
    matcher: [
        '/((?!_next|themes|assets|favicon.ico).*)',
    ],
}