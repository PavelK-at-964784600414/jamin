/** @type {import('next').NextConfig} */
 
const nextConfig = {
  // Remove experimental PPR feature since it requires a canary version
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/a/**',
      },
    ],
  },
};
 
export default nextConfig;