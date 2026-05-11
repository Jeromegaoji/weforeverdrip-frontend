/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'web-production-5fcc4.up.railway.app',
      },
    ],
  },
}

export default nextConfig  // This is the default export for the Next.js configuration, which includes settings for handling remote images from a specific hostname.