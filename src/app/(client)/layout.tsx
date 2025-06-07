import "@/app/globals.css";
import ScrollToTop from "@/components/ScrollToTop";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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
      <Navbar />
      <main>
        <div className="flex flex-col min-h-screen font-sans flex-grow container mx-auto px-4 py-8">
          <ScrollToTop />
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
