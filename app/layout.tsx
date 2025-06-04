import '@/app/ui/global.css'
import { inter, lusitana } from '@/app/ui/fonts';
import { Metadata } from 'next';
import { Providers } from './providers';
import { WebVitalsReporter } from './components/WebVitalsReporter';
import { PerformanceMonitor } from './components/PerformanceMonitor';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ResourcePreloader } from './components/ResourcePreloader';
import ServiceWorkerRegistration from './components/ServiceWorkerRegistration';
import ProductionMonitor from './components/ProductionMonitor';
import { getNonce } from '@/app/lib/csp-nonce';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    template: '%s | Jamin Music Collaboration',
    default: 'Jamin Music Collaboration',
  },
  description: 'A platform for music collaboration and theme sharing. Create, share, and collaborate on musical themes with musicians worldwide.',
  keywords: ['music collaboration', 'music sharing', 'themes', 'musicians', 'audio collaboration', 'music platform'],
  authors: [{ name: 'Jamin Team' }],
  creator: 'Jamin Team',
  publisher: 'Jamin Music',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    title: 'Jamin Music Collaboration',
    description: 'A platform for music collaboration and theme sharing. Create, share, and collaborate on musical themes with musicians worldwide.',
    siteName: 'Jamin Music',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jamin Music Collaboration',
    description: 'A platform for music collaboration and theme sharing. Create, share, and collaborate on musical themes with musicians worldwide.',
    creator: '@jaminmusic',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = await getNonce();
  
  return (
    <html lang="en" className={`${inter.variable} ${lusitana.variable}`}>
      <body className={`${inter.className} antialiased`}>
        <ResourcePreloader />
        <Providers>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <WebVitalsReporter />
          <PerformanceMonitor />
          <ServiceWorkerRegistration />
          {process.env.NODE_ENV === 'production' && <ProductionMonitor />}
        </Providers>
        {/* Add nonce to the document for client-side access */}
        {nonce && (
          <script 
            nonce={nonce} 
            dangerouslySetInnerHTML={{
              __html: `if (!window.__CSP_NONCE__) { window.__CSP_NONCE__ = "${nonce}"; }`
            }} 
            suppressHydrationWarning={true}
          />
        )}
      </body>
    </html>
  );
}
