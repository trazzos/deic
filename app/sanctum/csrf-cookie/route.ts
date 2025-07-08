// app/sanctum/csrf-cookie/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
   console.log('Entrando a la función /sanctum/csrf-cookie');
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
   try {

    console.log('API Base URL:', apiBaseUrl + '/sanctum/csrf-cookie'); // Para depuración, puedes ver la URL base en la consola
    const response = await fetch(apiBaseUrl + '/sanctum/csrf-cookie', {
      method: 'GET', // Sanctum CSRF cookie es usualmente GET
      headers: {
        'User-Agent': request.headers.get('user-agent') || '',
        // Otros headers si son necesarios para la solicitud externa
      },
      cache: 'no-store' // Para asegurar que siempre se obtenga el último cookie
    });

    // Leer el encabezado Set-Cookie de la respuesta de la API externa
    const setCookieHeader = response.headers.get('set-cookie');
    const newHeaders = new Headers();

    // Reenviar todos los headers de la respuesta original de la API externa
    for (const [key, value] of Array.from(response.headers.entries())) {
      newHeaders.set(key, value);
    }

    // MUY IMPORTANTE: Modificar el dominio de la cookie si existe
    if (setCookieHeader) {
      // request.headers.get('host') te da el host de tu Netlify app (ej. deic.netlify.app)
      const host = request.headers.get('host');
      console.log('Host:', host); // Para depuración, puedes ver el host en la consola
      if (host) { // Asegúrate de que el host no sea null
        const modifiedSetCookie = setCookieHeader.replace(/Domain=[^;]+/gi, `Domain=${host}`);
        newHeaders.set('Set-Cookie', modifiedSetCookie);
      }
    }

    // Crear y devolver una nueva NextResponse para el cliente
    // El cuerpo de la respuesta es un ReadableStream, por eso se pasa directamente
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });

  } catch (error) {
    console.error('Error en /sanctum/csrf-cookie proxy:', error);
    // Para errores, devolvemos un NextResponse con un cuerpo JSON
    return new NextResponse(JSON.stringify({ message: 'Error fetching CSRF cookie.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}