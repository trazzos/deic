// app/api/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Función auxiliar para manejar la lógica del proxy para todos los métodos HTTP
// Es mejor tipar el retorno como Promise<NextResponse>
async function proxyApiRequest(request: NextRequest): Promise<NextResponse> {
  const { pathname } = new URL(request.url);
  // Elimina '/api/' del inicio para obtener la ruta relativa a la API externa
  const apiPath = pathname.substring('/api/'.length);
  const externalApiBaseUrl = process.env.NEXT_PUBLIC_API_URL; // Tu URL base de la API externa
  const externalApiUrl = `${externalApiBaseUrl}/${apiPath}`;

  try {
    const headers = new Headers();
    // Reenvía todos los headers del cliente, excepto los de control del proxy
    for (const [key, value] of Array.from(request.headers.entries())) {
      const lowerKey = key.toLowerCase();
      if (lowerKey !== 'host' && lowerKey !== 'connection') {
        headers.set(key, value);
      }
    }

    // MUY IMPORTANTE para Sanctum: Reenviar la cookie del cliente a la API externa
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      headers.set('Cookie', cookieHeader);
    }

    // Si la solicitud original tiene un body (POST, PUT, PATCH)
    let requestBody: string | undefined = undefined;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      try {
        requestBody = await request.text(); // Lee el body como texto
      } catch (e) {
        console.warn('Could not read request body:', e);
      }
    }

    const response = await fetch(externalApiUrl, {
      method: request.method,
      headers: headers,
      body: requestBody,
      cache: 'no-store' // No cachear esta solicitud
    });

    // Crear un nuevo objeto Headers para la respuesta que enviaremos al cliente
    const newHeaders = new Headers();
    // Reenvía todos los headers de la respuesta de la API externa
    for (const [key, value] of Array.from(response.headers.entries())) {
      const lowerKey = key.toLowerCase();
      if (lowerKey === 'set-cookie') {
        // CRUCIAL: Reescribir el dominio de la cookie para tu dominio de Netlify
        const host = request.headers.get('host');
        if (host) {
          const modifiedCookie = value.replace(/Domain=[^;]+/gi, `Domain=${host}`);
          newHeaders.append(key, modifiedCookie); // Usa append para múltiples Set-Cookie
        }
      } else {
        newHeaders.set(key, value);
      }
    }
    
    // Devolver una nueva NextResponse al cliente, pasando el cuerpo directamente
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });

  } catch (error) {
    console.error(`Error en proxy a ${externalApiUrl}:`, error);
    // Manejo de errores con NextResponse y cuerpo JSON tipado
    return new NextResponse(JSON.stringify({ message: 'Error interno en el proxy de la API.', error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Exporta las funciones para cada método HTTP
export async function GET(request: NextRequest) {
  return proxyApiRequest(request);
}

export async function POST(request: NextRequest) {
  return proxyApiRequest(request);
}

export async function PUT(request: NextRequest) {
  return proxyApiRequest(request);
}

export async function DELETE(request: NextRequest) {
  return proxyApiRequest(request);
}

// Puedes añadir PATCH si tu API lo usa
export async function PATCH(request: NextRequest) {
  return proxyApiRequest(request);
}