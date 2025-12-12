'use client';

import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAppDispatch, useAppSelector } from '@/body/redux/hooks';
import { googleLogin, selectIsLoading } from '@/body/redux/slices/auth/AuthSlice';

/**
 * Google Login Button Component
 * 
 * Google OAuth ile giriş butonu.
 * @react-oauth/google kütüphanesi kullanılarak oluşturuldu.
 */

interface GoogleLoginButtonProps {
  /** Buton metni (Giriş Yap / Kayıt Ol) */
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  /** Callback fonksiyonu - başarılı giriş sonrası */
  onSuccess?: () => void;
  /** Callback fonksiyonu - hata durumunda */
  onError?: (error: string) => void;
}

export default function GoogleLoginButton({ 
  text = 'signin_with',
  onSuccess,
  onError 
}: GoogleLoginButtonProps) {
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(selectIsLoading);

  /**
   * Google giriş başarılı olduğunda çağrılır
   * Credential response içinden ID Token alınır ve backend'e gönderilir
   */
  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    console.log('Google Login başarılı, credential alındı');
    
    if (!credentialResponse.credential) {
      console.error('Google credential bulunamadı');
      onError?.('Google kimlik bilgisi alınamadı');
      return;
    }

    try {
      // Google ID Token'ı backend'e gönder
      const result = await dispatch(googleLogin({ 
        idToken: credentialResponse.credential 
      }));

      if (googleLogin.fulfilled.match(result)) {
        console.log('Google ile giriş başarılı');
        onSuccess?.();
      } else {
        console.log('Google ile giriş başarısız:', result.payload);
        onError?.(result.payload as string || 'Google ile giriş başarısız oldu');
      }
    } catch (error) {
      console.error('Google login dispatch hatası:', error);
      onError?.('Google ile giriş sırasında bir hata oluştu');
    }
  };

  /**
   * Google giriş hata durumunda çağrılır
   */
  const handleGoogleError = () => {
    console.error('Google Login hatası');
    onError?.('Google ile giriş başarısız oldu');
  };

  return (
    <div 
      className={`w-full flex justify-center ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
    >
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        text={text}
        theme="outline"
        size="large"
        width="100%"
        useOneTap={false}
        auto_select={false}
        locale="tr"
      />
    </div>
  );
}
