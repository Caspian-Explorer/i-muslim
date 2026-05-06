import type { Metadata } from "next";
import { Inter, Amiri, IBM_Plex_Sans_Arabic } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ThemeProvider } from "@/components/ThemeProvider";
import { dirFor, type Locale } from "@/i18n/config";
import { getSiteConfig } from "@/lib/admin/data/site-config";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const amiri = Amiri({
  variable: "--font-amiri",
  subsets: ["arabic"],
  weight: ["400", "700"],
  display: "swap",
});

const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-plex-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const FALLBACK_TAGLINE =
  "A clean, fast reader for the Quran and major Hadith collections with Arabic, English, Russian, and Azerbaijani translations.";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig();
  const titleSuffix = config.siteName;
  const description = config.tagline || FALLBACK_TAGLINE;
  const meta: Metadata = {
    title: {
      default: `${config.siteName} — Read Quran and Sunnah`,
      template: `%s · ${titleSuffix}`,
    },
    description,
  };
  if (config.faviconUrl) {
    meta.icons = { icon: config.faviconUrl };
  }
  if (config.ogImageUrl) {
    meta.openGraph = {
      images: [{ url: config.ogImageUrl, width: 1200, height: 630 }],
    };
  }
  return meta;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = (await getLocale()) as Locale;
  const messages = await getMessages();
  const dir = dirFor(locale);

  return (
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      className={`${inter.variable} ${amiri.variable} ${plexArabic.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>{children}</ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
