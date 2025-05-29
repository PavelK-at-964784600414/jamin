import '@/app/ui/global.css'
import { inter } from '@/app/ui/fonts';
import { Metadata } from 'next';
import { Providers } from './providers';

// Define security headers with CSP
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    template: '%s | Jamin Music Collaboration',
    default: 'Jamin Music Collaboration',
  },
  description: 'A platform for music collaboration and theme sharing.',
  // Add security headers
  other: {
    // Content Security Policy
    'Content-Security-Policy': `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval';
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data:;
      font-src 'self';
      connect-src 'self' ${process.env.NEXT_PUBLIC_S3_URL || '*'};
      media-src 'self' ${process.env.NEXT_PUBLIC_S3_URL || '*'};
      frame-src 'self';
    `.replace(/\s+/g, ' ').trim(),
    // Additional security headers
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=*, microphone=*, geolocation=()'
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
