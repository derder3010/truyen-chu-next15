import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Xóa export runtime, có thể gây lỗi trong Next.js 15
// export const runtime = "nodejs";

export async function middleware(request: NextRequest) {
  console.log("Middleware running for path:", request.nextUrl.pathname);

  // Initialize response
  let response: NextResponse;

  // Check if it's an admin path
  const isAdminPath = request.nextUrl.pathname.startsWith("/admin");
  const isLoginPath = request.nextUrl.pathname.startsWith("/login");
  const isErrorPath = request.nextUrl.pathname.startsWith("/admin/error");
  const isApiAdminPath = request.nextUrl.pathname.startsWith("/api/admin");
  const isApiAuthPath = request.nextUrl.pathname.startsWith("/api/auth");
  const isStaticAsset = request.nextUrl.pathname.match(
    /\.(js|css|png|jpg|jpeg|gif|ico|svg)$/
  );

  // Kiểm tra nếu đã đăng nhập (có token) mà truy cập trang login
  if (isLoginPath) {
    const token = request.cookies.get("token")?.value;

    // Nếu có token (đã đăng nhập) chuyển hướng về trang admin
    if (token) {
      console.log("User already logged in, redirecting to admin");
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    response = NextResponse.next();
  }
  // Allow public routes and auth API routes
  else if (isErrorPath || isApiAuthPath) {
    console.log("Public path or API auth, allowing access");
    response = NextResponse.next();
  }
  // If it's an admin path or admin API, check token
  else if (isAdminPath || isApiAdminPath) {
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
      response = NextResponse.next();
    } catch (error) {
      console.error("Error checking token:", error);
      // Redirect to login on error
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  } else {
    // For all other paths (content pages)
    response = NextResponse.next();

    // Chỉ thêm các header bảo mật cơ bản cho các trang nội dung, không phải tài nguyên tĩnh
    if (!isStaticAsset) {
      // Thêm các header bảo mật cơ bản
      addBasicSecurityHeaders(response);
    }
  }

  return response;
}

// Helper function to add basic security headers
function addBasicSecurityHeaders(response: NextResponse) {
  // Basic security headers that won't interfere with normal operation
  const securityHeaders = {
    // Prevent browsers from MIME-sniffing a response away from the declared content type
    "X-Content-Type-Options": "nosniff",

    // Prevent embedding in iframes on other domains
    "X-Frame-Options": "SAMEORIGIN",

    // Control browser features
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",

    // Set referrer policy for links
    "Referrer-Policy": "strict-origin-when-cross-origin",
  };

  // Adding headers to response
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
}

export const config = {
  matcher: [
    // Include original matchers for admin routes
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/auth/:path*",
    "/login",
    // Add protection for content pages, but with reduced strictness
    "/",
  ],
};
