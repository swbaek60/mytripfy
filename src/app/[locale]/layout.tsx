import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/globals.css";
import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import { CurrencyProvider } from '@/context/CurrencyContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "mytripfy – Find Travel Companions & Local Guides Worldwide",
    template: "%s | mytripfy",
  },
  description: "Connect with travel companions and local guides in 100+ countries. Join trips, discover local experiences, complete travel challenges and explore the world together.",
  keywords: ["travel companion", "local guide", "travel platform", "trip partner", "travel together", "mytripfy"],
  authors: [{ name: "mytripfy" }],
  creator: "mytripfy",
  metadataBase: new URL("https://mytripfy.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://mytripfy.com",
    siteName: "mytripfy",
    title: "mytripfy – Find Travel Companions & Local Guides Worldwide",
    description: "Connect with travel companions and local guides in 100+ countries. Join trips, discover local experiences, complete travel challenges.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "mytripfy – World's Best Travel Companion Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "mytripfy – Find Travel Companions & Local Guides Worldwide",
    description: "Connect with travel companions and local guides in 100+ countries.",
    images: ["/og-image.png"],
    creator: "@mytripfy",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }
 
  const messages = await getMessages();

  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      data-locale={locale}
    >
      <NextIntlClientProvider locale={locale} messages={messages}>
        <CurrencyProvider>
          {children}
        </CurrencyProvider>
      </NextIntlClientProvider>
    </div>
  );
}
