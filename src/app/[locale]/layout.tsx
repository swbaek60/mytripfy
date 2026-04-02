import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "@/globals.css";
import {NextIntlClientProvider} from 'next-intl';
import {getMessages, getTranslations} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import {getFallbackMessages} from '@/i18n/request';
import { CurrencyProvider } from '@/context/CurrencyContext';
import SiteJsonLd from '@/components/seo/SiteJsonLd';
import { rootMetadataBase } from '@/lib/seo/build-metadata';
import { ogLocaleFor, ogImageAbsoluteUrl } from '@/lib/seo/site';

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Seo" });
  const tPages = await getTranslations({ locale, namespace: "SeoPages" });
  const google = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
  const og = ogImageAbsoluteUrl();

  return {
    ...rootMetadataBase(),
    title: {
      default: t("defaultTitle"),
      template: "%s | mytripfy",
    },
    description: t("defaultDescription"),
    keywords: t("keywords")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean),
    authors: [{ name: "mytripfy" }],
    creator: "mytripfy",
    applicationName: "mytripfy",
    referrer: "origin-when-cross-origin",
    formatDetection: { email: false, address: false, telephone: false },
    openGraph: {
      type: "website",
      locale: ogLocaleFor(locale),
      siteName: "mytripfy",
      title: tPages("homeOgTitle"),
      description: tPages("homeOgDesc"),
      images: [
        {
          url: og,
          width: 1200,
          height: 630,
          alt: "mytripfy – travel companions & local guides",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("defaultTitle"),
      description: t("defaultDescription"),
      images: [og],
      creator: "@mytripfy",
      site: "@mytripfy",
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
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "mytripfy",
    },
    ...(google ? { verification: { google } } : {}),
  };
}

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
      <SiteJsonLd locale={locale} />
      <NextIntlClientProvider locale={locale} messages={messages}>
        <CurrencyProvider>
          {children}
        </CurrencyProvider>
      </NextIntlClientProvider>
    </div>
  );
}
