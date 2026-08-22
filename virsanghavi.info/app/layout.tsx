import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GameOverlay } from "@/components/game-overlay";
import { JsonLd } from "@/components/json-ld";
import { themeScript } from "@/lib/theme-script";
import { site, SITE_URL } from "@/lib/site";
import { graph, organizationNode, personNode, websiteNode } from "@/lib/structured-data";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: site.name,
    template: `%s | ${site.name}`,
  },
  description: site.tagline,
  applicationName: site.name,
  authors: [{ name: site.name, url: SITE_URL }],
  creator: site.name,
  publisher: site.name,
  keywords: [
    "Vir Sanghavi",
    "virsanghavi",
    "Ravioli",
    "prediction market",
    "free-to-play prediction market",
    "multi-agent AI",
    "Axis",
    "Houston",
  ],
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": [{ url: "/feed.xml", title: site.name }],
      "text/markdown": [{ url: "/index.md", title: `${site.name} (Markdown)` }],
    },
  },
  openGraph: {
    type: "website",
    siteName: site.name,
    title: site.name,
    description: site.tagline,
    url: SITE_URL,
    locale: "en_US",
    images: [{ url: site.avatar, width: 400, height: 400, alt: site.name }],
  },
  twitter: {
    card: "summary",
    title: site.name,
    description: site.tagline,
    creator: "@virsanghavi13",
    images: [site.avatar],
  },
  icons: { icon: "/favicon.ico?v=2" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang={site.language} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap"
          rel="stylesheet"
        />
        {/* llms.txt link relations: point agents at the guide that covers this page. */}
        <link rel="describedby" type="text/plain" href="/llms.txt" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <JsonLd data={graph([personNode(), organizationNode(), websiteNode()])} />
        <div className="page">
          <SiteHeader />
          {children}
          <SiteFooter />
        </div>
        <GameOverlay />
      </body>
    </html>
  );
}
