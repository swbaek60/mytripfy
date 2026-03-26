import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "@/globals.css";
import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import {getFallbackMessages} from '@/i18n/request';
import { CurrencyProvider } from '@/context/CurrencyContext';

const headingFont = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const bodyFont = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
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
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "mytripfy",
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

  let messages: Record<string, Record<string, string>>;
  try {
    const m = await getMessages();
    messages = (m ?? {}) as Record<string, Record<string, string>>;
  } catch (e) {
    console.error('[locale] layout getMessages error:', e);
    try {
      messages = await getFallbackMessages();
    } catch {
      messages = {};
    }
  }

  return (
    <div
      className={`${headingFont.variable} ${bodyFont.variable} antialiased`}
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
