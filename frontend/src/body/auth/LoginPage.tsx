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
  selectIsAuthenticated,
  selectUser
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
  const user = useAppSelector(selectUser);

  // Form state
  const [formData, setFormData] = useState<LoginRequestDto>({
    emailOrUsername: '',
    password: '',
  });
  const [errors, setErrors] = useState<{ emailOrUsername?: string; password?: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState<string | null>(null);

  /**
   * Başarılı giriş sonrası role bazlı yönlendirme
   */
  useEffect(() => {
    if (isAuthenticated && user) {
      const target = user.isAdmin ? '/admin' : '/panel';
      console.log(`Login: Kullanıcı authenticated, yönlendirme: ${target}`);
      router.push(target);
    }
  }, [isAuthenticated, router, user]);

  /**
   * Component unmount olduğunda error'u temizle
   */
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  /**
   * Real-time Validation
   */
  const validateField = (name: string, value: string) => {
    let error = '';
    if (name === 'emailOrUsername') {
      if (!value.trim()) error = 'Email veya kullanıcı adı gereklidir';
      else if (value.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        error = 'Geçerli bir email adresi giriniz';
      }
    } else if (name === 'password') {
      if (!value) error = 'Şifre gereklidir';
      else if (value.length < 6) error = 'Şifre en az 6 karakter olmalıdır';
    }
    setErrors(prev => ({ ...prev, [name]: error }));
    return error === '';
  };

  /**
   * Form submit handler
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isEmailValid = validateField('emailOrUsername', formData.emailOrUsername);
    const isPasswordValid = validateField('password', formData.password);

    if (!isEmailValid || !isPasswordValid) return;

    await dispatch(login(formData));
  };

  /**
   * Input change handler
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    validateField(name, value);
  };

  /**
   * Hata mesajını 3 saniye sonra temizle (Kullanıcı isteği)
   */
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white tracking-tight">Hoş Geldiniz</h2>
        <p className="text-slate-400 text-xs">
          Hesabınıza giriş yaparak devam edin
        </p>
      </div>

      {/* Global Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-3 py-2 rounded-xl flex items-center gap-2 animate-shake">
          <span className="text-sm">⚠️</span>
          <span className="text-xs font-medium">{error}</span>
          <button
            onClick={() => dispatch(clearError())}
            className="ml-auto hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Input */}
        <div className="space-y-1.5 group">
          <label
            htmlFor="emailOrUsername"
            className={`block text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 ${isFocused === 'emailOrUsername' ? 'text-blue-400' : 'text-slate-500'
              }`}
          >
            E-posta veya Kullanıcı Adı
          </label>
          <div className="relative">
            <input
              type="text"
              id="emailOrUsername"
              name="emailOrUsername"
              value={formData.emailOrUsername}
              onChange={handleChange}
              onFocus={() => setIsFocused('emailOrUsername')}
              onBlur={() => setIsFocused(null)}
              disabled={isLoading}
              placeholder="adiniz@ornek.com"
              className={`w-full bg-white/5 border px-4 py-2.5 rounded-xl text-sm text-white placeholder:text-slate-600 outline-none transition-all duration-300 ${errors.emailOrUsername
                ? 'border-red-500/50 focus:border-red-500'
                : 'border-white/5 focus:border-blue-500/30 focus:bg-white/10'
                }`}
            />
          </div>
          {errors.emailOrUsername && (
            <p className="text-red-400 text-[10px] mt-0.5 ml-1 animate-fadeIn">{errors.emailOrUsername}</p>
          )}
        </div>

        {/* Password Input */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label
              htmlFor="password"
              className={`block text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 ${isFocused === 'password' ? 'text-blue-400' : 'text-slate-500'
                }`}
            >
              Şifre
            </label>
            <Link
              href="/forget-password"
              className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors font-bold uppercase"
            >
              Şifreni mi Unuttun?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              onFocus={() => setIsFocused('password')}
              onBlur={() => setIsFocused(null)}
              disabled={isLoading}
              placeholder="••••••••"
              className={`w-full bg-white/5 border px-4 py-2.5 rounded-xl text-sm text-white placeholder:text-slate-600 outline-none transition-all duration-300 ${errors.password
                ? 'border-red-500/50 focus:border-red-500'
                : 'border-white/5 focus:border-blue-500/30 focus:bg-white/10'
                }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.644C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-400 text-[10px] mt-0.5 ml-1 animate-fadeIn">{errors.password}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full relative group overflow-hidden py-3 bg-blue-600 text-white rounded-xl font-bold tracking-wider text-sm transition-all duration-300 hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] disabled:opacity-50 disabled:cursor-not-allowed group mt-2"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Giriş Yapılıyor...</span>
            </div>
          ) : (
            'Giriş Yap'
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative flex items-center py-1">
        <div className="flex-grow border-t border-white/5"></div>
        <span className="mx-3 text-slate-500 text-[9px] font-bold uppercase tracking-[0.2em]">VEYA</span>
        <div className="flex-grow border-t border-white/5"></div>
      </div>

      {/* Google Login Button */}
      <div className="space-y-3">
        <GoogleLoginButton
          text="signin_with"
          onSuccess={() => {
            console.log('Google ile giriş başarılı');
          }}
          onError={(error) => {
            console.error('Google ile giriş hatası:', error);
          }}
        />
      </div>

      {/* Register Link */}
      <div className="text-center pt-1">
        <p className="text-slate-500 text-xs">
          Hesabınız yok mu?{' '}
          <Link
            href="/register"
            className="text-blue-400 hover:text-blue-300 font-bold transition-colors border-b border-blue-400/20 hover:border-blue-300"
          >
            Kayıt Ol
          </Link>
        </p>
      </div>
    </div>
  );
}
