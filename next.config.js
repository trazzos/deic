/** @type {import('next').NextConfig} */

const nextConfig = {
    //trailingSlash : true,
    reactStrictMode: true,
    experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  /*async rewrites() {
        return [
            {
                source: '/sanctum/csrf-cookie',
                destination: 'https://deicapi.codisoft.com.mx/sanctum/csrf-cookie',
            },
            {
                source: '/api/:path*',
                destination: 'https://deicapi.codisoft.com.mx/api/:path*',
            }
        ]
    },*/
};



module.exports = nextConfig
