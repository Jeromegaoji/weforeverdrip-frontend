/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'weforeverdrip.fly.dev',
      },
    ],
  },
}

export default nextConfig