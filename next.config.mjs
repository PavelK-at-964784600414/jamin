/** @type {import('next').NextConfig} */
import path from 'path';
import CopyPlugin from 'copy-webpack-plugin';
import ffmpegBinaryPathFromStatic from 'ffmpeg-static'; // Renamed for clarity

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
  webpack: (config, { isServer, dev }) => { // Added dev context
    if (isServer) {
      const newExternal = { 'ffmpeg-static': 'commonjs ffmpeg-static' };

      if (Array.isArray(config.externals)) {
        config.externals.push(newExternal);
      } else {
        // Handles undefined, null, or object cases for config.externals
        config.externals = { ...(config.externals || {}), ...newExternal };
      }

      // Copy the ffmpeg binary to a known location only for production builds (e.g., for Vercel)
      if (!dev) { // !dev is true for production builds
        console.log('[next.config.mjs] Production build: Setting up CopyPlugin for ffmpeg.');
        config.plugins.push(
          new CopyPlugin({
            patterns: [
              {
                from: ffmpegBinaryPathFromStatic, // The actual path to the binary from ffmpeg-static
                to: path.join(process.cwd(), '.next/server/static/ffmpeg/'), // Destination directory
                // The binary will be copied with its original name (e.g., ffmpeg or ffmpeg.exe)
                // into .next/server/static/ffmpeg/
              },
            ],
          })
        );
      } else {
        console.log('[next.config.mjs] Development build: Skipping CopyPlugin for ffmpeg.');
      }
    }
    return config;
  },
};

export default nextConfig;