import "@/app/globals.css";
import ScrollToTop from "@/components/ScrollToTop";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HorizontalAdBanner from "@/components/HorizontalAdBanner";

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
    <div>
      <HorizontalAdBanner adType="priority" position="navbar" />
      <Navbar />
      <main>
        <div className="flex flex-col min-h-screen flex-grow container mx-auto px-4 py-8">
          <ScrollToTop />
          {children}
        </div>
      </main>
      <HorizontalAdBanner adType="banner" position="footer" />
      <Footer />
    </div>
  );
}
