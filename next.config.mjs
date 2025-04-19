/** @type {import('next').NextConfig} */
 
const nextConfig = {
  experimental: {
    ppr: 'incremental',
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
};
 
export default nextConfig;