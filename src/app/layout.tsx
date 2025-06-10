import type { Metadata, Viewport } from "next";
import { Livvic } from "next/font/google";
import "@/app/globals.css";
import { Providers } from "@/components/Providers";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import ContentProtectionScript from "@/components/ContentProtectionScript";
import ContentProtection from "@/components/ContentProtection";

const livvic = Livvic({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-livvic",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://doctruyenfull.io.vn"),
  title: {
    template: "%s | Doctruyenfull.vn",
    default: "Doctruyenfull.vn - Đọc truyện chữ online",
  },
  description:
    "Đọc truyện online, truyện hay cập nhật liên tục. Doctruyenfull.vn là trang web đọc truyện chữ tiếng Việt hiện đại, nhanh chóng và tối ưu, mang đến trải nghiệm đọc truyện tốt nhất.",
  applicationName: "Doctruyenfull.vn",
  authors: [{ name: "Doctruyenfull.vn Team" }],
  generator: "Next.js",
  keywords: [
    "truyện chữ",
    "đọc truyện online",
    "truyện tiếng Việt",
    "tiểu thuyết",
    "truyện hay",
    "truyện full",
    "truyện mới",
    "Doctruyenfull.vn",
    "Đọc truyện",
    "Đọc truyện online",
    "Đọc truyện hay",
    "Đọc truyện mới",
    "Đọc truyện tiếng Việt",
    "Đọc truyện chữ",
    "ebook",
    "ebook online",
    "ebook hay",
    "ebook mới",
    "ebook tiếng Việt",
    "ebook chữ",
    "ebook truyện",
  ],
  referrer: "origin-when-cross-origin",
  creator: "Doctruyenfull.vn",
  publisher: "Doctruyenfull.vn",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Doctruyenfull.vn - Đọc truyện chữ online",
    description:
      "Đọc truyện online, truyện hay cập nhật liên tục. Mang đến trải nghiệm đọc truyện tốt nhất.",
    url: "https://doctruyenfull.io.vn",
    siteName: "Doctruyenfull.vn",
    locale: "vi_VN",
    type: "website",
    images: [
      {
        url: "https://doctruyenfull.io.vn/og-image.png",
        width: 1200,
        height: 630,
        alt: "Doctruyenfull.vn - Đọc truyện chữ online",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Doctruyenfull.vn - Đọc truyện chữ online",
    description:
      "Đọc truyện online, truyện hay cập nhật liên tục. Mang đến trải nghiệm đọc truyện tốt nhất.",
    images: ["https://doctruyenfull.io.vn/twitter-image.png"],
    creator: "@truyencv",
  },
  icons: {
    icon: [
      { url: "/icon/favicon.ico", sizes: "64x64" },
      { url: "/icon/favicon-16x16.png", sizes: "16x16" },
      { url: "/icon/favicon-32x32.png", sizes: "32x32" },
    ],
    apple: { url: "/icon/apple-touch-icon.png", sizes: "180x180" },
    other: [
      {
        url: "/icon/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icon/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  },
  category: "entertainment",
  manifest: "/manifest.json",
};

export default async function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning className={livvic.variable}>
      <body
        className="antialiased min-h-screen bg-base-200"
        suppressHydrationWarning
      >
        <Providers>
          <div className="bg-gradient-to-b from-base-300/50 to-transparent min-h-screen">
            <main>
              {children}
              <SpeedInsights />
              <Analytics />
              <ContentProtection />
              <ContentProtectionScript />
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
