import { Header } from '@/components/Header'
import { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'

const genRanHex = (size: number) =>
  [...Array(size)]
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join('')

export const metadata: Metadata = {
  title: 'Initminal Run',
  description:
    'Safely execute untrusted code with ESM syntax support, dynamic injection of ESM modules from URL or plain JS code, and granular access control based on whitelisting for each JS object.',
  openGraph: {
    title: 'Initminal Run',
    description:
      'Safely execute untrusted code with ESM syntax support, dynamic injection of ESM modules from URL or plain JS code, and granular access control based on whitelisting for each JS object.',
    url: 'https://initminal.com/run',
    images: `https://opengraph.githubassets.com/${genRanHex(8)}/initminal/run`,
  },
  icons: {
    icon: [
      { url: '/run/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/run/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    other: {
      rel: 'apple-touch-icon',
      url: '/run/apple-touch-icon.png',
      sizes: '180x180',
    },
  },
  manifest: '/run/site.webmanifest',
}

const Footer = (
  <footer className="bg-white rounded-lg shadow m-4 dark:bg-gray-700">
    <div className="w-full mx-auto max-w-screen-xl p-4 md:flex md:items-center md:justify-between">
      <span className="text-sm text-gray-500 sm:text-center dark:text-gray-400">
        @initminal/run
      </span>
      <ul className="flex flex-wrap items-center mt-3 text-sm font-medium text-gray-500 dark:text-gray-400 sm:mt-0">
        <li>
          <a
            href="https://github.com/initminal/run/issues"
            className="hover:underline"
          >
            Report an issue
          </a>
        </li>
      </ul>
    </div>
  </footer>
)

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', '${process.env.GA_MEASUREMENT_ID}');
        `}
      </Script>
      <body className="bg-gray-100 dark:bg-gray-800">
        <Header />
        <div className="flex items-center flex-col">
          <div className="max-w-screen-lg w-full p-6">{children}</div>
        </div>
        {Footer}
      </body>
    </html>
  )
}
