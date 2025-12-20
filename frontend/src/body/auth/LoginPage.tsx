'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/body/redux/hooks';
import { 
  login, 
  clearError, 
  selectIsLoading, 
  selectError, 
  selectIsAuthenticated 
} from '@/body/redux/slices/auth/AuthSlice';
import { LoginRequestDto } from '@/body/redux/slices/auth/DTOs/AuthDTOs';
import GoogleLoginButton from './components/GoogleLoginButton';

/**
 * Login Component
 * 
 * Kullanıcı giriş formu bileşeni.
 * Redux ile entegre auth işlemleri.
 */

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  
  // Redux state'leri
  const isLoading = useAppSelector(selectIsLoading);
  const error = useAppSelector(selectError);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  // Form state
  const [formData, setFormData] = useState<LoginRequestDto>({
    emailOrUsername: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  /**
   * Başarılı giriş sonrası panel sayfasına yönlendirme
   */
  useEffect(() => {
    if (isAuthenticated) {
      console.log('Login: Kullanıcı authenticated, panel sayfasına yönlendiriliyor...');
      router.push('/panel');
    }
  }, [isAuthenticated, router]);

  /**
   * Component unmount olduğunda error'u temizle
   */
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  /**
   * Form submit handler
   * Kullanıcı giriş işlemini gerçekleştirir
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasyon
    if (!formData.emailOrUsername.trim() || !formData.password.trim()) {
      return;
    }

    // Login action'ı dispatch et
    await dispatch(login(formData));
  };

  /**
   * Input change handler
   * Form alanlarındaki değişiklikleri yönetir
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Yazarken error'u temizle
    if (error) {
      dispatch(clearError());
    }
  };

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800">Giriş Yap</h2>
        <p className="text-gray-600 mt-2">
          Hesabınıza giriş yaparak devam edin
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button 
            onClick={() => dispatch(clearError())}
            className="text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Input */}
        <div>
          <label
            htmlFor="emailOrUsername"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            E-posta Adresi
          </label>
          <input
            type="email"
            id="emailOrUsername"
            name="emailOrUsername"
            value={formData.emailOrUsername}
            onChange={handleChange}
            required
            disabled={isLoading}
            placeholder="ornek@email.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* Password Input */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Şifre
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={isLoading}
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input
              type="checkbox"
              disabled={isLoading}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-600">Beni Hatırla</span>
          </label>
          <Link
            href="/forget-password"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Şifremi Unuttum
          </Link>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:bg-blue-400 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Giriş Yapılıyor...
            </>
          ) : (
            'Giriş Yap'
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">veya</span>
        </div>
      </div>

      {/* Google Login Button */}
      <div className="space-y-3">
        <GoogleLoginButton 
          text="signin_with"
          onSuccess={() => {
            console.log('Google ile giriş başarılı, yönlendirme yapılacak...');
          }}
          onError={(error) => {
            console.error('Google ile giriş hatası:', error);
          }}
        />
      </div>

      {/* Register Link */}
      <div className="text-center">
        <p className="text-gray-600">
          Hesabınız yok mu?{' '}
          <Link
            href="/register"
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            Kayıt Ol
          </Link>
        </p>
      </div>
    </div>
  );
}
