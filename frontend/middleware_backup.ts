import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware
 * 
 * Server-side kimlik doğrulama ve yetkilendirme kontrolü.
 * Token kontrolü yapar ve yetkisiz erişimleri yönlendirir.
 */

// Korunan sayfalar (Giriş zorunlu)
const PROTECTED_ROUTES = ['/profile', '/panel', '/admin'];

// Sadece giriş yapmamış kullanıcıların erişebileceği sayfalar
const AUTH_ROUTES = ['/login', '/register', '/forget-password', '/reset-password'];

// Sadece adminlerin erişebileceği sayfalar
const ADMIN_ROUTES = ['/admin'];

/**
 * JWT Decode helper (Edge-compatible)
 */
function parseJwt(token: string) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get('token')?.value;

    // 1. Giriş kontrolü gerektiren yollar
    const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));

    // 2. Sadece giriş yapmamışların erişebileceği yollar
    const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route));

    // 3. Admin kontrolü gerektiren yollar
    const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route));

    // SENARYO A: Kullanıcı giriş yapmamış ve korunan bir sayfaya gitmeye çalışıyor
    if (!token && isProtectedRoute) {
        const url = new URL('/login', request.url);
        url.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(url);
    }

    // SENARYO B: Kullanıcı giriş yapmış ve login/register sayfasına gitmeye çalışıyor
    if (token && isAuthRoute) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // SENARYO C: Admin kontrolü
    if (isAdminRoute) {
        if (!token) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        const payload = parseJwt(token);
        const isAdmin = payload?.isAdmin === true || payload?.role === 'Admin';

        if (!isAdmin) {
            // Admin değilse ana sayfaya yönlendir (veya 403 sayfasına)
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    return NextResponse.next();
}

/**
 * Middleware'in çalışacağı yollar
 * Performans için statik dosyaları ve API rotalarını hariç tutuyoruz.
 */
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public (public files like images)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)',
    ],
};
