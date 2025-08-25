import '@/styles/globals.css';
import { Metadata, Viewport } from 'next';
import Script from 'next/script';
import clsx from 'clsx';

import { siteConfig } from '@/config/site';
import { fontSans } from '@/config/fonts';
import { ConditionalNavbar } from '@/components/conditional-navbar';
import { Footer } from '@/components/Footer';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import { ToastNotification } from '@/components/toast-notification';

import { Providers } from './providers';

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,

  authors: [{ name: 'PictureMe AI' }],
  creator: 'PictureMe AI',
  publisher: 'PictureMe AI',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://pictureme.ai'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://pictureme.ai',
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: 'https://deifos.github.io/images/picturemeai-banner.jpg',
        width: 1200,
        height: 630,
        alt: 'PictureMe AI - Generate professional photos from a single upload',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: ['https://deifos.github.io/images/picturemeai-banner.jpg'],
    creator: '@deifos',
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
  icons: {
    icon: '/web-app-manifest-192x192.png',
    shortcut: '/web-app-manifest-192x192.png',
    apple: '/web-app-manifest-512x512.png',
  },
  manifest: '/site.webmanifest',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang='en'>
      <head>
        <meta content='Picturemeai' name='apple-mobile-web-app-title' />
      </head>
      <body
        className={clsx(
          'min-h-screen text-foreground bg-background font-sans antialiased',
          fontSans.variable
        )}
      >
        <Providers themeProps={{ attribute: 'class', defaultTheme: 'dark' }}>
          <div className='relative flex flex-col min-h-screen bg-gradient-to-br from-default-100 to-background'>
            <ConditionalNavbar />
            <main className='flex-grow'>{children}</main>
            <Footer />
          </div>
          <ToastNotification />
        </Providers>

        <GoogleAnalytics gtag='G-742SLK7W01' />


      </body>
    </html>
  );
}
