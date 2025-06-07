import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Xóa export runtime, có thể gây lỗi trong Next.js 15
// export const runtime = "nodejs";

export async function middleware(request: NextRequest) {
  console.log("Middleware running for path:", request.nextUrl.pathname);

  // Check if it's an admin path
  const isAdminPath = request.nextUrl.pathname.startsWith("/admin");
  const isLoginPath = request.nextUrl.pathname.startsWith("/login");
  const isErrorPath = request.nextUrl.pathname.startsWith("/admin/error");
  const isApiAuthPath = request.nextUrl.pathname.startsWith("/api/auth");

  // Kiểm tra nếu đã đăng nhập (có token) mà truy cập trang login
  if (isLoginPath) {
    const token = request.cookies.get("token")?.value;

    // Nếu có token (đã đăng nhập) chuyển hướng về trang admin
    if (token) {
      console.log("User already logged in, redirecting to admin");
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    return NextResponse.next();
  }

  // Allow public routes and auth API routes
  if (isErrorPath || isApiAuthPath) {
    console.log("Public path or API auth, allowing access");
    return NextResponse.next();
  }

  // If it's an admin path, check token
  if (isAdminPath) {
    console.log("Admin path, checking token");

    try {
      const token = request.cookies.get("token")?.value;

      if (!token) {
        console.log("No token found, redirecting to login");
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
      }

      // We're not verifying token here anymore, let client components handle that
      console.log("Token found, allowing access");
    } catch (error) {
      console.error("Error checking token:", error);
      // Redirect to login on error
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all request paths except for static assets and API auth
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
