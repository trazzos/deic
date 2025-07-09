// app/sanctum/csrf-cookie/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  const url = `${apiBaseUrl}/sanctum/csrf-cookie`;

  // Copia headers relevantes
  const headers = new Headers();
  const userAgent = request.headers.get('user-agent');
  if (userAgent) headers.set('user-agent', userAgent);

  // Reenvía cookies si existen
  const cookie = request.headers.get('cookie');

  console.log(`Cookie found from function next: ${cookie}`);
  console.log(`Proxying from function next request to: ${url}`);
  if (cookie) headers.set('cookie', cookie);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'include',
      cache: 'no-store',
    });

    // Reenvía todos los headers de la respuesta, especialmente Set-Cookie
    const resHeaders = new Headers();
    for (const [key, value] of Array.from(response.headers.entries())) {
      if (key.toLowerCase() === 'set-cookie') {
        resHeaders.append('set-cookie', value);
      } else if (key.toLowerCase() !== 'content-encoding' && key.toLowerCase() !== 'content-length') {
        // NO reenvíes content-encoding ni content-length
        resHeaders.set(key, value);
      }
    }

    return new NextResponse(response.body, {
      status: response.status,
      headers: resHeaders,
    });
  } catch (error) {
    console.error('Error fetching CSRF cookie from function:', error);
    return new NextResponse(JSON.stringify({ message: 'Error fetching CSRF cookie from function.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}