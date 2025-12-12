'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/body/redux/hooks';
import { 
  register, 
  clearError, 
  selectIsLoading, 
  selectError, 
  selectIsAuthenticated 
} from '@/body/redux/slices/auth/AuthSlice';
import { RegisterRequestDto } from '@/body/redux/slices/auth/DTOs/AuthDTOs';
import GoogleLoginButton from './components/GoogleLoginButton';

/**
 * Register Component
 * 
 * Kullanıcı kayıt formu bileşeni.
 * Redux ile entegre auth işlemleri.
 * Özellikler: Name, Surname, Phone, Email, Password
 */

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  
  // Redux state'leri
  const isLoading = useAppSelector(selectIsLoading);
  const error = useAppSelector(selectError);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  // Form state
  const [formData, setFormData] = useState<RegisterRequestDto>({
    name: '',
    surname: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  /**
   * Başarılı kayıt sonrası panel sayfasına yönlendirme
   */
  useEffect(() => {
    if (isAuthenticated) {
      console.log('Register: Kullanıcı authenticated, panel sayfasına yönlendiriliyor...');
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
   * Form validasyonu
   */
  const validateForm = (): boolean => {
    // Ad kontrolü
    if (formData.name.length < 2) {
      setValidationError('Ad en az 2 karakter olmalıdır!');
      return false;
    }

    // Soyad kontrolü
    if (formData.surname.length < 2) {
      setValidationError('Soyad en az 2 karakter olmalıdır!');
      return false;
    }

    // Şifre kontrolü
    if (formData.password !== formData.confirmPassword) {
      setValidationError('Şifreler eşleşmiyor!');
      return false;
    }

    // Şifre uzunluğu kontrolü
    if (formData.password.length < 8) {
      setValidationError('Şifre en az 8 karakter olmalıdır!');
      return false;
    }

    // Kullanım koşulları kontrolü
    if (!acceptTerms) {
      setValidationError('Kullanım koşullarını kabul etmelisiniz!');
      return false;
    }

    setValidationError(null);
    return true;
  };

  /**
   * Form submit handler
   * Kullanıcı kayıt işlemini gerçekleştirir
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submit edildi', formData);
    
    // Validasyon
    if (!validateForm()) {
      console.log('Validasyon başarısız');
      return;
    }

    console.log('Validasyon başarılı, register dispatch ediliyor...');
    
    // Register action'ı dispatch et
    try {
      const result = await dispatch(register(formData));
      console.log('Register sonucu:', result);
    } catch (err) {
      console.error('Register hatası:', err);
    }
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
    
    // Yazarken error'ları temizle
    if (error) {
      dispatch(clearError());
    }
    if (validationError) {
      setValidationError(null);
    }
  };

  // Gösterilecek error mesajı
  const displayError = validationError || error;

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800">Kayıt Ol</h2>
        <p className="text-gray-600 mt-2">
          Yeni hesap oluşturun ve başlayın
        </p>
      </div>

      {/* Error Message */}
      {displayError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{displayError}</span>
          <button 
            onClick={() => {
              dispatch(clearError());
              setValidationError(null);
            }}
            className="text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* Register Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name & Surname Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Name Input */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Ad
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={isLoading}
              placeholder="Ahmet"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Surname Input */}
          <div>
            <label
              htmlFor="surname"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Soyad
            </label>
            <input
              type="text"
              id="surname"
              name="surname"
              value={formData.surname}
              onChange={handleChange}
              required
              disabled={isLoading}
              placeholder="Yılmaz"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Phone Input */}
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Telefon Numarası <span className="text-gray-400">(Opsiyonel)</span>
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            disabled={isLoading}
            placeholder="05XX XXX XX XX"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* Email Input */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            E-posta Adresi
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
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
          <p className="text-xs text-gray-500 mt-1">
            En az 8 karakter, büyük harf, küçük harf ve rakam içermelidir
          </p>
        </div>

        {/* Confirm Password Input */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Şifre Tekrar
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            disabled={isLoading}
            placeholder="••••••••"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* Terms Checkbox */}
        <div>
          <label className="flex items-start">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              disabled={isLoading}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
            />
            <span className="ml-2 text-sm text-gray-600">
              <Link href="/terms" className="text-blue-600 hover:text-blue-700">
                Kullanım Koşullarını
              </Link>{' '}
              ve{' '}
              <Link href="/privacy" className="text-blue-600 hover:text-blue-700">
                Gizlilik Politikasını
              </Link>{' '}
              kabul ediyorum
            </span>
          </label>
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
              Kayıt Yapılıyor...
            </>
          ) : (
            'Kayıt Ol'
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

      {/* Google Register Button */}
      <div className="space-y-3">
        <GoogleLoginButton 
          text="signup_with"
          onSuccess={() => {
            console.log('Google ile kayıt başarılı, yönlendirme yapılacak...');
          }}
          onError={(error) => {
            console.error('Google ile kayıt hatası:', error);
          }}
        />
      </div>

      {/* Login Link */}
      <div className="text-center">
        <p className="text-gray-600">
          Zaten hesabınız var mı?{' '}
          <Link
            href="/login"
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            Giriş Yap
          </Link>
        </p>
      </div>
    </div>
  );
}
