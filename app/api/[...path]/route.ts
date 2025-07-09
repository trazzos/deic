// app/api/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return proxy(request);
}
export async function POST(request: NextRequest) {
  return proxy(request);
}
export async function PUT(request: NextRequest) {
  return proxy(request);
}
export async function DELETE(request: NextRequest) {
  return proxy(request);
}
export async function PATCH(request: NextRequest) {
  return proxy(request);
}

async function proxy(request: NextRequest) {
  const { pathname, search } = new URL(request.url);
  const apiPath = pathname.replace(/^\/api\//, '');
  const apiBase = process.env.NEXT_PUBLIC_API_URL;
  const url = `${apiBase}/api/${apiPath}${search}`;

  console.log(`Proxying request to: ${url}`);

  // Copia headers y cookies
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('connection');

  // Reenvía cookies
  const cookie = request.headers.get('cookie');
  if (cookie) headers.set('cookie', cookie);

  // Body para métodos que lo requieran
  let body;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    body = await request.text();
  }

  const response = await fetch(url, {
    method: request.method,
    headers,
    body,
    credentials: 'include',
    cache: 'no-store',
  });

  // Reenvía headers y cookies de la respuesta
  const resHeaders = new Headers();
  for (const [key, value] of Array.from(response.headers.entries())) {
    if (key.toLowerCase() === 'set-cookie') {
      resHeaders.append('set-cookie', value);
    } else if (key.toLowerCase() !== 'content-encoding') {
        // NO reenvíes content-encoding
        resHeaders.set(key, value);
      }
  }

  return new NextResponse(response.body, {
    status: response.status,
    headers: resHeaders,
  });
}