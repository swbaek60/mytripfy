import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "@/globals.css";
import {NextIntlClientProvider} from 'next-intl';
import {getMessages, getTranslations, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {isAppLocale, routing} from '@/i18n/routing';
import {getFallbackMessages, type Messages} from '@/i18n/request';
import { CurrencyProvider } from '@/context/CurrencyContext';
import SiteJsonLd from '@/components/seo/SiteJsonLd';
import { rootMetadataBase } from '@/lib/seo/build-metadata';
import { ogLocaleFor, ogImageAbsoluteUrl } from '@/lib/seo/site';
import NavigationProgress from '@/components/NavigationProgress';
import SiteFooter from '@/components/layout/SiteFooter'
import PushRegister from '@/components/PushRegister'
import LocaleDocumentAttrs from '@/components/LocaleDocumentAttrs'
import { isRtlLocale } from '@/lib/seo/site'

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

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

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
    // canonical 과 hreflang 은 레이아웃에 두지 않는다. 레이아웃 metadata 는 자기 metadata 가
    // 없는 하위 페이지에 그대로 상속되는데, 그러면 /dashboard 같은 페이지가 자신을 로케일
    // 홈의 사본이라고 선언한다. 페이지마다 buildPageMetadata 로 자기 경로를 넣는다.
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

  if (!isAppLocale(locale)) {
    notFound();
  }

  // setRequestLocale 없이 getMessages() 를 호출하면 next-intl 이 헤더를 읽으면서
  // 하위 페이지 전체가 동적 렌더링으로 강제된다. 블로그·목적지 같은 정적 페이지가
  // 매 요청마다 서버에서 다시 그려지던 원인이었다.
  setRequestLocale(locale);

  let messages: Messages;
  try {
    const m = await getMessages();
    messages = (m ?? {}) as Messages;
  } catch (e) {
    console.error('[locale] layout getMessages error:', e);
    try {
      messages = await getFallbackMessages();
    } catch {
      messages = {};
    }
  }

  return (
    // lang·dir 은 <html> 에 있어야 맞지만 그 태그를 여기서 그릴 수 없다. 상속되는
    // 속성이라 이 래퍼에 걸어 두면 본문 전체는 정상 동작하고, LocaleDocumentAttrs 가
    // 문서 최상단 속성까지 맞춰 준다.
    <div
      lang={locale}
      dir={isRtlLocale(locale) ? 'rtl' : 'ltr'}
      className={`${headingFont.variable} ${bodyFont.variable} antialiased`}
      data-locale={locale}
    >
      <LocaleDocumentAttrs locale={locale} />
      <NavigationProgress />
      <SiteJsonLd locale={locale} />
      <NextIntlClientProvider locale={locale} messages={messages}>
        <CurrencyProvider>
          <PushRegister />
          <div className="min-h-screen flex flex-col">
            {children}
            <SiteFooter locale={locale} />
          </div>
        </CurrencyProvider>
      </NextIntlClientProvider>
    </div>
  );
}
