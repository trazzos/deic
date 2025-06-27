/** @type {import('next').NextConfig} */

const nextConfig = {
    reactStrictMode: false,
    async rewrites() {
        return [
            {
                source: '/sanctum/csrf-cookie', // Rutas que tu frontend local usará
                destination: 'https://deicapi.codisoft.com.mx/sanctum/csrf-cookie', // La URL real de tu API externa
            },
            {
                source: '/api/:path*', // Rutas que tu frontend local usará
                destination: 'https://deicapi.codisoft.com.mx/api/:path*', // La URL real de tu API externa
            }
        ]
    }
};

module.exports = nextConfig
