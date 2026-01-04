import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Server-side Auth Utils
 * 
 * Bu yardımcı fonksiyonlar Server Component'larda (page.tsx, layout.tsx)
 * çalışarak yüksek güvenlikli yönlendirme sağlar.
 */

interface UserPayload {
    isAdmin?: boolean;
    role?: string;
    [key: string]: any;
}

/**
 * JWT Decode helper (Server-side)
 */
function parseJwt(token: string): UserPayload | null {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = Buffer.from(base64, 'base64').toString();
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

/**
 * Kullanıcının admin olup olmadığını sunucu tarafında kontrol eder.
 * Yetkisizse anında yönlendirir.
 */
export async function validateAdminServer() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
        redirect('/login');
    }

    const payload = parseJwt(token);
    const roleClaim = payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

    const isAdmin =
        payload?.isAdmin === true ||
        payload?.role === 'Admin' ||
        roleClaim === 'Admin';

    if (!isAdmin) {
        redirect('/');
    }

    return payload;
}

/**
 * Kullanıcının giriş yapıp yapmadığını sunucu tarafında kontrol eder.
 * Giriş yapmamışsa anında login sayfasına yönlendirir.
 */
export async function validateAuthServer() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
        redirect('/login');
    }

    const payload = parseJwt(token);
    if (!payload) {
        redirect('/login');
    }

    return payload;
}
