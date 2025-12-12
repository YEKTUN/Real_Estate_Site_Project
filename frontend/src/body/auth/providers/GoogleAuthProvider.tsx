'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';
import { ReactNode } from 'react';

/**
 * Google Auth Provider Component
 * 
 * Google OAuth yapılandırması için wrapper bileşen.
 * Tüm uygulama bu provider ile sarılmalıdır.
 * 
 * NOT: NEXT_PUBLIC_GOOGLE_CLIENT_ID environment variable'ı gereklidir.
 * .env.local dosyasına eklenmelidir:
 * NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
 */

interface GoogleAuthProviderWrapperProps {
  children: ReactNode;
}

export default function GoogleAuthProviderWrapper({ children }: GoogleAuthProviderWrapperProps) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // Client ID yoksa uyarı göster (development için)
  if (!googleClientId) {
    console.warn(
      '⚠️ NEXT_PUBLIC_GOOGLE_CLIENT_ID environment variable bulunamadı.\n' +
      'Google OAuth çalışması için .env.local dosyasına ekleyin:\n' +
      'NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com'
    );
    
    // Client ID olmadan da children'ı render et (Google butonu çalışmaz ama uygulama crash olmaz)
    return <>{children}</>;
  }

  console.log('Google OAuth Provider başlatıldı');

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      {children}
    </GoogleOAuthProvider>
  );
}
