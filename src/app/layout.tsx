import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import { Providers } from "@/components/Providers";
import { SessionProvider } from "@/components/SessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TruyệnCV - Đọc truyện chữ online",
  description:
    "Đọc truyện online, truyện hay cập nhật liên tục. TruyệnCV là trang web đọc truyện chữ tiếng Việt hiện đại, nhanh chóng và tối ưu, mang đến trải nghiệm đọc truyện tốt nhất.",
};

export default async function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Có thể thực hiện các tác vụ async ở đây như:
  // - Kiểm tra trạng thái xác thực người dùng
  // - Lấy dữ liệu chung cho toàn bộ ứng dụng
  // - Chuẩn bị các cài đặt toàn cục

  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-base-200`}
      >
        <SessionProvider>
          <Providers>
            <div className="bg-gradient-to-b from-base-300/50 to-transparent min-h-screen">
              <main>{children}</main>
            </div>
          </Providers>
        </SessionProvider>
      </body>
    </html>
  );
}
